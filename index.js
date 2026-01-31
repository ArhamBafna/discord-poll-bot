// --- AI ASSISTANT INSTRUCTION --- READ THE `AI_ASSISTANT_README.md` FILE BEFORE MAKING ANY CHANGES. IT CONTAINS CRITICAL, PERMANENT DIRECTIVES FOR THIS PROJECT. --- END OF INSTRUCTION ---

// A fully automated Discord Bot that posts a dynamic mix of daily trivia and discussion polls.
// Includes a role-restricted on-demand command and a fully automatic community leaderboard system with weekly summaries.
// Version: 7.2 (Slash Commands, Interactive KB, Spam Protection & Stability Fixes)

// --- Network Hardening & IPv4 Enforcement ---
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const https = require('https');

// --- Import necessary libraries ---
const keepAlive = require('./keepAlive.js');
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, Routes, REST, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');

// --- Helper for Timestamped Logs ---
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    if (level === 'ERROR' || level === 'FATAL') {
        console.error(logMessage);
    } else {
        console.log(logMessage);
    }
}

const { GoogleGenAI, Type } = require('@google/genai');
const cron = require('node-cron');
const { Pool } = require('pg');
const serviceHelpers = require('./lib/serviceHelpers.js');

// --- Global Error Handlers (Safety Net) ---
process.on('unhandledRejection', err => {
    log(`Unhandled rejection: ${err.message || err}`, 'FATAL');
    console.error(err); // Keep full stack trace
});

process.on('uncaughtException', err => {
    log(`Uncaught exception: ${err.message || err}`, 'FATAL');
    console.error(err); // Keep full stack trace
});


// --- Configuration ---
const GEMINI_API_KEY = process.env.API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TARGET_CHANNEL_IDS = process.env.TARGET_CHANNEL_IDS ? process.env.TARGET_CHANNEL_IDS.split(',').map(id => id.trim()) : [];
const DATABASE_URL = process.env.DATABASE_URL;
const ALLOWED_USERNAME = 'ar_him';
const CONTROL_ROLE_NAME = 'bot-control';

// --- Critical Environment Variable Check ---
if (!GEMINI_API_KEY || !DISCORD_BOT_TOKEN || !TARGET_CHANNEL_IDS.length || !DATABASE_URL) {
    console.error("CRITICAL ERROR: Make sure API_KEY, DISCORD_BOT_TOKEN, DATABASE_URL, and TARGET_CHANNEL_IDS are set in your environment variables. TARGET_CHANNEL_IDS should be a comma-separated list.");
    process.exit(1);
}

// --- Database Connection Sanitization ---
let sanitizedDbUrl = DATABASE_URL;
try {
    const dbUrl = new URL(DATABASE_URL);
    if (dbUrl.searchParams.has('transaction_timeout')) {
        dbUrl.searchParams.delete('transaction_timeout');
        sanitizedDbUrl = dbUrl.toString();
        console.log('[DATABASE] Removed unsupported "transaction_timeout" parameter from DB connection string.');
    }
} catch (e) {
    console.error('[DATABASE] Could not parse DATABASE_URL. Using it as is.', e);
}


// --- Initialize Database and Clients ---
const pool = new Pool({ connectionString: sanitizedDbUrl });

// Hardened Discord Client Options
const discordClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers
    ],
    rest: {
        timeout: 60000,
        retries: 5
    },
    ws: {
        large_threshold: 50
    },
    failIfNotExists: false
});

let ai;
try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    discordClient.ai = ai; // Attach to client for queue worker access
    console.log('[GEMINI] Gemini API client initialized successfully.');
} catch (error) {
    console.error('[GEMINI] CRITICAL: Failed to initialize the Gemini API client. This is often due to a library or environment issue. Please check the error details below.');
    console.error(error);
    process.exit(1);
}


// --- Fallback Polls (for API failures) ---
const FALLBACK_POLLS = [
    { type: 'trivia', question: "i lowk cant generate the poll today so go ahead:", options: ["wrong answer", "not right", "pick me right answer", "lebron"], correctAnswerIndex: 3, explanation: "right answer was c because... its obvious. if u didnt get that right u should just quit atp. btw, i love lebron. blah blah blah long response blah" },
    { type: 'trivia', question: "how many fours make up six sevens and two?", options: ["11", "67", "41", "7"], correctAnswerIndex: 1, explanation: "To solve this, first, calculate the value of six sevens and two. Step 1: Multiply six by seven = 42. Step 2: Add two 42+2=44 Step 3: Determine how many fours are in the total. To find out how many fours make up 44, divide 44 by 4 = 11. Therefore, 11 fours make up six sevens and two." },
    { type: 'trivia', question: "ai?", options: ["not ai", "ai", "not artificial intelligence", "option 5"], correctAnswerIndex: 2, explanation: "Neural Networks are computational models inspired by the human brain's structure. They are designed to recognize complex patterns in data, making them powerful tools for tasks like image recognition, natural language processing, and forecasting." }
];

// --- State Management ---
const serverStateCache = {};
const postingLock = new Set(); // Prevents concurrent poll posting
const inviteCache = new Map(); // In-memory cache for server invites { guildId: Map<inviteCode, uses> }
const channelOverloadState = {}; // { channelId: timestamp } of GLOBAL overload (CANT reaction)
const OVERLOAD_COOLDOWN_MS = 60000; // 1 minute of global silence if triggered
const userCooldowns = new Map(); // { userId: timestamp }
const USER_COOLDOWN_MS = 4000; // 4 seconds between messages per user

// --- Database Functions ---
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS leaderboard (guild_id VARCHAR(255) NOT NULL, user_id VARCHAR(255) NOT NULL, score INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id));`);
        await client.query(`CREATE TABLE IF NOT EXISTS state (guild_id VARCHAR(255) NOT NULL, key VARCHAR(255) NOT NULL, value JSONB, PRIMARY KEY (guild_id, key));`);
        await client.query(`CREATE TABLE IF NOT EXISTS question_history (id SERIAL PRIMARY KEY, guild_id VARCHAR(255) NOT NULL, question TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS knowledge_base (guild_id VARCHAR(255) NOT NULL, key VARCHAR(255) NOT NULL, value TEXT NOT NULL, PRIMARY KEY (guild_id, key));`);
        await client.query(`CREATE TABLE IF NOT EXISTS invites (guild_id VARCHAR(255) NOT NULL, code VARCHAR(255) NOT NULL, inviter_id VARCHAR(255) NOT NULL, uses INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, code));`);
        console.log('[DATABASE] All tables are set up for multi-server support.');
    } catch (error) {
        console.error('[DATABASE] CRITICAL ERROR: Failed to initialize database.', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

function getServerState(guildId) {
    if (!serverStateCache[guildId]) {
        serverStateCache[guildId] = { leaderboard: {}, lastPollData: null, activeOnDemandPoll: null, knowledgeBase: {}, lastSuccessfulPoll: null };
    }
    return serverStateCache[guildId];
}

async function loadStateForGuild(guildId) {
    // console.log(`[STATE] Loading state from DB for server ${guildId}...`);
    const state = getServerState(guildId);
    const client = await pool.connect();
    try {
        const leaderboardRes = await client.query('SELECT user_id, score FROM leaderboard WHERE guild_id = $1', [guildId]);
        state.leaderboard = {};
        leaderboardRes.rows.forEach(row => { state.leaderboard[row.user_id] = row.score; });

        const stateRes = await client.query("SELECT key, value FROM state WHERE guild_id = $1", [guildId]);
        state.lastPollData = null;
        state.activeOnDemandPoll = null;
        state.lastSuccessfulPoll = null;
        for (const row of stateRes.rows) {
            if (row.key === 'lastPollData') state.lastPollData = row.value;
            if (row.key === 'activeOnDemandPoll') state.activeOnDemandPoll = row.value;
            if (row.key === 'lastSuccessfulPoll') state.lastSuccessfulPoll = row.value;
        }

        const knowledgeRes = await client.query('SELECT key, value FROM knowledge_base WHERE guild_id = $1', [guildId]);
        state.knowledgeBase = {};
        knowledgeRes.rows.forEach(row => { state.knowledgeBase[row.key] = row.value; });

        // console.log(`[STATE] State loaded for guild ${guildId}.`);
    } catch (error) {
        console.error(`[STATE] CRITICAL ERROR loading state for server ${guildId}:`, error);
    } finally {
        client.release();
    }
}

async function batchUpdateScoresInDB(guildId, userIds) {
    if (!userIds || userIds.length === 0) return;
    try {
        await pool.query(`INSERT INTO leaderboard (guild_id, user_id, score) SELECT $1, user_id, 1 FROM unnest($2::varchar[]) AS t(user_id) ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + 1;`, [guildId, userIds]);
    } catch (error) { console.error(`[DATABASE] Failed to batch update scores for ${userIds.length} users in guild ${guildId}:`, error); }
}
async function admin_setOrAddUserScore(guildId, userId, amount, mode = 'set') {
    try {
        const query = mode === 'add' ? `INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, $3) ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + $3 RETURNING score;` : `INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, $3) ON CONFLICT (guild_id, user_id) DO UPDATE SET score = $3 RETURNING score;`;
        const res = await pool.query(query, [guildId, userId, amount]);
        return res.rows.length > 0 ? res.rows[0].score : null;
    } catch (error) { console.error(`[DATABASE] Failed to ${mode} score for user ${userId} in guild ${guildId}:`, error); return null; }
}
async function admin_removeUserScore(guildId, userId, amount) {
    try {
        const res = await pool.query(`UPDATE leaderboard SET score = GREATEST(0, score - $1) WHERE guild_id = $2 AND user_id = $3 RETURNING score;`, [amount, guildId, userId]);
        return res.rows.length > 0 ? res.rows[0].score : 0;
    } catch (error) { console.error(`[DATABASE] Failed to remove score for user ${userId} in guild ${guildId}:`, error); return null; }
}
async function admin_saveKnowledgeBase(guildId, key, value) {
    try {
        await pool.query(`INSERT INTO knowledge_base (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;`, [guildId, key, value]);
        return true;
    } catch (error) {
        console.error(`[DATABASE] Failed to save knowledge base for key '${key}' in guild ${guildId}:`, error);
        return false;
    }
}
async function saveStateToDB(guildId, key, value) {
    try {
        await pool.query(`INSERT INTO state (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;`, [guildId, key, JSON.stringify(value)]);
    } catch (error) { console.error(`[DATABASE] Failed to save state key '${key}' for guild ${guildId}:`, error); }
}
async function deleteStateFromDB(guildId, key) {
    try {
        await pool.query('DELETE FROM state WHERE guild_id = $1 AND key = $2', [guildId, key]);
    } catch (error) { console.error(`[DATABASE] Failed to delete state key '${key}' for guild ${guildId}:`, error); }
}
async function saveQuestionToHistory(guildId, question) {
    try {
        await pool.query('INSERT INTO question_history (guild_id, question) VALUES ($1, $2)', [guildId, question]);
        await pool.query(`DELETE FROM question_history WHERE guild_id = $1 AND id NOT IN (SELECT id FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50);`, [guildId]);
    } catch (error) { console.error(`[DATABASE] Failed to save question history for guild ${guildId}:`, error); }
}

// --- Invite Tracking Helper ---
async function cacheAndSyncInvites(guild) {
    try {
        if (!guild.members.me.permissions.has('ManageGuild')) {
            console.log(`[INVITES] Missing 'Manage Server' permission in ${guild.name}. Skipping invite tracking.`);
            return;
        }
        const invites = await guild.invites.fetch();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Clear old invites for this guild to handle deletions that happened while offline
            await client.query('DELETE FROM invites WHERE guild_id = $1', [guild.id]);
            for (const inv of invites.values()) {
                if (inv.inviter) {
                    await client.query(
                        `INSERT INTO invites (guild_id, code, inviter_id, uses) VALUES ($1, $2, $3, $4)`,
                        [guild.id, inv.code, inv.inviter.id, inv.uses]
                    );
                }
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        inviteCache.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
        // console.log(`[INVITES] Synced and cached ${invites.size} invites for guild ${guild.name}.`);
    } catch (err) {
        console.error(`[INVITES] Failed to sync invites for guild ${guild.name} (${guild.id}).`, err.message.includes('Missing Access') ? 'Missing Permissions.' : err);
    }
}

// --- Gemini API Schemas (Stateless) ---
const triviaPollSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["question", "options", "correctAnswerIndex", "explanation"] };

// --- Gemini API Generation Functions ---

async function generateTextWithRetries(prompt, serviceKey = 'gemini') {
    const result = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }),
        { serviceKey, maxAttempts: 2, timeoutMs: 10000 }
    );
    if (result.status === 'success') {
        return result.data.text.trim();
    }
    console.error(`[GEMINI] Failed to generate text for service ${serviceKey}.`);
    return null;
}

async function generatePollWithRetries(prompt, schema, temperature, serviceKey = 'gemini_poll') {
    const result = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema, temperature: temperature } }),
        { serviceKey, timeoutMs: 20000, maxAttempts: 3 }
    );

    if (result.status === 'success') {
        try {
            return { status: 'success', data: JSON.parse(result.data.text.trim()) };
        } catch (parseError) {
            console.error('[GEMINI] Failed to parse JSON response from AI:', parseError);
            return { status: 'error', permanent: true, error: parseError };
        }
    }
    return result;
}

async function generateTriviaPoll(topic = '', history = []) {
    const historyInstruction = history.length > 0 ? `Here is a list of recent questions to avoid repeating:\n- "${history.join('"\n- "')}"` : "";
    const prompt = `You are an expert AI trivia poll creator. Your primary goal is to generate a NEW and UNIQUE trivia question about Artificial Intelligence for a general audience. The question must be interesting and based on well-known AI facts.

**ABSOLUTE RULE: It is forbidden to generate a question that is the same as or very similar to any question in the history list provided below.** Do not rephrase or slightly modify past questions. Create something entirely new.

${topic ? `The poll must be about: **${topic}**.` : ''}

${historyInstruction}

**CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate the poll based on the provided schema.`;

    const normalizedHistory = new Set(history.map(q => q.toLowerCase().trim()));
    const MAX_UNIQUE_ATTEMPTS = 5;

    for (let attempt = 1; attempt <= MAX_UNIQUE_ATTEMPTS; attempt++) {
        const pollResult = await generatePollWithRetries(prompt, triviaPollSchema, 0.9, 'gemini_trivia');
        if (pollResult.status !== 'success') return pollResult; // Propagate failure up

        const pollData = pollResult.data;
        const normalizedNewQuestion = pollData.question.toLowerCase().trim();
        if (!normalizedHistory.has(normalizedNewQuestion)) {
            return { status: 'success', data: pollData }; // Found a unique question
        }

        console.warn(`[GEMINI][UNIQUE] Generated a duplicate trivia question on attempt ${attempt}/${MAX_UNIQUE_ATTEMPTS}. Retrying for a unique one...`);
    }

    console.error(`[GEMINI] CRITICAL: Failed to generate a unique trivia poll after ${MAX_UNIQUE_ATTEMPTS} attempts.`);
    return { status: 'error', permanent: false, error: new Error('Failed to generate unique question') };
}


// --- Conversational AI & Knowledge Base Logic ---
async function buildConversationHistory(message) {
    const history = [];
    let currentReference = message.reference;
    for (let i = 0; i < 10 && currentReference && currentReference.messageId; i++) {
        try {
            const referencedMessage = await message.channel.messages.fetch(currentReference.messageId);
            if (referencedMessage.author.id === message.author.id || referencedMessage.author.id === discordClient.user.id) {
                history.unshift({ role: referencedMessage.author.id === discordClient.user.id ? 'model' : 'user', parts: [{ text: referencedMessage.content }] });
            } else { break; }
            currentReference = referencedMessage.reference;
        } catch { break; }
    }
    return history;
}

// --- Poll Resolution Function ---
async function resolveLastPoll(channel) {
    if (!channel || !channel.guild) { console.error(`[RESOLVE] Invalid channel provided.`); return false; }
    const guildId = channel.guild.id;
    if (!serverStateCache[guildId]) await loadStateForGuild(guildId);
    const state = getServerState(guildId);

    if (state.lastPollData && state.lastPollData.type === 'trivia' && state.lastPollData.pollMessageId) {
        const pollId = state.lastPollData.pollMessageId;
        console.log(`[RESOLVE][${guildId}][#${channel.name}] Resolving trivia poll (ID: ${pollId}).`);
        try {
            const pollMessage = await channel.messages.fetch(pollId);
            if (!pollMessage.poll) return false;
            const correctAnswer = pollMessage.poll.answers.at(state.lastPollData.correctAnswerIndex);
            if (!correctAnswer) return false;
            // FIX: fetchVoters is deprecated in newer discord.js versions
            const voters = await correctAnswer.voters.fetch();
            const winnerIds = Array.from(voters.values()).filter(u => !u.bot).map(u => u.id);
            const winnerUsernames = Array.from(voters.values()).filter(u => !u.bot).map(u => u.username);

            if (winnerIds.length > 0) {
                await batchUpdateScoresInDB(guildId, winnerIds);
                winnerIds.forEach(userId => { state.leaderboard[userId] = (state.leaderboard[userId] || 0) + 1; });
            }

            const correctOptionLetter = String.fromCharCode(65 + state.lastPollData.correctAnswerIndex);
            const answerEmbed = new EmbedBuilder().setColor('#5865F2').setTitle(`Yesterday's Poll Answer 🧐`).setDescription(`The correct answer to **"${state.lastPollData.question}"** was **${correctOptionLetter}: ${state.lastPollData.options[state.lastPollData.correctAnswerIndex]}**.\n\n${state.lastPollData.explanation}`).addFields({ name: 'Leaderboard Update', value: `**${winnerUsernames.length}** member(s) answered correctly and have been awarded a point!` });
            await channel.send({ embeds: [answerEmbed] });
            return true;
        } catch (error) {
            let errorMessage = `[RESOLVE][${guildId}][#${channel.name}] FAILED: Could not process previous poll (ID: ${pollId}).`;
            if (error.code === 10008) errorMessage += ` REASON: Message was deleted. Use /relinkpoll.`;
            else if (error.code === 50013 || error.code === 50001) errorMessage += ` REASON: Missing Permissions.`;
            else errorMessage += ` REASON: Unexpected error.`;
            console.error(errorMessage, error.code !== 10008 ? error : '');
            return false;
        }
    } else {
        console.log(`[RESOLVE][${guildId}][#${channel.name}] No previous trivia poll to resolve.`);
        return true;
    }
}

// --- Main Scheduled Post Function ---
async function performDailyPost(channelId, isCatchUp = false) {
    if (postingLock.has(channelId)) { console.warn(`[POLL] Aborted post for channel ${channelId}, another is in progress.`); return; }
    postingLock.add(channelId);
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) { console.error(`[POLL] Channel ${channelId} not found.`); return; }
        const guildId = channel.guild.id;
        console.log(`[POLL][${guildId}][#${channel.name}] Starting daily post. Catch-up: ${isCatchUp}`);
        await loadStateForGuild(guildId);
        const state = getServerState(guildId);

        await resolveLastPoll(channel);

        // Fetch history to prevent any repetition.
        const historyRes = await pool.query('SELECT question FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50', [guildId]);
        const questionHistory = historyRes.rows.map(row => row.question);

        let pollResult = await generateTriviaPoll('', questionHistory);
        let newPollData;
        let usedFallback = false;

        if (pollResult.status !== 'success') {
            console.warn(`[POLL][FALLBACK] Gemini API failed. Status: ${pollResult.status}. Deploying a fallback poll.`);
            serviceHelpers.metrics.fallback_served++;
            usedFallback = true;
            const lastPoll = state.lastSuccessfulPoll;
            if (lastPoll && lastPoll.type === 'trivia') {
                newPollData = { ...lastPoll, isFallback: true };
            } else {
                newPollData = { ...FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)], isFallback: true };
            }
        } else {
            newPollData = pollResult.data;
        }

        if (newPollData) {
            newPollData.type = 'trivia'; // All polls are now trivia
            let pollIntroMessage = isCatchUp ? "Oops, I missed the 6 AM slot (likely due to downtime)! Here is today's poll! 😅" : "@everyone **Today's AI Poll!** 🧠";
            if (usedFallback) pollIntroMessage += `\n*(posted using fallback because the AI service was unavailable)*`;

            const newPollMessage = await channel.send({ content: pollIntroMessage, poll: { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
            newPollData.pollMessageId = newPollMessage.id;
            newPollData.createdAt = new Date().toISOString();

            state.lastPollData = newPollData;
            await saveStateToDB(guildId, 'lastPollData', newPollData);

            if (!usedFallback) { // Only save real polls as "last successful" and to history
                await saveStateToDB(guildId, 'lastSuccessfulPoll', newPollData);
                await saveQuestionToHistory(guildId, newPollData.question);
            }

            console.log(`[POLL][${guildId}][#${channel.name}] Successfully posted new poll: "${newPollData.question}"`);
        } else {
            console.error(`[POLL][${guildId}][#${channel.name}] CRITICAL FAILURE: Could not generate a poll from Gemini or use a fallback.`);
        }
    } catch (error) {
        console.error(`[POLL][Channel: ${channelId}] Critical error during daily post:`, error);
    } finally { postingLock.delete(channelId); }
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
            try {
                const user = await discordClient.users.fetch(sortedUsers[i][0]);
                leaderboardString += `${i + 1}. ${user.username} - ${sortedUsers[i][1]} points\n`;
            } catch { }
        }

        const prompt = `You are a fun and engaging Discord bot. Write a short, human-like summary for the end-of-week AI poll leaderboard. Here is the data:\n${leaderboardString}\nCongratulate the winner(s), mention some other top players, encourage everyone, and say you're excited for next week. Keep it concise and positive.`;
        const summaryText = await generateTextWithRetries(prompt, 'gemini_summary');
        const description = summaryText || "Here's a look at this week's top contenders! Great job, everyone.";

        const summaryEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 Weekly Poll Report 🏆').setDescription(description).addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' }).setFooter({ text: 'A new week of polls starts tomorrow!' });
        await channel.send({ embeds: [summaryEmbed] });
    } catch (error) { console.error(`[LEADERBOARD][Channel: ${channelId}] Failed to post weekly summary:`, error); }
}

function getNYDateString(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

async function checkForMissedPolls() {
    console.log('[STARTUP] Checking for missed daily polls...');
    const now = new Date();
    const currentHourNY = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }).format(now), 10);
    // If it's before 6 AM NY time, we shouldn't have posted yet anyway.
    if (currentHourNY < 6) {
        console.log('[STARTUP] Before 6AM NY time, no catch-up needed.');
        return;
    }

    const checkPromises = TARGET_CHANNEL_IDS.map(async (channelId) => {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !channel.guild) return;
            const guildId = channel.guild.id;
            await loadStateForGuild(guildId);
            const state = getServerState(guildId);
            
            // Check if we have data for TODAY (NY time)
            if (!state.lastPollData || !state.lastPollData.createdAt || isNaN(new Date(state.lastPollData.createdAt))) {
                console.log(`[STARTUP] No previous valid poll found. Catching up for ${channel.name}.`);
                await performDailyPost(channelId, true);
                return;
            }
            
            const lastPollDateStr = getNYDateString(new Date(state.lastPollData.createdAt));
            const todayDateStr = getNYDateString(now);

            if (lastPollDateStr !== todayDateStr) {
                console.log(`[STARTUP] Last poll was from ${lastPollDateStr}, but today is ${todayDateStr}. Catching up for ${channel.name}.`);
                await performDailyPost(channelId, true);
            } else {
                console.log(`[STARTUP] Poll for today (${todayDateStr}) already exists in ${channel.name}. No action needed.`);
            }
        } catch (error) { console.error(`[STARTUP] CRITICAL ERROR during catch-up check for channel ${channelId}:`, error); }
    });
    await Promise.all(checkPromises);
    console.log('[STARTUP] Missed poll check complete.');
}

// --- Slash Commands Setup ---
const commands = [
    new SlashCommandBuilder().setName('leaderboard').setDescription('Displays the top 10 players on the server.'),
    new SlashCommandBuilder().setName('rank').setDescription("Shows your rank or a mentioned user's rank.")
        .addUserOption(option => option.setName('user').setDescription("The user to check the rank of (defaults to you).")),
    new SlashCommandBuilder().setName('help').setDescription('Shows the help message with all available commands.'),
    // Admin commands
    new SlashCommandBuilder().setName('points').setDescription("Manually adjusts a user's score.")
        .addSubcommand(sub => sub.setName('add').setDescription('Adds points to a user.')
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The number of points to add.').setRequired(true).setMinValue(1)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Removes points from a user.')
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The number of points to remove.').setRequired(true).setMinValue(1)))
        .addSubcommand(sub => sub.setName('set').setDescription("Sets a user's points to an exact value.")
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The exact score to set.').setRequired(true).setMinValue(0))),
    new SlashCommandBuilder().setName('asknow').setDescription('Starts an on-demand trivia poll (does not award points).')
        .addStringOption(option => option.setName('topic').setDescription('An optional topic for the poll.')),
    new SlashCommandBuilder().setName('reveal').setDescription('Reveals the answer for the active on-demand poll.'),
    new SlashCommandBuilder().setName('postdaily').setDescription('Manually triggers the daily poll sequence.'),
    new SlashCommandBuilder().setName('relinkpoll').setDescription("Fixes the bot's memory to track a poll that was deleted or missed.")
        .addStringOption(option => option.setName('message_id').setDescription('The ID of the poll message.').setRequired(true))
        .addIntegerOption(option => option.setName('correct_option').setDescription('The number of the correct option (e.g., 3 for C).').setRequired(true).setMinValue(1).setMaxValue(10)),
    new SlashCommandBuilder().setName('resolve').setDescription('Manually resolves the last-known poll.'),
    new SlashCommandBuilder().setName('update-knowledge').setDescription("Update the bot's knowledge base for answering questions.")
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);


// --- Bot Startup Logic ---
discordClient.once('ready', async () => {
    console.log('--- Bot is starting up ---');
    await initializeDatabase();
    console.log(`Logged in as ${discordClient.user.tag}!`);

    try {
        const guildIds = discordClient.guilds.cache.map(guild => guild.id);
        for (const guildId of guildIds) {
            await rest.put(
                Routes.applicationGuildCommands(discordClient.user.id, guildId),
                { body: commands },
            );
        }
        console.log(`[COMMANDS] Refreshed slash commands.`);
    } catch (error) {
        console.error('[COMMANDS] Failed to reload application commands:', error);
    }

    console.log('[INVITES] Caching invites...');
    await Promise.all(discordClient.guilds.cache.map(guild => cacheAndSyncInvites(guild)));

    TARGET_CHANNEL_IDS.forEach(channelId => {
        cron.schedule('0 6 * * *', () => performDailyPost(channelId), { scheduled: true, timezone: "America/New_York" });
        cron.schedule('0 21 * * 0', () => postWeeklySummary(channelId), { scheduled: true, timezone: "America/New_York" });
        console.log(`[SCHEDULER] Daily/Weekly tasks scheduled for ${channelId}.`);
    });

    serviceHelpers.startConvQueueWorker(discordClient); // Start the background queue processor
    console.log('--- Bot is fully operational. ---');

    console.log('[STARTUP] Scheduling catch-up check in 5 seconds...');
    setTimeout(() => { checkForMissedPolls().catch(err => console.error("[STARTUP] Catch-up check failed.", err)); }, 5000);
});

// --- Invite Tracking Event Handlers ---
discordClient.on('guildCreate', cacheAndSyncInvites);

discordClient.on('inviteCreate', async invite => {
    try {
        const guildInvites = inviteCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.set(invite.code, invite.uses);
        }
        await pool.query(
            `INSERT INTO invites (guild_id, code, inviter_id, uses) VALUES ($1, $2, $3, $4) ON CONFLICT (guild_id, code) DO NOTHING`,
            [invite.guild.id, invite.code, invite.inviter.id, invite.uses]
        );
    } catch (err) {
        console.error(`[INVITES] Error in inviteCreate event for guild ${invite.guild.id}:`, err);
    }
});

discordClient.on('inviteDelete', async invite => {
    try {
        const guildInvites = inviteCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.delete(invite.code);
        }
        await pool.query('DELETE FROM invites WHERE guild_id = $1 AND code = $2', [invite.guild.id, invite.code]);
    } catch (err) {
        console.error(`[INVITES] Error in inviteDelete event for guild ${invite.guild.id}:`, err);
    }
});

discordClient.on('guildMemberAdd', async member => {
    try {
        const cachedInvites = inviteCache.get(member.guild.id);
        if (!cachedInvites) {
            return;
        }

        const newInvites = await member.guild.invites.fetch();
        const usedInvite = newInvites.find(inv => inv.uses > (cachedInvites.get(inv.code) || 0));

        inviteCache.set(member.guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

        const welcomeChannel = member.guild.systemChannel;
        if (!welcomeChannel || !welcomeChannel.permissionsFor(member.guild.members.me).has('SendMessages')) {
            return;
        }

        const arHimUser = member.guild.members.cache.find(m => m.user.username === ALLOWED_USERNAME) || (await member.guild.members.fetch()).find(m => m.user.username === ALLOWED_USERNAME);
        let welcomeMessage = `welcome to the server, ${member}!`;
        let inviter = null;

        if (usedInvite && usedInvite.inviter) {
            inviter = await discordClient.users.fetch(usedInvite.inviter.id).catch(() => null);
            if (inviter) {
                welcomeMessage += ` you were invited by ${inviter}.`;
                if (inviter.username !== 'mr.democracy._29458') {
                    const newScore = await admin_setOrAddUserScore(member.guild.id, inviter.id, 1, 'add');
                    if (newScore !== null) {
                        welcomeMessage += ` i added a point to ${inviter}'s score for the invite!`;
                    }
                }
            }
            await pool.query(
                `UPDATE invites SET uses = $1 WHERE guild_id = $2 AND code = $3`,
                [usedInvite.uses, member.guild.id, usedInvite.code]
            ).catch(err => console.error(`[INVITES_DB] Failed to update uses for invite ${usedInvite.code}`, err));
        } else {
            welcomeMessage += " i couldn't figure out who invited you, but we're glad you're here.";
        }

        if (arHimUser) {
            welcomeMessage += ` (cc ${arHimUser})`;
        }

        await welcomeChannel.send(welcomeMessage);

    } catch (err) {
        console.error(`[INVITES] Error in guildMemberAdd event for guild ${member.guild.id}:`, err);
    }
});

// --- Conversational AI Handler ---
discordClient.on('messageCreate', async (message) => {
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

            if (!serverStateCache[message.guild.id]) await loadStateForGuild(message.guild.id);
            await message.channel.sendTyping();

            const state = getServerState(message.guild.id);
            const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
            const history = await buildConversationHistory(message);

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
});


// --- Slash Command & Interaction Handler ---
discordClient.on('interactionCreate', async (interaction) => {
    try {
        // --- Modal Submit Handler ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'knowledgeBaseModal') {
                const hasPermission = interaction.user.username === ALLOWED_USERNAME || interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);
                if (!hasPermission) {
                    return interaction.reply({ content: "You don't have permission to do this.", ephemeral: true });
                }

                const guildId = interaction.guild.id;
                const knowledgeText = interaction.fields.getTextInputValue('knowledgeInput');
                const success = await admin_saveKnowledgeBase(guildId, 'main-info', knowledgeText);

                if (success) {
                    const state = getServerState(guildId);
                    state.knowledgeBase['main-info'] = knowledgeText; // Update cache
                    await interaction.reply({ content: '✅ Knowledge base has been updated successfully!', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ A database error occurred while trying to update the knowledge base.', ephemeral: true });
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const guildId = interaction.guild.id;
        const hasPermission = interaction.user.username === ALLOWED_USERNAME || interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);

        if (!serverStateCache[guildId]) await loadStateForGuild(guildId);
        const state = getServerState(guildId);

        // --- User Commands ---
        if (commandName === 'leaderboard' || commandName === 'rank') {
            await interaction.deferReply();
            const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);
            if (sortedUsers.length === 0) return interaction.editReply('The leaderboard is empty!');

            if (commandName === 'leaderboard') {
                let description = '';
                for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
                    try {
                        const user = await discordClient.users.fetch(sortedUsers[i][0]);
                        description += `**${i + 1}. ${user.username}** - ${sortedUsers[i][1]} points\n`;
                    } catch { description += `**${i + 1}.** *Unknown User* - ${sortedUsers[i][1]} points\n`; }
                }
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#F1C40F').setTitle(`🏆 Leaderboard for ${interaction.guild.name} 🏆`).setDescription(description)] });
            } else {
                const targetUser = interaction.options.getUser('user') || interaction.user;
                const userRankIndex = sortedUsers.findIndex(([userId]) => userId === targetUser.id);
                if (userRankIndex !== -1) {
                    await interaction.editReply(`${targetUser.username}, you are rank **#${userRankIndex + 1}** with **${sortedUsers[userRankIndex][1]}** point(s).`);
                } else { await interaction.editReply(`${targetUser.username}, you are not on the leaderboard yet.`); }
            }
        }

        if (commandName === 'help') {
            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🤖 Bot Commands').setDescription('Here are the available commands:');
            embed.addFields({ name: `/leaderboard`, value: 'Displays the top 10 players.' }, { name: `/rank [user]`, value: 'Shows your rank or a mentioned user\'s rank.' }, { name: `/help`, value: 'Shows this help message.' });
            if (hasPermission) {
                embed.addFields({ name: '--- Admin Commands ---', value: '\u200B' }, { name: `/points <add|remove|set> <user> <amount>`, value: 'Adjusts a user\'s points.' }, { name: `/update-knowledge`, value: "Opens a form to update the bot's knowledge base." }, { name: `/asknow [topic]`, value: 'Starts an on-demand poll.' }, { name: `/reveal`, value: 'Reveals the answer for the active poll.' }, { name: `/postdaily`, value: 'Manually triggers the daily poll sequence.' }, { name: `/relinkpoll <id> <option#>`, value: "Fixes the bot's memory to track a poll." }, { name: `/resolve`, value: "Manually resolves the last-known poll." });
            }
            await interaction.reply({ embeds: [embed] });
        }

        // --- Admin Commands ---
        if (!hasPermission && ['points', 'asknow', 'reveal', 'postdaily', 'relinkpoll', 'resolve', 'update-knowledge'].includes(commandName)) {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        if (commandName === 'asknow') {
            if (state.activeOnDemandPoll) return interaction.reply({ content: "There's already an active on-demand poll. Use `/reveal` to end it.", ephemeral: true });
            const topic = interaction.options.getString('topic') || '';
            await interaction.reply(`On-demand trivia poll requested for topic "${topic || 'Any AI topic'}". Generating...`);
            const pollResult = await generateTriviaPoll(topic, []);
            if (pollResult.status === 'success') {
                const pollMessage = await interaction.channel.send({ content: `**Special On-Demand Poll!** ✨`, poll: { question: { text: pollResult.data.question }, answers: pollResult.data.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
                state.activeOnDemandPoll = { ...pollResult.data, messageId: pollMessage.id };
                await saveStateToDB(guildId, 'activeOnDemandPoll', state.activeOnDemandPoll);
                await interaction.editReply("Poll generated successfully!");
            } else { await interaction.editReply("i'm overloaded — please try again in a few minutes."); }
        }

        if (commandName === 'reveal') {
            if (!state.activeOnDemandPoll) return interaction.reply({ content: "There is no active on-demand poll to reveal.", ephemeral: true });
            const pollData = state.activeOnDemandPoll;
            const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);
            const answerEmbed = new EmbedBuilder().setColor('#2ECC71').setTitle('Answer & Explanation 🧐').setDescription(`**Q: ${pollData.question}**`).addFields({ name: 'Correct Answer', value: `**${correctOptionLetter}: ${pollData.options[pollData.correctAnswerIndex]}**` }, { name: 'Explanation', value: pollData.explanation }).setFooter({ text: 'On-demand polls do not award points.' });
            await interaction.reply({ embeds: [answerEmbed] });
            state.activeOnDemandPoll = null;
            await deleteStateFromDB(guildId, 'activeOnDemandPoll');
        }

        if (commandName === 'points') {
            const subCommand = interaction.options.getSubcommand();
            const targetUser = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');

            let newScore = null;
            if (subCommand === 'add') newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'add');
            else if (subCommand === 'remove') newScore = await admin_removeUserScore(guildId, targetUser.id, amount);
            else if (subCommand === 'set') newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'set');

            if (newScore !== null) {
                state.leaderboard[targetUser.id] = newScore;
                await interaction.reply(`Success! **${targetUser.username}**'s score is now **${newScore}**.`);
            } else { await interaction.reply({ content: 'A database error occurred.', ephemeral: true }); }
        }

        if (commandName === 'relinkpoll') {
            await interaction.deferReply({ ephemeral: true });
            const messageId = interaction.options.getString('message_id');
            const correctOptionNumber = interaction.options.getInteger('correct_option');
            const correctAnswerIndex = correctOptionNumber - 1;

            try {
                const pollMessage = await interaction.channel.messages.fetch(messageId);
                if (!pollMessage.poll || correctAnswerIndex >= pollMessage.poll.answers.length) return interaction.editReply("Invalid message ID or option number.");

                const question = pollMessage.poll.question.text;
                const options = pollMessage.poll.answers.map(a => a.text);
                const correctAnswerText = options[correctAnswerIndex];

                const explanationPrompt = `The trivia question is: "${question}". The correct answer is "${correctAnswerText}". Please provide a concise, engaging explanation for why this is the correct answer.`;
                const explanation = await generateTextWithRetries(explanationPrompt, 'gemini_relink');

                if (!explanation) return interaction.editReply("Sorry, the AI is overloaded. The relink has been aborted.");
                const newPollData = { question, options, correctAnswerIndex, explanation, type: 'trivia', pollMessageId: pollMessage.id, createdAt: pollMessage.createdAt.toISOString() };
                state.lastPollData = newPollData;
                await saveStateToDB(guildId, 'lastPollData', newPollData);
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#2ECC71').setTitle('✅ Poll Relink Successful').setDescription(`Relinked to poll: *${question}*`).setFooter({ text: "Use /resolve to process this poll." })] });
            } catch (fetchError) { return interaction.editReply("I couldn't find a message with that ID in this channel."); }
        }

        if (commandName === 'resolve') {
            if (!state.lastPollData) return interaction.reply({ content: "There is no poll in memory to resolve.", ephemeral: true });
            await interaction.reply("Manually resolving the last known poll...");
            if (await resolveLastPoll(interaction.channel)) {
                state.lastPollData = null;
                await deleteStateFromDB(guildId, 'lastPollData');
                await interaction.followUp("✅ Last poll has been resolved and cleared from memory.");
            } else { await interaction.followUp("❌ Something went wrong during resolution. Check logs."); }
        }

        if (commandName === 'postdaily') {
            // FIX: Use deferReply to prevent 'Unknown Interaction' errors if the bot wakes up slowly or processing takes >3s.
            await interaction.deferReply();
            await interaction.editReply("Manually triggering the daily poll process...");
            await performDailyPost(interaction.channel.id, true);
        }

        if (commandName === 'update-knowledge') {
            // FIX: Ensure text is safe and valid (not null/undefined, and under 4000 chars)
            const rawKnowledge = state.knowledgeBase['main-info'];
            // If undefined, use placeholder. Slice to safeguard against DB overflowing Discord limit.
            const currentKnowledge = (rawKnowledge || 'Enter your organization\'s information here.').slice(0, 3999);

            const modal = new ModalBuilder()
                .setCustomId('knowledgeBaseModal')
                .setTitle('Update Knowledge Base');
            const knowledgeInput = new TextInputBuilder()
                .setCustomId('knowledgeInput')
                .setLabel("What the bot should know about the org:")
                .setStyle(TextInputStyle.Paragraph)
                .setValue(currentKnowledge) // Safe value
                .setPlaceholder('- Our mission is to...\n- We were founded in...')
                .setRequired(true);
            const actionRow = new ActionRowBuilder().addComponents(knowledgeInput);
            modal.addComponents(actionRow);
            await interaction.showModal(modal);
        }

    } catch (error) {
        const commandIdentifier = interaction.isCommand() ? `/${interaction.commandName}` : `(ID: ${interaction.customId})`;
        console.error(`[INTERACTION_HANDLER] Error on ${commandIdentifier} in guild ${interaction.guild?.id}:`, error);
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "Oops! Something went wrong while executing this command.", ephemeral: true });
            } else {
                await interaction.reply({ content: "Oops! Something went wrong while executing this command.", ephemeral: true });
            }
        } catch (replyError) { console.error(`[INTERACTION_HANDLER] CRITICAL: Failed to send error reply.`, replyError); }
    }
});


function loginWithTimeout(token, timeoutMs = 90000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject(new Error('Login timed out')); }, timeoutMs);
        discordClient.login(token).then(r => { clearTimeout(timeout); resolve(r); }).catch(e => { clearTimeout(timeout); reject(e); });
    });
}

function testDiscordGateway() {
    return new Promise(resolve => {
        https.get('https://discord.com/api/v10/gateway', res => {
            log(`Discord gateway status: ${res.statusCode}`, 'NET');
            if (res.statusCode === 429) {
                log('WARNING: Discord Gateway returned 429 (Too Many Requests). Your IP is likely rate-limited.', 'WARN');
            }
            resolve();
        }).on('error', err => {
            log(`Discord gateway unreachable: ${err.message}`, 'NET-ERROR');
            resolve();
        });
    });
}

// --- Start Health Check & Login ---
async function startBot() {
    keepAlive();

    // Reduced retries to 5, with steeper backoff
    const MAX_RETRIES = 5;
    let attempt = 0;

    log('Starting bot initialization sequence...', 'STARTUP');
    await testDiscordGateway(); // Test connectivity before starting

    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            log(`Attempting to log in (Attempt ${attempt}/${MAX_RETRIES})...`, 'DISCORD');
            const loginStartTime = Date.now();
            await loginWithTimeout(DISCORD_BOT_TOKEN, 90000); // 90s timeout
            const loginDuration = Date.now() - loginStartTime;
            log(`Login successful! Took ${loginDuration}ms.`, 'DISCORD');
            return; // Exit function on success
        } catch (error) {
            log(`Login attempt ${attempt} failed: ${error.message}`, 'DISCORD-ERROR');

            // Check for unrecoverable errors
            const msg = error.message.toLowerCase();
            if (msg.includes('token') || msg.includes('intent') || msg.includes('disallowed')) {
                log('--- !!! DISCORD LOGIN FAILED PERMANENTLY !!! ---', 'FATAL');
                log('REASON: Invalid Token or Configuration.', 'FATAL');
                console.error(error);
                process.exit(1);
            }

            if (attempt >= MAX_RETRIES) {
                log('--- !!! DISCORD LOGIN FAILED PERMANENTLY !!! ---', 'FATAL');
                log('REASON: Maximum retries reached. Network or Discord Gateway issues.', 'FATAL');
                log(`Last Error: ${error.message}`, 'FATAL');
                console.error(error); // Full trace
                process.exit(1);
            }

            // Custom Backoff Schedule: 10s, 30s, 60s, 120s, 300s
            const delays = [10000, 30000, 60000, 120000, 300000];
            const delay = delays[attempt - 1] || 300000; // Default to 300s if out of bounds

            log(`Retrying in ${Math.round(delay / 1000)} seconds...`, 'DISCORD');
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

startBot();
