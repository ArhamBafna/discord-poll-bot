// --- Conversational AI Handler ---
const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');
const { buildConversationHistory, generateChatResponseWithRetries } = require('../services/ai/generation');
const { ALLOWED_USERNAME } = require('../config');
const serviceHelpers = require('../lib/serviceHelpers');

// State management for spam protection
const userCooldowns = new Map(); // { userId: timestamp }
const USER_COOLDOWN_MS = 4000; // 4 seconds between messages per user
const channelOverloadState = {}; // { channelId: timestamp } of GLOBAL overload (CANT reaction)
const OVERLOAD_COOLDOWN_MS = 60000; // 1 minute of global silence if triggered

// --- PROACTIVE ENGAGEMENT SETTINGS ---
const passiveJumps = new Map(); // { channelId: timestamp } of last proactive jump
const JUMP_COOLDOWN_MS = 1200000; // 20 minutes cooldown between proactive jumps per channel
const JUMP_PROBABILITY = 0.62; // 62% chance to jump in if keywords match
const BROAD_KEYWORDS = [
    'ai', 'bot', 'question', 'answer'
];
const MEDIUM_INTENT_KEYWORDS = [
    'llm', 'machine learning', 'openai', 'gemini', 'gpt', 'claude', 'anthropic', 'automation', 'artificial intelligence'
];
const HIGH_INTENT_KEYWORDS = [
    'leaderboard', 'trivia', 'owgt', 'oneworldgreatertogether', 'one world greater together', 'rank', 'points', 'poll', 'score', 'winner',
    'arham', 'artham', 'non-profit', 'education'
];
const QUESTION_INTENT_SIGNALS = ['?', 'how', 'why', 'can someone', 'help'];
const MIN_PROACTIVE_RELEVANCE_SCORE = 3;

// --- NON-PING FOLLOW-UP CONTINUITY ---
const activeUserSessions = new Map(); // { channelId-userId: timestamp }
const SESSION_FOLLOWUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const NO_REPLY_SENTINEL = '[[OWGT_NO_REPLY]]';

function getSessionKey(channelId, userId) {
    return `${channelId}-${userId}`;
}

function markActiveSession(channelId, userId) {
    activeUserSessions.set(getSessionKey(channelId, userId), Date.now());
}

function hasActiveSession(channelId, userId) {
    const key = getSessionKey(channelId, userId);
    const last = activeUserSessions.get(key);
    if (!last) return false;
    if (Date.now() - last > SESSION_FOLLOWUP_WINDOW_MS) {
        activeUserSessions.delete(key);
        return false;
    }
    return true;
}

function isNoReplySignal(text) {
    if (!text) return false;
    return text.trim().toUpperCase() === NO_REPLY_SENTINEL;
}

function isLikelySessionFollowUp(lowerContent) {
    if (!lowerContent) return false;
    if (lowerContent.length < 8) return false;

    const followUpSignals = [
        '?', 'what do you mean', 'can you explain', 'explain', 'how', 'why', 'elaborate',
        'what about', 'and if', 'then what', 'so', 'details', 'example', 'examples'
    ];
    return followUpSignals.some(signal => lowerContent.includes(signal));
}

function computeProactiveRelevanceScore(lowerContent) {
    let score = 0;
    for (const k of BROAD_KEYWORDS) {
        if (lowerContent.includes(k)) score += 1;
    }
    for (const k of MEDIUM_INTENT_KEYWORDS) {
        if (lowerContent.includes(k)) score += 2;
    }
    for (const k of HIGH_INTENT_KEYWORDS) {
        if (lowerContent.includes(k)) score += 3;
    }
    for (const signal of QUESTION_INTENT_SIGNALS) {
        if (lowerContent.includes(signal)) {
            score += 1;
            break;
        }
    }
    return score;
}

function buildAiContents(chatHistory, promptForAI) {
    return [
        ...chatHistory,
        { role: 'user', parts: [{ text: promptForAI }] }
    ];
}

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

        // If user explicitly interacted once, start/refresh continuity tracking immediately.
        if (isMentioned || isReplyToBot) {
            markActiveSession(message.channel.id, message.author.id);
        }

        // --- Determine if we should process this message ---
        let shouldProcess = isMentioned || isReplyToBot;
        let isProactiveJump = false;
        let isSessionFollowUp = false;

        if (!shouldProcess) {
            // Passive listening logic
            const lowerContent = message.content.toLowerCase();
            const proactiveRelevanceScore = computeProactiveRelevanceScore(lowerContent);
            const passesRelevanceThreshold = proactiveRelevanceScore >= MIN_PROACTIVE_RELEVANCE_SCORE;

            if (passesRelevanceThreshold) {
                const lastJump = passiveJumps.get(message.channel.id);
                const onCooldown = lastJump && (Date.now() - lastJump < JUMP_COOLDOWN_MS);

                if (!onCooldown && Math.random() < JUMP_PROBABILITY) {
                    shouldProcess = true;
                    isProactiveJump = true;
                    passiveJumps.set(message.channel.id, Date.now());
                    console.log(`[PROACTIVE][${message.guild.id}][#${message.channel.name}] Jumping in due to keywords.`);
                }
            }
        }

        if (!shouldProcess && hasActiveSession(message.channel.id, message.author.id)) {
            const lowerFollowUpContent = message.content.toLowerCase();
            if (isLikelySessionFollowUp(lowerFollowUpContent)) {
                shouldProcess = true;
                isSessionFollowUp = true;
                console.log(`[FOLLOWUP][${message.guild.id}][#${message.channel.name}] Continuing conversation without ping for user ${message.author.id}.`);
            }
        }

        if (shouldProcess) {

            // --- 1. USER SPAM PROTECTION (Individual Cooldown) ---
            if (!isProactiveJump) { // Only cooldown explicit mentions/follow-ups
                const lastUserMsg = userCooldowns.get(message.author.id);
                if (lastUserMsg && Date.now() - lastUserMsg < USER_COOLDOWN_MS) {
                    try { await message.react('⏳'); } catch (e) {}
                    return;
                }
                userCooldowns.set(message.author.id, Date.now());
            }

            // --- 2. GLOBAL CHANNEL OVERLOAD (Queue Overflow Check) ---
            if (channelOverloadState[message.channel.id]) {
                if (Date.now() - channelOverloadState[message.channel.id] < OVERLOAD_COOLDOWN_MS) {
                    try { await message.react('⏳'); } catch (e) {}
                    return;
                } else {
                    delete channelOverloadState[message.channel.id];
                }
            }

            if (!stateManager.serverStateCache[message.guild.id]) await dbOperations.loadStateForGuild(message.guild.id);
            await message.channel.sendTyping();

            const state = stateManager.getServerState(message.guild.id);
            const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
            const history = await buildConversationHistory(message, discordClient, {
                includeRecentChannelContext: isProactiveJump || isSessionFollowUp,
                recentChannelContextLimit: 7
            });

            // --- CONVERSATION CONTEXT & HISTORY VALIDATION ---
            let promptForAI = cleanContent;
            let chatHistoryForAI = history;

            // Keep legacy reply-chain behavior for explicit replies only.
            if (!isProactiveJump && !isSessionFollowUp && history.length > 0 && history[0].role === 'model') {
                const botContext = history[0].parts[0].text;
                promptForAI = `(The user is replying to your previous message, which said: "${botContext}")\n\nTheir new message is: "${cleanContent}"`;
                chatHistoryForAI = [];
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

            if (isProactiveJump) {
                finalSystemInstruction += `\n\nPROACTIVE INSTRUCTION: You are jumping into this conversation because you found it relevant to AI or OWGT. Do not wait to be mentioned. Be helpful or humorous as if you were just listening in and had something to add.`;
            }
            if (isSessionFollowUp) {
                finalSystemInstruction += `\n\nSESSION CONTINUATION INSTRUCTION: This is a possible follow-up from a recent user conversation with you. Reply only if the message clearly continues that discussion or directly asks for clarification/details. If not clearly directed at you, output exactly ${NO_REPLY_SENTINEL} and nothing else.`;
            }

            // --- IDENTITY GUARD ---
            finalSystemInstruction += `\n\nCRITICAL IDENTITY INSTRUCTION: Distinguish carefully between similar names, specifically 'Arham' (the creator) and 'Artham' (OWGT's Founder). Do not confuse them.`;

            if (message.author.username === ALLOWED_USERNAME) {
                finalSystemInstruction += `\n\nYou are speaking with ar_him, your creator. Be particularly witty, a little playful, appreciative and agree with/respect him.`;
            } else {
                finalSystemInstruction += `\n\nYou are speaking with the user "${message.author.username}". Refer to them by name if it feels natural.`;
            }

            // --- FULL CONTEXT INJECTION (Fix for database referral) ---
            const kbEntries = Object.entries(state.knowledgeBase);
            if (kbEntries.length > 0) {
                let knowledgeContext = "\n\nCONTEXT FROM KNOWLEDGE BASE (Use this to answer questions about the organization/team/AI topics):\n";
                for (const [topic, content] of kbEntries) {
                    knowledgeContext += `--- TOPIC: ${topic} ---\n${content.slice(0, 10000)}\n`;
                }
                knowledgeContext += "END CONTEXT.";
                finalSystemInstruction += knowledgeContext;
            }

            if (injectedContext) {
                finalSystemInstruction += `\n\nADDITIONAL LIVE CONTEXT: Use the following up-to-the-minute data to answer the user's question if it is relevant. This data is more current than your training data. Do not mention you were given this data.\n${injectedContext}`;
            }

            const canSilentlySkipReply = isProactiveJump || isSessionFollowUp;
            if (canSilentlySkipReply) {
                finalSystemInstruction += `\n\nNON-PING SAFETY RULE: If the message looks like social banter (greetings, jokes, one-liners, reactions), interpersonal human-to-human chat (for example "you said", "she/he", or inside jokes), has low intent (no clear question/help/request or actionable topic), or is off-topic for your role, output exactly ${NO_REPLY_SENTINEL} and nothing else.`;
            }
            // --- End Dynamic System Prompt ---

            const aiContents = buildAiContents(chatHistoryForAI, promptForAI);
            const result = await generateChatResponseWithRetries(chatHistoryForAI, promptForAI, finalSystemInstruction, {
                serviceKey: 'gemini_chat',
                temperature: 0.7,
                maxAttempts: 2,
                timeoutMs: 8000
            });

            if (result.status === 'success') {
                const rawReply = (result.data || '').trim();
                if (!rawReply) return;

                if (canSilentlySkipReply && isNoReplySignal(rawReply)) {
                    console.log(`[NON_PING][SKIP] Model returned ${NO_REPLY_SENTINEL}; no reply sent.`);
                    return;
                }

                const reply = rawReply.toLowerCase();
                if (isProactiveJump) {
                    await message.channel.send(reply);
                } else {
                    await message.reply(reply);
                    markActiveSession(message.channel.id, message.author.id);
                }
            } else {
                if (isProactiveJump) {
                    await message.channel.send("i tried processing that, but both ai routes were unavailable. try again in a minute.");
                    return;
                }

                const position = serviceHelpers.enqueueConvRequest(message, {
                    systemInstruction: finalSystemInstruction,
                    contents: aiContents,
                    skipReplySentinel: canSilentlySkipReply,
                    noReplySentinel: NO_REPLY_SENTINEL
                });

                if (position) {
                    // Only tell the user they're "overloaded" when they're actually waiting behind others (position > 1)
                    if (position > 1) {
                        await message.reply(`i'm a bit overloaded — i saved your request to a short queue and will reply here when i can. (position #${position})`);
                    }
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



