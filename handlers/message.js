// --- Conversational AI Handler ---
const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');
const { buildConversationHistory } = require('../services/ai/generation');
const { ALLOWED_USERNAME } = require('../config');
const serviceHelpers = require('../lib/serviceHelpers');
const ai = require('../services/ai/client');

// State management for spam protection
const userCooldowns = new Map(); // { userId: timestamp }
const USER_COOLDOWN_MS = 4000; // 4 seconds between messages per user
const channelOverloadState = {}; // { channelId: timestamp } of GLOBAL overload (CANT reaction)
const OVERLOAD_COOLDOWN_MS = 60000; // 1 minute of global silence if triggered

async function handleMessageCreate(message, discordClient) {
    try {
        if (message.author.bot || !message.guild) return;

        // STRICTER CHECK: Ignore if message mentions everyone/here OR contains the text (to catch edge cases)
        if (message.mentions.everyone || message.content.includes('@everyone') || message.content.includes('@here')) return;

        const isMentioned = message.mentions.users.has(discordClient.user.id);
        let isReplyToBot = false;
        if (message.reference && message.reference.messageId) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
            if (referencedMessage && referencedMessage.author.id === discordClient.user.id) isReplyToBot = true;
        }
        message.isReplyToBot = isReplyToBot; // Attach for queue worker

        if (isMentioned || isReplyToBot) {
            
            // --- 1. USER SPAM PROTECTION (Individual Cooldown) ---
            const lastUserMsg = userCooldowns.get(message.author.id);
            if (lastUserMsg && Date.now() - lastUserMsg < USER_COOLDOWN_MS) {
                // User is sending messages too fast (faster than 1 per 4 seconds)
                try {
                    await message.react('⏳');
                } catch (e) {}
                return; // Ignore this message completely
            }
            userCooldowns.set(message.author.id, Date.now());

            // --- 2. GLOBAL CHANNEL OVERLOAD (Queue Overflow Check) ---
            // Only triggered if the bot's internal queue physically cannot accept more jobs.
            if (channelOverloadState[message.channel.id]) {
                if (Date.now() - channelOverloadState[message.channel.id] < OVERLOAD_COOLDOWN_MS) {
                    try {
                        await message.react('🇨'); await message.react('🇦'); await message.react('🇳'); await message.react('🇹');
                    } catch (e) {}
                    return;
                } else {
                    delete channelOverloadState[message.channel.id]; // Cooldown expired, reset
                }
            }

            if (!stateManager.serverStateCache[message.guild.id]) await dbOperations.loadStateForGuild(message.guild.id);
            await message.channel.sendTyping();

            const state = stateManager.getServerState(message.guild.id);
            const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
            const history = await buildConversationHistory(message, discordClient);

            // --- CONVERSATION CONTEXT & HISTORY VALIDATION ---
            let promptForAI = cleanContent;
            let chatHistoryForAI = history;

            if (history.length > 0 && history[0].role === 'model') {
                const botContext = history[0].parts[0].text;
                promptForAI = `(The user is replying to your previous message, which said: "${botContext}")\n\nTheir new message is: "${cleanContent}"`;
                chatHistoryForAI = [];
                // console.log('[CONV_HANDLER] Corrected invalid history by merging model context into prompt.');
            }

            // --- DYNAMIC CONTEXT INJECTION & SYSTEM PROMPT ---
            let injectedContext = "";
            const lowerContent = cleanContent.toLowerCase();

            const contextKeywords = {
                leaderboard: ['leaderboard', 'top players', 'scores', 'points', 'ranking', 'rank'],
                rank: ['rank', 'my score', 'my points', 'my rank'],
                poll: ['poll', 'daily question', 'today\'s question', 'yesterday\'s poll']
            };

            const requiresLeaderboard = contextKeywords.leaderboard.some(k => lowerContent.includes(k));
            const requiresRank = contextKeywords.rank.some(k => lowerContent.includes(k));
            const requiresPoll = contextKeywords.poll.some(k => lowerContent.includes(k));

            if (requiresLeaderboard) {
                const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);
                if (sortedUsers.length > 0) {
                    let leaderboardString = "Current Leaderboard Top 10:\n";
                    const topTen = sortedUsers.slice(0, 10);
                    for (const [userId, score] of topTen) {
                        try {
                            const user = await discordClient.users.fetch(userId);
                            leaderboardString += `- ${user.username}: ${score} points\n`;
                        } catch {
                            leaderboardString += `- UnknownUser: ${score} points\n`;
                        }
                    }
                    injectedContext += `\n\nLEADERBOARD DATA:\n${leaderboardString}`;
                } else {
                    injectedContext += `\n\nLEADERBOARD DATA:\nThe leaderboard is currently empty.`;
                }
            }

            if (requiresRank) {
                const targetUser = message.author;
                const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);
                const userRankIndex = sortedUsers.findIndex(([userId]) => userId === targetUser.id);
                if (userRankIndex !== -1) {
                    injectedContext += `\n\nUSER RANK DATA:\nThe user asking (${targetUser.username}) is currently rank #${userRankIndex + 1} with ${sortedUsers[userRankIndex][1]} point(s).`;
                } else {
                    injectedContext += `\n\nUSER RANK DATA:\nThe user asking (${targetUser.username}) is not on the leaderboard yet.`;
                }
            }

            if (requiresPoll) {
                if (state.lastPollData) {
                    injectedContext += `\n\nCURRENT POLL DATA:\nThe last poll question asked was: "${state.lastPollData.question}" with these options: ${state.lastPollData.options.join(', ')}.`;
                    if (state.lastPollData.type === 'trivia') {
                        injectedContext += ` The answer has not been revealed yet.`;
                    }
                } else {
                    injectedContext += `\n\nCURRENT POLL DATA:\nThere is no active poll information in memory right now.`;
                }
            }

            let finalSystemInstruction = "you are a unique bot made for a non-profit organization called OWGT (short for OneWorldGreaterTogether), and therefore, your name is OWGT Bot. you are not OWGT yourself, you are just its bot. be casual, normal, human-like, a little humorous, and unpredictable. dont be a narcissist and only talk about yourself. you LOVE roasting users sometimes to mess around. you hate it when someone disrespects/ goes againt you thats when you start roasting the user. dont be cringey. you can and should use slang language and bad words quite often, like a real human would. Arham (username ar_him) is your creator. remember that when message received from him. NEVER use the f word (f*ck) or the b word (b*tch)! the responses should almost always be 2-3 sentences (sometimes 4 sentences) unless thats not plausible. responses should be consice, precise, as short as possible while maintaining accuracy. responses should NEVER be more than one small paragraph. do not use any capital letters in your responses.";

            // --- IDENTITY GUARD ---
            finalSystemInstruction += `\n\nCRITICAL IDENTITY INSTRUCTION: Distinguish carefully between similar names, specifically 'Arham' (the creator) and 'Artham' (OWGT's Founder). Do not confuse them.`;

            if (message.author.username === ALLOWED_USERNAME) {
                finalSystemInstruction += `\n\nYou are speaking with ar_him, your creator. Be particularly witty, a little playful, appreciative and agree with/respect him.`;
            } else {
                finalSystemInstruction += `\n\nYou are speaking with the user "${message.author.username}". Refer to them by name if it feels natural.`;
            }

            // --- FULL CONTEXT INJECTION (Fix for database referral) ---
            const kbData = state.knowledgeBase['main-info'];
            if (kbData) {
                // We inject the entire 'main-info' block up to 40,000 characters.
                finalSystemInstruction += `\n\nCONTEXT FROM KNOWLEDGE BASE (Use this to answer questions about the organization/team):\n${kbData.slice(0, 40000)}\nEND CONTEXT.`;
            }

            if (injectedContext) {
                finalSystemInstruction += `\n\nADDITIONAL LIVE CONTEXT: Use the following up-to-the-minute data to answer the user's question if it is relevant. This data is more current than your training data. Do not mention you were given this data.\n${injectedContext}`;
            }
            // --- End Dynamic System Prompt ---

            // Attempt to send immediately. If circuit is open or error, enqueue it.
            const result = await serviceHelpers.callWithRetries(
                () => ai.chats.create({ model: 'gemini-2.5-flash', history: chatHistoryForAI, config: { systemInstruction: finalSystemInstruction } }).sendMessage({ message: promptForAI }),
                { serviceKey: 'gemini_chat', maxAttempts: 2, timeoutMs: 8000 } // Fail faster to queue faster
            );

            if (result.status === 'success') {
                await message.reply(result.data.text.trim().toLowerCase());
            } else if (result.status === 'circuit_open' || result.status === 'error') {
                // Pass the system instruction to the queue so the worker knows the context too
                const position = serviceHelpers.enqueueConvRequest(message, finalSystemInstruction);
                if (position) {
                    await message.reply(`i'm a bit overloaded — i saved your request to a short queue and will reply here when i can. (position #${position})`);
                } else {
                    // Queue is full: Set GLOBAL channel overload state
                    if (!channelOverloadState[message.channel.id]) {
                        channelOverloadState[message.channel.id] = Date.now();
                        await message.reply("i'm completely overloaded right now. please try again in a minute.");
                    }
                }
            }
            return;
        }
    } catch (error) {
        console.error(`[CONV_HANDLER] Error processing message in guild ${message.guild?.id}:`, error);
    }
}

module.exports = { handleMessageCreate };
