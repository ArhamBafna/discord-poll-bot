// A fully automated Discord Bot that posts a dynamic mix of daily trivia and discussion polls.
// Includes a role-restricted on-demand command and a fully automatic community leaderboard system with weekly summaries.
// Version: 4.4 (Bug Fixes & Enhanced Logging)

// --- Import necessary libraries ---
const keepAlive = require('./keepAlive.js');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { GoogleGenAI, Type } = require('@google/genai');
const cron = require('node-cron');
const { Pool } = require('pg');

// --- Global Error Handlers (Safety Net) ---
process.on('unhandledRejection', error => {
    console.error('CRITICAL ERROR: Unhandled Promise Rejection:', error);
    process.exit(1);
});
process.on('uncaughtException', error => {
    console.error('CRITICAL ERROR: Uncaught Exception:', error);
    // Exit on uncaught exceptions to ensure a clean state upon restart by your process manager.
    process.exit(1);
});


// --- Configuration ---
const GEMINI_API_KEY = process.env.API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
// Correctly reads the user's specified environment variable.
const TARGET_CHANNEL_IDS = process.env.TARGET_CHANNEL_IDS ? process.env.TARGET_CHANNEL_IDS.split(',').map(id => id.trim()) : [];
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_USERNAME = 'ar_him';
const CONTROL_ROLE_NAME = 'bot-control';
const COMMAND_PREFIX = '!';

// --- Critical Environment Variable Check ---
if (!GEMINI_API_KEY || !DISCORD_BOT_TOKEN || !TARGET_CHANNEL_IDS.length || !DATABASE_URL) {
  console.error("CRITICAL ERROR: Make sure API_KEY, DISCORD_BOT_TOKEN, DATABASE_URL, and TARGET_CHANNEL_IDS are set in your environment variables. TARGET_CHANNEL_IDS should be a comma-separated list.");
  process.exit(1);
}

// --- Initialize Database and Clients ---
const pool = new Pool({ connectionString: DATABASE_URL });
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- State Management: In-memory cache for performance, keyed by Guild (Server) ID ---
const serverStateCache = {};

// --- Database Functions (Now all guild-aware and with error handling) ---
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // We add 'guild_id' to every table to separate data.
    // The PRIMARY KEY now combines guild_id and the unique item.
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        guild_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        PRIMARY KEY (guild_id, user_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS state (
        guild_id VARCHAR(255) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value JSONB,
        PRIMARY KEY (guild_id, key)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS question_history (
        id SERIAL PRIMARY KEY,
        guild_id VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    console.log('[DATABASE] All tables are set up for multi-server support.');
  } catch (error) {
    console.error('[DATABASE] CRITICAL ERROR: Failed to initialize database.', error);
    process.exit(1);
  }
}

// Helper to get or create a server's state in the cache
function getServerState(guildId) {
    if (!serverStateCache[guildId]) {
        serverStateCache[guildId] = {
            leaderboard: {},
            lastPollData: null,
            activeOnDemandPoll: null,
        };
    }
    return serverStateCache[guildId];
}

async function loadStateForGuild(guildId) {
    console.log(`[STATE] Loading state from DB for server ${guildId}...`);
    const state = getServerState(guildId); // Get or create cache entry
    const client = await pool.connect();
    try {
        const leaderboardRes = await client.query('SELECT user_id, score FROM leaderboard WHERE guild_id = $1', [guildId]);
        state.leaderboard = {};
        leaderboardRes.rows.forEach(row => {
            state.leaderboard[row.user_id] = row.score;
        });
        
        const stateRes = await client.query("SELECT key, value FROM state WHERE guild_id = $1", [guildId]);
        // Reset state before loading
        state.lastPollData = null;
        state.activeOnDemandPoll = null;
        for (const row of stateRes.rows) {
            if (row.key === 'lastPollData') state.lastPollData = row.value;
            if (row.key === 'activeOnDemandPoll') state.activeOnDemandPoll = row.value;
        }
        console.log(`[STATE] State loaded for guild ${guildId}: lastPollData is ${state.lastPollData ? 'present' : 'null'}`);
    } catch (error) {
        console.error(`[STATE] CRITICAL ERROR loading state for server ${guildId}:`, error);
    } finally {
        client.release();
    }
}

async function updateUserScoreInDB(guildId, userId) {
    try {
        const state = getServerState(guildId);
        state.leaderboard[userId] = (state.leaderboard[userId] || 0) + 1;
        await pool.query(`
          INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, 1)
          ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + 1;
        `, [guildId, userId]);
    } catch (error) {
        console.error(`[DATABASE] Failed to update score for user ${userId} in guild ${guildId}:`, error);
    }
}

async function admin_setOrAddUserScore(guildId, userId, amount, mode = 'set') {
    try {
        const query = mode === 'add' ?
            `INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, $3)
             ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + $3
             RETURNING score;` :
            `INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, $3)
             ON CONFLICT (guild_id, user_id) DO UPDATE SET score = $3
             RETURNING score;`;
        const res = await pool.query(query, [guildId, userId, amount]);
        return res.rows.length > 0 ? res.rows[0].score : null;
    } catch (error) {
        console.error(`[DATABASE] Failed to ${mode} score for user ${userId} in guild ${guildId}:`, error);
        return null;
    }
}

async function admin_removeUserScore(guildId, userId, amount) {
    try {
        // This query updates the score but ensures it doesn't go below 0.
        const res = await pool.query(`
            UPDATE leaderboard SET score = GREATEST(0, score - $1) 
            WHERE guild_id = $2 AND user_id = $3
            RETURNING score;
        `, [amount, guildId, userId]);
        // If the user wasn't in the DB, they have 0 points.
        return res.rows.length > 0 ? res.rows[0].score : 0;
    } catch (error) {
        console.error(`[DATABASE] Failed to remove score for user ${userId} in guild ${guildId}:`, error);
        return null;
    }
}

async function saveStateToDB(guildId, key, value) {
    try {
        await pool.query(`
          INSERT INTO state (guild_id, key, value) VALUES ($1, $2, $3)
          ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;
        `, [guildId, key, JSON.stringify(value)]);
    } catch (error) {
        console.error(`[DATABASE] Failed to save state key '${key}' for guild ${guildId}:`, error);
    }
}

async function deleteStateFromDB(guildId, key) {
    try {
        await pool.query('DELETE FROM state WHERE guild_id = $1 AND key = $2', [guildId, key]);
    } catch (error) {
        console.error(`[DATABASE] Failed to delete state key '${key}' for guild ${guildId}:`, error);
    }
}

async function saveQuestionToHistory(guildId, question) {
    try {
        await pool.query('INSERT INTO question_history (guild_id, question) VALUES ($1, $2)', [guildId, question]);
        // Prune old history to keep the table size manageable
        await pool.query(`DELETE FROM question_history WHERE guild_id = $1 AND id NOT IN (SELECT id FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50);`, [guildId]);
    } catch (error) {
        console.error(`[DATABASE] Failed to save question history for guild ${guildId}:`, error);
    }
}

// --- Gemini API Schemas (Stateless) ---
const triviaPollSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["question", "options", "correctAnswerIndex", "explanation"] };
const discussionPollSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 2, maxItems: 4 } }, required: ["question", "options"] };

// --- Gemini API Generation Functions (Stateless) ---
async function generateTriviaPoll(topic = '', history = []) {
    const historyInstruction = history.length > 0 ? `**To ensure variety, you MUST NOT create a poll about any of these recent topics:**\n- "${history.join('"\n- "')}"` : "";
    const prompt = `You generate fun and engaging trivia polls about Artificial Intelligence for a general audience. The questions should be easy to understand (middle/high school level), interesting, and based on well-known AI facts or applications. Avoid overly simple questions like "What does AI stand for?". Good examples are: "Which company created ChatGPT?", "What everyday app uses AI for route navigation?", or "Which game was famously mastered by DeepMind’s AI?". ${topic ? `The poll must be about: **${topic}**.` : ''} ${historyInstruction} **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate the poll based on the provided schema.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: triviaPollSchema, temperature: 0.9 }});
        return JSON.parse(response.text.trim());
    } catch (error) { console.error("[GEMINI] Error generating TRIVIA poll:", error); return null; }
}

async function generateDiscussionPoll() {
    const prompt = `You generate subjective, opinion-based polls about AI to spark community discussion. Good examples: "What AI Model do you primarily use?", "Will AI take over the world?". **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate poll based on schema.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: discussionPollSchema, temperature: 1.0 }});
        return JSON.parse(response.text.trim());
    } catch (error) { console.error("[GEMINI] Error generating DISCUSSION poll:", error); return null; }
}

// --- Main Scheduled Post Function (Now accepts a catch-up flag) ---
async function performDailyPost(channelId, isCatchUp = false) {
    console.log(`[POLL] Starting daily post for channel: ${channelId}. Catch-up mode: ${isCatchUp}`);
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) { console.error(`[POLL] Channel ${channelId} not found or is not in a server.`); return; }
        
        const guildId = channel.guild.id;
        await loadStateForGuild(guildId); // Ensure state is loaded
        const state = getServerState(guildId);
        
        console.log(`[POLL][${guildId}] Checking for previous poll to resolve. lastPollData found: ${!!state.lastPollData}`);
        if (state.lastPollData && state.lastPollData.type === 'trivia' && state.lastPollData.pollMessageId) {
            try {
                const pollMessage = await channel.messages.fetch(state.lastPollData.pollMessageId);
                const correctAnswer = pollMessage.poll.answers.at(state.lastPollData.correctAnswerIndex);
                const voters = await correctAnswer.fetchVoters();
                let winners = [];
                for (const user of voters.values()) {
                    if (!user.bot) {
                        await updateUserScoreInDB(guildId, user.id);
                        winners.push(user.username);
                    }
                }
                const correctOptionLetter = String.fromCharCode(65 + state.lastPollData.correctAnswerIndex);
                const answerEmbed = new EmbedBuilder().setColor('#5865F2').setTitle(`Yesterday's Poll Answer 🧐`).setDescription(`The correct answer to **"${state.lastPollData.question}"** was **${correctOptionLetter}: ${state.lastPollData.options[state.lastPollData.correctAnswerIndex]}**.\n\n${state.lastPollData.explanation}`).addFields({ name: 'Leaderboard Update', value: `**${winners.length}** member(s) answered correctly and have been awarded a point!` });
                await channel.send({ embeds: [answerEmbed] });
            } catch (fetchError) { console.error(`[POLL][${guildId}] Could not fetch or process previous poll message (ID: ${state.lastPollData?.pollMessageId}). It may have been deleted, or the bot lacks permissions.`, fetchError); }
        }

        const dayOfWeek = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long' });
        const isDiscussionDay = ['Tuesday', 'Friday'].includes(dayOfWeek);
        let questionHistory = [];
        if (!isDiscussionDay) {
            const historyRes = await pool.query('SELECT question FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 25', [guildId]);
            questionHistory = historyRes.rows.map(row => row.question);
        }
        
        const newPollData = isDiscussionDay ? await generateDiscussionPoll() : await generateTriviaPoll('', questionHistory);
        if (newPollData) {
            newPollData.type = isDiscussionDay ? 'discussion' : 'trivia';
            
            let pollIntroMessage;
            if (isCatchUp) {
                pollIntroMessage = "Oops, forgot to post the poll today! Here it is... 😅";
            } else {
                pollIntroMessage = newPollData.type === 'discussion' ? "**Let's Discuss!** 🤔" : "**Today's AI Poll!** 🧠";
            }

            const newPollMessage = await channel.send({ content: pollIntroMessage, poll: { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultoselect: false } });
            newPollData.pollMessageId = newPollMessage.id;
            newPollData.createdAt = new Date().toISOString(); // Timestamp for catch-up logic
            
            state.lastPollData = newPollData;
            await saveStateToDB(guildId, 'lastPollData', newPollData);
            if (newPollData.type === 'trivia') await saveQuestionToHistory(guildId, newPollData.question);
        }
    } catch (error) { console.error(`[POLL][Channel: ${channelId}] A critical error occurred during the daily post:`, error); }
}

async function postWeeklySummary(channelId) {
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) return;
        const guildId = channel.guild.id;
        await loadStateForGuild(guildId);
        const state = getServerState(guildId);
        const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);

        if (sortedUsers.length === 0) return;

        let leaderboardString = "";
        for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
            const [userId, score] = sortedUsers[i];
            try {
                const user = await discordClient.users.fetch(userId);
                leaderboardString += `${i + 1}. ${user.username} - ${score} points\n`;
            } catch { /* Skip users who may have left */ }
        }
        
        const prompt = `You are a fun and engaging Discord bot. Write a short, human-like summary for the end-of-week AI poll leaderboard. Here is the data:\n${leaderboardString}\nCongratulate the winner(s), mention some other top players, encourage everyone, and say you're excited for next week. Keep it concise and positive.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const summaryEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 Weekly Poll Report 🏆').setDescription(response.text).addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' }).setFooter({ text: 'A new week of polls starts tomorrow!' });
        await channel.send({ embeds: [summaryEmbed] });
    } catch(error) { console.error(`[LEADERBOARD][Channel: ${channelId}] Failed to post weekly summary:`, error); }
}

async function checkForMissedPolls() {
    console.log('[STARTUP] Checking for any missed daily polls due to downtime...');
    const now = new Date();
    const nyTimezone = 'America/New_York';

    // Get the current hour in New York using a reliable method.
    const currentHourNY = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: nyTimezone,
        hour: '2-digit',
        hour12: false // Use 24-hour format for simplicity (00-23)
    }).format(now), 10);

    // The poll is scheduled for 10 AM. If it's earlier than that in NY, no poll was missed today.
    if (currentHourNY < 10) {
        console.log(`[STARTUP] It is before 10 AM in New York (Current Hour: ${currentHourNY}). No scheduled polls should have been posted yet today.`);
        return;
    }

    for (const channelId of TARGET_CHANNEL_IDS) {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !channel.guild) {
                console.warn(`[STARTUP] Could not find channel/guild for ID ${channelId}. Skipping.`);
                continue;
            }
            const guildId = channel.guild.id;

            await loadStateForGuild(guildId);
            const state = getServerState(guildId);
            
            if (state.lastPollData && state.lastPollData.createdAt) {
                const lastPostDate = new Date(state.lastPollData.createdAt); // This is a UTC Date object
                
                // Reliably format both the current date and the last post date into YYYY-MM-DD strings *in the NY timezone*.
                // This avoids all timezone conversion errors when comparing dates.
                const formatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' gives the YYYY-MM-DD format
                    timeZone: nyTimezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });

                const todayNYString = formatter.format(now);
                const lastPostDateNYString = formatter.format(lastPostDate);

                if (lastPostDateNYString < todayNYString) {
                    console.log(`[STARTUP] Missed poll detected for channel ${channelId}. Last post was on ${lastPostDateNYString}, but today is ${todayNYString}. Triggering catch-up.`);
                    await performDailyPost(channelId, true);
                } else {
                    console.log(`[STARTUP] Poll for channel ${channelId} was already posted today (${lastPostDateNYString}). No action needed.`);
                }
            } else {
                // This handles the very first run for a channel.
                console.log(`[STARTUP] No previous poll data found for channel ${channelId}. Triggering initial post.`);
                await performDailyPost(channelId, true);
            }
        } catch (error) {
            console.error(`[STARTUP] CRITICAL ERROR during catch-up check for channel ${channelId}:`, error);
        }
    }
    console.log('[STARTUP] Missed poll check complete.');
}


// --- Bot Startup Logic ---
discordClient.once('ready', async () => {
  console.log('--- Bot is starting up ---');
  await initializeDatabase();
  console.log(`Logged in as ${discordClient.user.tag}!`);

  // Run the catch-up check once on startup.
  await checkForMissedPolls();

  // Schedule future tasks for each target channel
  TARGET_CHANNEL_IDS.forEach(channelId => {
    // This is the normal, on-time schedule, so isCatchUp is false by default.
    cron.schedule('0 10 * * *', () => performDailyPost(channelId), { scheduled: true, timezone: "America/New_York" });
    cron.schedule('0 21 * * 0', () => postWeeklySummary(channelId), { scheduled: true, timezone: "America/New_York" });
    console.log(`[SCHEDULER] Daily and weekly tasks scheduled for channel ${channelId}.`);
  });
  
  console.log('--- Bot is fully operational. ---');
});

// --- Command Handler (Now guild-aware AND with robust error handling) ---
discordClient.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.guild || !message.content.startsWith(COMMAND_PREFIX)) return;

        const guildId = message.guild.id;
        const hasPermission = message.author.username === ALLOWED_USERNAME || message.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);
        const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        // Lazy-load state for the server if a command is run
        if (!serverStateCache[guildId]) {
            await loadStateForGuild(guildId);
        }
        const state = getServerState(guildId);

        // --- Commands ---
        if (command === 'asknow' && hasPermission) {
            if (state.activeOnDemandPoll) { return message.reply("There's already an active on-demand poll in this server. Use `!reveal` to end it."); }
            const topic = args.join(' ');
            await message.channel.send(`On-demand trivia poll requested for topic "${topic || 'Any AI topic'}". Generating...`);
            const pollData = await generateTriviaPoll(topic, []);
            if (pollData) {
                const pollMessage = await message.channel.send({ content: `**Special On-Demand Poll!** ✨`, poll: { question: { text: pollData.question }, answers: pollData.options.map(o => ({ text: o })), duration: 24, allowMultoselect: false } });
                state.activeOnDemandPoll = { ...pollData, messageId: pollMessage.id };
                await saveStateToDB(guildId, 'activeOnDemandPoll', state.activeOnDemandPoll);
            } else { await message.channel.send("Sorry, I couldn't generate a poll from the AI right now."); }
        }

        if (command === 'reveal' && hasPermission) {
            if (!state.activeOnDemandPoll) { return message.reply("There is no active on-demand poll to reveal in this server."); }
            const pollData = state.activeOnDemandPoll;
            const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);
            const answerEmbed = new EmbedBuilder().setColor('#2ECC71').setTitle('Answer & Explanation 🧐').setDescription(`**Q: ${pollData.question}**`).addFields({ name: 'Correct Answer', value: `**${correctOptionLetter}: ${pollData.options[pollData.correctAnswerIndex]}**` }, { name: 'Explanation', value: pollData.explanation }).setFooter({text: 'On-demand polls do not award points.'});
            await message.channel.send({ embeds: [answerEmbed] });
            state.activeOnDemandPoll = null;
            await deleteStateFromDB(guildId, 'activeOnDemandPoll');
        }
        
        if (command === 'points' && hasPermission) {
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated 'points' command. Full command: "${message.content}"`);
            const subCommand = args.shift()?.toLowerCase();
            const targetUser = message.mentions.users.first();
            // The amount is the argument after the user mention.
            const amount = parseInt(args[1], 10);

            if (!['add', 'remove', 'set'].includes(subCommand)) return message.reply('Invalid sub-command. Use `add`, `remove`, or `set`.');
            if (!targetUser) return message.reply('You must mention a user to modify their points.');
            if (isNaN(amount) || amount < 0) return message.reply('Please provide a valid, positive number for the amount. Use the `remove` subcommand to subtract points.');

            let newScore;
            let replyMessage;

            switch (subCommand) {
                case 'add':
                    newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'add');
                    if (newScore !== null) {
                        console.log(`[POINTS][${guildId}] Added ${amount} points to ${targetUser.username}. New score: ${newScore}.`);
                        state.leaderboard[targetUser.id] = newScore;
                        replyMessage = `💰 Success! Added **${amount}** points to **${targetUser.username}**. Their new score is **${newScore}**.`;
                    }
                    break;
                case 'remove':
                    newScore = await admin_removeUserScore(guildId, targetUser.id, amount);
                    if (newScore !== null) {
                        console.log(`[POINTS][${guildId}] Removed ${amount} points from ${targetUser.username}. New score: ${newScore}.`);
                        state.leaderboard[targetUser.id] = newScore;
                        replyMessage = `💸 Success! Removed **${amount}** points from **${targetUser.username}**. Their new score is **${newScore}**.`;
                    }
                    break;
                case 'set':
                    newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'set');
                    if (newScore !== null) {
                        console.log(`[POINTS][${guildId}] Set ${targetUser.username}'s score to ${newScore}.`);
                        state.leaderboard[targetUser.id] = newScore;
                        replyMessage = `📊 Success! Set **${targetUser.username}**'s score to **${newScore}**.`;
                    }
                    break;
            }
            
            if (replyMessage) {
                await message.reply(replyMessage);
            } else {
                console.error(`[POINTS][${guildId}] Database error during 'points' command execution. Subcommand: ${subCommand}, Target: ${targetUser.username}`);
                await message.reply('A database error occurred while trying to modify the user\'s score.');
            }
        }

        if (command === 'postdaily' && hasPermission) {
            await message.reply("Acknowledged. Manually triggering the full daily poll process for this channel...");
            await performDailyPost(message.channel.id, true);
        }
        
        if (command === 'leaderboard' || command === 'rank') {
            const sortedUsers = Object.entries(state.leaderboard).sort(([,a],[,b]) => b - a);
            if (sortedUsers.length === 0) { return message.channel.send('The leaderboard for this server is empty!'); }
            
            if (command === 'leaderboard') {
                let description = '';
                for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
                    const [userId, score] = sortedUsers[i];
                    try {
                        const user = await discordClient.users.fetch(userId);
                        description += `**${i + 1}. ${user.username}** - ${score} points\n`;
                    } catch { description += `**${i + 1}.** *Unknown User* - ${score} points\n`; }
                }
                const embed = new EmbedBuilder().setColor('#F1C40F').setTitle(`🏆 AI Poll Leaderboard for ${message.guild.name} 🏆`).setDescription(description);
                await message.channel.send({ embeds: [embed] });
            } else { // rank command
                const targetUser = message.mentions.users.first() || message.author;
                const userRankIndex = sortedUsers.findIndex(([userId]) => userId === targetUser.id);
                if (userRankIndex !== -1) {
                    await message.channel.send(`${targetUser.username}, you are currently **rank #${userRankIndex + 1}** in this server with **${sortedUsers[userRankIndex][1]}** point(s).`);
                } else {
                    await message.channel.send(`${targetUser.username}, you are not on this server's leaderboard yet.`);
                }
            }
        }

        if (command === 'help') {
            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🤖 Bot Commands').setDescription('Here are the available commands:');
            embed.addFields({ name: `${COMMAND_PREFIX}leaderboard`, value: 'Displays the top 10 players for this server.' }, { name: `${COMMAND_PREFIX}rank [@user]`, value: 'Shows your rank or a mentioned user\'s rank in this server.' }, { name: `${COMMAND_PREFIX}help`, value: 'Shows this help message.' });
            if (hasPermission) {
                embed.addFields(
                  { name: '--- Admin Commands ---', value: '\u200B' }, 
                  { name: `${COMMAND_PREFIX}points <add|remove|set> <@user> <amount>`, value: 'Manually adjusts a user\'s points.'},
                  { name: `${COMMAND_PREFIX}asknow [topic]`, value: 'Starts an on-demand poll in this server.' }, 
                  { name: `${COMMAND_PREFIX}reveal`, value: 'Reveals the answer for the active poll in this server.' }, 
                  { name: `${COMMAND_PREFIX}postdaily`, value: 'Manually triggers the daily poll sequence in this channel.' }
                );
            }
            await message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`[COMMAND_HANDLER] Error processing command in guild ${message.guild?.id} for user ${message.author?.id}:`, error);
        try {
            // Attempt to notify the user that something went wrong.
            await message.reply("Oops! Something went wrong while processing your command. The incident has been logged.");
        } catch (replyError) {
            console.error(`[COMMAND_HANDLER] CRITICAL: Failed to send error reply in guild ${message.guild?.id}. Bot may lack permissions.`, replyError);
        }
    }
});

// --- Login to Discord ---
discordClient.login(DISCORD_BOT_TOKEN);
keepAlive();
