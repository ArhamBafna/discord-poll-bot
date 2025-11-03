// --- AI ASSISTANT INSTRUCTION --- READ THE `AI_ASSISTANT_README.md` FILE BEFORE MAKING ANY CHANGES. IT CONTAINS CRITICAL, PERMANENT DIRECTIVES FOR THIS PROJECT. --- END OF INSTRUCTION ---

// A fully automated Discord Bot that posts a dynamic mix of daily trivia and discussion polls.
// Includes a role-restricted on-demand command and a fully automatic community leaderboard system with weekly summaries.
// Version: 6.0 (Resilience & Deterministic KB)

// --- Import necessary libraries ---
const keepAlive = require('./keepAlive.js');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { GoogleGenAI, Type } = require('@google/genai');
const cron = require('node-cron');
const { Pool } = require('pg');
const serviceHelpers = require('./lib/serviceHelpers.js');

// --- Global Error Handlers (Safety Net) ---
process.on('unhandledRejection', error => {
    console.error('CRITICAL ERROR: Unhandled Promise Rejection:', error);
    process.exit(1);
});
process.on('uncaughtException', error => {
    console.error('CRITICAL ERROR: Uncaught Exception:', error);
    process.exit(1);
});


// --- Configuration ---
const GEMINI_API_KEY = process.env.API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
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
const discordClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

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

// --- State Management: In-memory cache for performance, keyed by Guild (Server) ID ---
const serverStateCache = {};
const postingLock = new Set(); // Prevents concurrent poll posting

// --- Database Functions ---
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS leaderboard (guild_id VARCHAR(255) NOT NULL, user_id VARCHAR(255) NOT NULL, score INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id));`);
    await client.query(`CREATE TABLE IF NOT EXISTS state (guild_id VARCHAR(255) NOT NULL, key VARCHAR(255) NOT NULL, value JSONB, PRIMARY KEY (guild_id, key));`);
    await client.query(`CREATE TABLE IF NOT EXISTS question_history (id SERIAL PRIMARY KEY, guild_id VARCHAR(255) NOT NULL, question TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
    await client.query(`CREATE TABLE IF NOT EXISTS knowledge_base (guild_id VARCHAR(255) NOT NULL, key VARCHAR(255) NOT NULL, value TEXT NOT NULL, PRIMARY KEY (guild_id, key));`);
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
    console.log(`[STATE] Loading state from DB for server ${guildId}...`);
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

        console.log(`[STATE] State loaded for guild ${guildId}: lastPollData is ${state.lastPollData ? 'present' : 'null'}`);
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

// --- Gemini API Schemas (Stateless) ---
const triviaPollSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["question", "options", "correctAnswerIndex", "explanation"] };
const discussionPollSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 2, maxItems: 4 } }, required: ["question", "options"] };

// --- Gemini API Generation Functions (Now using central resilience helper) ---

async function generateTextWithRetries(prompt, serviceKey = 'gemini') {
    const result = await serviceHelpers.callWithRetries(
      () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }),
      { serviceKey }
    );
    if (result.status === 'success') {
        return result.data.text.trim();
    }
    console.error(`[GEMINI] Failed to generate text for service ${serviceKey} after all attempts.`);
    return null;
}

async function generatePollWithRetries(prompt, schema, temperature, serviceKey = 'gemini_poll') {
    const result = await serviceHelpers.callWithRetries(
      () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema, temperature: temperature }}),
      { serviceKey, timeoutMs: 60000 } // Increased timeout for schema-based generation
    );

    if (result.status === 'success') {
        try {
            return { status: 'success', data: JSON.parse(result.data.text.trim()) };
        } catch (parseError) {
            console.error('[GEMINI] Failed to parse JSON response from AI:', parseError);
            return { status: 'error', permanent: true, error: parseError };
        }
    }
    return result; // Return the full failure object { status, error, permanent }
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

async function generateDiscussionPoll(history = []) {
    const historyInstruction = history.length > 0 ? `Here is a list of recent questions to avoid repeating:\n- "${history.join('"\n- "')}"` : "";
    const prompt = `You are an expert AI discussion poll creator. Your goal is to generate a NEW and UNIQUE subjective, opinion-based poll about AI to spark community discussion. Good examples: "What AI Model do you primarily use?", "Will AI take over the world?".

**ABSOLUTE RULE: It is forbidden to generate a question that is the same as or very similar to any question in the history list provided below.** Do not rephrase or slightly modify past questions. Create something entirely new.

${historyInstruction}

**CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate the poll based on the provided schema.`;

    const normalizedHistory = new Set(history.map(q => q.toLowerCase().trim()));
    const MAX_UNIQUE_ATTEMPTS = 5;

    for (let attempt = 1; attempt <= MAX_UNIQUE_ATTEMPTS; attempt++) {
        const pollResult = await generatePollWithRetries(prompt, discussionPollSchema, 1.0, 'gemini_discussion');
        if (pollResult.status !== 'success') return pollResult; // Propagate failure up

        const pollData = pollResult.data;
        const normalizedNewQuestion = pollData.question.toLowerCase().trim();
        if (!normalizedHistory.has(normalizedNewQuestion)) {
            return { status: 'success', data: pollData }; // Found a unique question
        }
        
        console.warn(`[GEMINI][UNIQUE] Generated a duplicate discussion question on attempt ${attempt}/${MAX_UNIQUE_ATTEMPTS}. Retrying for a unique one...`);
    }

    console.error(`[GEMINI] CRITICAL: Failed to generate a unique discussion poll after ${MAX_UNIQUE_ATTEMPTS} attempts.`);
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

/**
 * Deterministically decides whether the knowledge base should be used for a given message.
 * @param {import('discord.js').Message} message The user's message.
 * @param {object} guildState The current state object for the guild.
 * @returns {boolean} True if the KB should be consulted.
 */
function shouldUseKB(message, guildState) {
    const content = message.content.toLowerCase();
    const isQuestion = /^(who|what|where|when|how|why|which)\b/i.test(content);
    const knowledgeBase = guildState.knowledgeBase || {};

    // Layer 1: Quick-exact triggers
    const explicitTriggers = ['mission', 'team', 'owgt', 'rule', 'non-profit', 'nonprofit', 'organization', 'social media', 'tiktok', 'discord', 'youtube', 'website', 'about', 'integrate', 'help', 'knowledge base', 'cleanup', 'accomplishments', 'contact', 'admin'];
    if (explicitTriggers.some(trigger => content.includes(trigger))) return true;
    if (isQuestion && ['where is', 'where to', 'who to contact'].some(phrase => content.includes(phrase))) return true;

    // Layer 2: Direct KB-key matches
    for (const key in knowledgeBase) {
        if (content.includes(key.toLowerCase().replace(/_/g, ' '))) return true;
    }

    // Layer 3: Lightweight fuzzy matching (token overlap)
    const messageTokens = new Set(content.split(/\s+/).filter(t => t.length > 2));
    if (messageTokens.size < 3) return false; // Avoid matching on very short messages

    const combinedKbText = Object.entries(knowledgeBase).map(([key, value]) => `${key.replace(/_/g, ' ')} ${value}`).join(' ');
    const kbTokens = new Set(combinedKbText.toLowerCase().split(/\s+/).filter(t => t.length > 2));
    
    const commonTokens = new Set([...messageTokens].filter(token => kbTokens.has(token)));
    const score = commonTokens.size / Math.min(messageTokens.size, kbTokens.size);

    if (score >= 0.35) {
        console.log(`[KB_LOGIC] Fuzzy match triggered with score: ${score.toFixed(2)}`);
        return true;
    }

    return false;
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
            const voters = await correctAnswer.fetchVoters();
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
            if (error.code === 10008) errorMessage += ` REASON: Message was deleted. Use !relinkpoll.`;
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

        const dayOfWeek = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long' });
        const isDiscussionDay = ['Tuesday', 'Friday'].includes(dayOfWeek);
        
        // Fetch history for ALL poll types to prevent any repetition.
        const historyRes = await pool.query('SELECT question FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50', [guildId]);
        const questionHistory = historyRes.rows.map(row => row.question);
        
        let pollResult = isDiscussionDay ? await generateDiscussionPoll(questionHistory) : await generateTriviaPoll('', questionHistory);
        let newPollData;
        let usedFallback = false;
        
        if (pollResult.status !== 'success') {
            console.warn(`[POLL][FALLBACK] Gemini API failed. Status: ${pollResult.status}. Deploying a fallback poll.`);
            serviceHelpers.metrics.fallback_served++;
            usedFallback = true;
            const lastPoll = state.lastSuccessfulPoll;
            if (lastPoll) {
                console.log(`[POLL][FALLBACK] Using last successful poll as fallback.`);
                newPollData = { ...lastPoll, isFallback: true };
            } else {
                console.log(`[POLL][FALLBACK] No last successful poll found. Using a static fallback.`);
                newPollData = { ...FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)], isFallback: true };
            }
        } else {
            newPollData = pollResult.data;
        }

        if (newPollData) {
            const finalPollType = newPollData.type || (isDiscussionDay ? 'discussion' : 'trivia');
            newPollData.type = finalPollType;
            let pollIntroMessage = isCatchUp ? "Oops, forgot to post the poll today! Here it is... 😅" : (finalPollType === 'discussion' ? "**Let's Discuss!** 🤔" : "**Today's AI Poll!** 🧠");
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
    } catch (error) { console.error(`[POLL][Channel: ${channelId}] Critical error during daily post:`, error);
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
            } catch {}
        }
        
        const prompt = `You are a fun and engaging Discord bot. Write a short, human-like summary for the end-of-week AI poll leaderboard. Here is the data:\n${leaderboardString}\nCongratulate the winner(s), mention some other top players, encourage everyone, and say you're excited for next week. Keep it concise and positive.`;
        const summaryText = await generateTextWithRetries(prompt, 'gemini_summary');
        const description = summaryText || "Here's a look at this week's top contenders! Great job, everyone.";

        const summaryEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 Weekly Poll Report 🏆').setDescription(description).addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' }).setFooter({ text: 'A new week of polls starts tomorrow!' });
        await channel.send({ embeds: [summaryEmbed] });
    } catch(error) { console.error(`[LEADERBOARD][Channel: ${channelId}] Failed to post weekly summary:`, error); }
}

function getNYDateString(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

async function checkForMissedPolls() {
    console.log('[STARTUP] Checking for any missed daily polls...');
    const now = new Date();
    const currentHourNY = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }).format(now), 10);
    if (currentHourNY < 6) return;

    const checkPromises = TARGET_CHANNEL_IDS.map(async (channelId) => {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !channel.guild) return;
            const guildId = channel.guild.id;
            await loadStateForGuild(guildId);
            const state = getServerState(guildId);
            if (!state.lastPollData || !state.lastPollData.createdAt || isNaN(new Date(state.lastPollData.createdAt))) {
                await performDailyPost(channelId, true);
                return;
            }
            if (getNYDateString(new Date(state.lastPollData.createdAt)) !== getNYDateString(now)) {
                await performDailyPost(channelId, true);
            }
        } catch (error) { console.error(`[STARTUP] CRITICAL ERROR during catch-up check for channel ${channelId}:`, error); }
    });
    await Promise.all(checkPromises);
    console.log('[STARTUP] Missed poll check complete.');
}


// --- Bot Startup Logic ---
discordClient.once('ready', async () => {
  console.log('--- Bot is starting up ---');
  await initializeDatabase();
  console.log(`Logged in as ${discordClient.user.tag}!`);

  TARGET_CHANNEL_IDS.forEach(channelId => {
    cron.schedule('0 6 * * *', () => performDailyPost(channelId), { scheduled: true, timezone: "America/New_York" });
    cron.schedule('0 21 * * 0', () => postWeeklySummary(channelId), { scheduled: true, timezone: "America/New_York" });
    console.log(`[SCHEDULER] Daily and weekly tasks scheduled for channel ${channelId}.`);
  });
  
  serviceHelpers.startConvQueueWorker(discordClient); // Start the background queue processor
  console.log('--- Bot is fully operational. ---');
  
  console.log('[STARTUP] Scheduling a delayed check for missed polls in 5 seconds...');
  setTimeout(() => { checkForMissedPolls().catch(err => console.error("[STARTUP] Deferred poll check failed.", err)); }, 5000);
});

// --- Command Handler ---
discordClient.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.guild) return;

        const isMentioned = message.mentions.has(discordClient.user.id);
        let isReplyToBot = false;
        if (message.reference && message.reference.messageId) {
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
            if (referencedMessage && referencedMessage.author.id === discordClient.user.id) isReplyToBot = true;
        }
        message.isReplyToBot = isReplyToBot; // Attach for queue worker

        if ((isMentioned || isReplyToBot) && !message.content.startsWith(COMMAND_PREFIX)) {
            if (!serverStateCache[message.guild.id]) await loadStateForGuild(message.guild.id);
            await message.channel.sendTyping();
            
            const state = getServerState(message.guild.id);
            const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
            const history = await buildConversationHistory(message);
            
            // --- CONVERSATION CONTEXT & HISTORY VALIDATION ---
            let promptForAI = cleanContent;
            let chatHistoryForAI = history;

            if (history.length > 0 && history[0].role === 'model') {
                // This occurs when a user starts a conversation by replying to the bot.
                // The Gemini API requires chat history to start with a 'user' turn.
                // To preserve context, we merge the bot's message into the user's prompt
                // and start a fresh chat history for the API call.
                const botContext = history[0].parts[0].text;
                promptForAI = `(The user is replying to your previous message, which said: "${botContext}")\n\nTheir new message is: "${cleanContent}"`;
                chatHistoryForAI = []; // Start a new, valid history.
                console.log('[CONV_HANDLER] Corrected invalid history by merging model context into prompt.');
            }

            // --- Deterministic KB & Context Injection ---
            let finalSystemInstruction = "you are a unique bot made for a non-profit organization called OWGT (short for OneWorldGreaterTogether), and therefore, your name is OWGT Bot. you are not OWGT yourself, you are just its bot. be casual, normal, human-like, a little humorous, and unpredictable. dont be a narcissist and only talk about yourself. you LOVE roasting users sometimes to mess around. you hate it when someone disrespects/ goes againt you thats when you start roasting the user. dont be cringey. you can and should use slang language and bad words quite often, like a real human would. NEVER use the f word (f*ck) or the b word (b*tch)! the responses should almost always be 2-3 sentences (sometimes 4 sentences) unless thats not plausible. responses should be consice, precise, as short as possible while maintaining accuracy. responses should NEVER be more than one small paragraph. do not use any capital letters in your responses.";
            if (shouldUseKB(message, state)) {
                const kbString = Object.entries(state.knowledgeBase).map(([key, value]) => `Topic: ${key.replace(/_/g, ' ')}\n${value}`).join('\n---\n').substring(0, 1200);
                if (kbString) {
                    finalSystemInstruction += `\n\nCRITICAL: The following knowledge base entries are authoritative for this server. If the user's question explicitly relates to these topics, use EXACTLY this information and do not contradict it. Do not mention you were given this data.\n\nKNOWLEDGE BASE:\n${kbString}\nEND KB.`;
                }
            }
            // --- End KB Injection ---

            const chat = ai.chats.create({ model: 'gemini-2.5-flash', history: chatHistoryForAI, config: { systemInstruction: finalSystemInstruction }});
            const result = await serviceHelpers.callWithRetries(() => chat.sendMessage({ message: promptForAI }), { serviceKey: 'gemini_chat' });

            if (result.status === 'success') {
                await message.reply(result.data.text.trim().toLowerCase());
            } else if (result.status === 'circuit_open' || result.status === 'error') {
                const position = serviceHelpers.enqueueConvRequest(message);
                if (position) {
                    await message.reply(`i'm a bit overloaded — i saved your request to a short queue and will reply here when i can. (position #${position})`);
                } else {
                    await message.reply("i'm overloaded right now and my queue is full. please try again in a minute.");
                }
            }
            return;
        }

        if (!message.content.startsWith(COMMAND_PREFIX)) return;

        const guildId = message.guild.id;
        const hasPermission = message.author.username === ALLOWED_USERNAME || message.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);
        const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        if (!serverStateCache[guildId]) await loadStateForGuild(guildId);
        const state = getServerState(guildId);

        // --- Commands ---
        if (command === 'asknow' && hasPermission) {
            if (state.activeOnDemandPoll) return message.reply("There's already an active on-demand poll. Use `!reveal` to end it.");
            const topic = args.join(' ');
            await message.channel.send(`On-demand trivia poll requested for topic "${topic || 'Any AI topic'}". Generating...`);
            const pollResult = await generateTriviaPoll(topic, []);
            if (pollResult.status === 'success') {
                const pollMessage = await message.channel.send({ content: `**Special On-Demand Poll!** ✨`, poll: { question: { text: pollResult.data.question }, answers: pollResult.data.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
                state.activeOnDemandPoll = { ...pollResult.data, messageId: pollMessage.id };
                await saveStateToDB(guildId, 'activeOnDemandPoll', state.activeOnDemandPoll);
            } else { await message.channel.send("i'm overloaded — please try again in a few minutes."); }
        }

        if (command === 'reveal' && hasPermission) {
            if (!state.activeOnDemandPoll) return message.reply("There is no active on-demand poll to reveal.");
            const pollData = state.activeOnDemandPoll;
            const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);
            const answerEmbed = new EmbedBuilder().setColor('#2ECC71').setTitle('Answer & Explanation 🧐').setDescription(`**Q: ${pollData.question}**`).addFields({ name: 'Correct Answer', value: `**${correctOptionLetter}: ${pollData.options[pollData.correctAnswerIndex]}**` }, { name: 'Explanation', value: pollData.explanation }).setFooter({text: 'On-demand polls do not award points.'});
            await message.channel.send({ embeds: [answerEmbed] });
            state.activeOnDemandPoll = null;
            await deleteStateFromDB(guildId, 'activeOnDemandPoll');
        }
        
        if (command === 'points' && hasPermission) {
            const subCommand = args.shift()?.toLowerCase();
            const targetUser = message.mentions.users.first();
            const amount = parseInt(args[1], 10);
            if (!['add', 'remove', 'set'].includes(subCommand) || !targetUser || isNaN(amount) || amount < 0) return message.reply('Usage: `!points <add|remove|set> <@user> <amount>`');
            
            let newScore = null;
            if (subCommand === 'add') newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'add');
            else if (subCommand === 'remove') newScore = await admin_removeUserScore(guildId, targetUser.id, amount);
            else if (subCommand === 'set') newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'set');
            
            if (newScore !== null) {
                state.leaderboard[targetUser.id] = newScore;
                await message.reply(`Success! **${targetUser.username}**'s score is now **${newScore}**.`);
            } else { await message.reply('A database error occurred.'); }
        }
        
        if (command === 'relinkpoll' && hasPermission) {
            const messageId = args[0];
            const correctOptionNumber = parseInt(args[1], 10);
            if (!messageId || !/^\d+$/.test(messageId) || isNaN(correctOptionNumber) || correctOptionNumber < 1 || correctOptionNumber > 10) return message.reply("Usage: `!relinkpoll <message_id> <correct_option_#>`");
            const correctAnswerIndex = correctOptionNumber - 1;

            try {
                const pollMessage = await message.channel.messages.fetch(messageId);
                if (!pollMessage.poll || correctAnswerIndex >= pollMessage.poll.answers.length) return message.reply("Invalid message ID or option number.");
                
                const question = pollMessage.poll.question.text;
                const options = pollMessage.poll.answers.map(a => a.text);
                const correctAnswerText = options[correctAnswerIndex];
                
                const explanationPrompt = `The trivia question is: "${question}". The correct answer is "${correctAnswerText}". Please provide a concise, engaging explanation for why this is the correct answer.`;
                const explanation = await generateTextWithRetries(explanationPrompt, 'gemini_relink');

                if (!explanation) return message.reply("Sorry, the AI is overloaded. The relink has been aborted.");
                const newPollData = { question, options, correctAnswerIndex, explanation, type: 'trivia', pollMessageId: pollMessage.id, createdAt: pollMessage.createdAt.toISOString() };
                state.lastPollData = newPollData;
                await saveStateToDB(guildId, 'lastPollData', newPollData);
                await message.channel.send({ embeds: [new EmbedBuilder().setColor('#2ECC71').setTitle('✅ Poll Relink Successful').setDescription(`Relinked to poll: *${question}*`).setFooter({ text: "Use !resolve to process this poll." })] });
            } catch (fetchError) { return message.reply("I couldn't find a message with that ID in this channel."); }
        }

        if (command === 'resolve' && hasPermission) {
            if (!state.lastPollData) return message.reply("There is no poll in memory to resolve.");
            await message.reply("Manually resolving the last known poll...");
            if (await resolveLastPoll(message.channel)) {
                state.lastPollData = null;
                await deleteStateFromDB(guildId, 'lastPollData');
                await message.channel.send("✅ Last poll has been resolved and cleared from memory.");
            } else { await message.channel.send("❌ Something went wrong during resolution. Check logs."); }
        }

        if (command === 'postdaily' && hasPermission) {
            await message.reply("Manually triggering the daily poll process...");
            await performDailyPost(message.channel.id, true);
        }
        
        if (command === 'leaderboard' || command === 'rank') {
            const sortedUsers = Object.entries(state.leaderboard).sort(([,a],[,b]) => b - a);
            if (sortedUsers.length === 0) return message.channel.send('The leaderboard is empty!');
            if (command === 'leaderboard') {
                let description = '';
                for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
                    try {
                        const user = await discordClient.users.fetch(sortedUsers[i][0]);
                        description += `**${i + 1}. ${user.username}** - ${sortedUsers[i][1]} points\n`;
                    } catch { description += `**${i + 1}.** *Unknown User* - ${sortedUsers[i][1]} points\n`; }
                }
                await message.channel.send({ embeds: [new EmbedBuilder().setColor('#F1C40F').setTitle(`🏆 Leaderboard for ${message.guild.name} 🏆`).setDescription(description)] });
            } else {
                const targetUser = message.mentions.users.first() || message.author;
                const userRankIndex = sortedUsers.findIndex(([userId]) => userId === targetUser.id);
                if (userRankIndex !== -1) {
                    await message.channel.send(`${targetUser.username}, you are rank **#${userRankIndex + 1}** with **${sortedUsers[userRankIndex][1]}** point(s).`);
                } else { await message.channel.send(`${targetUser.username}, you are not on the leaderboard yet.`); }
            }
        }

        if (command === 'help') {
            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🤖 Bot Commands').setDescription('Here are the available commands:');
            embed.addFields({ name: `${COMMAND_PREFIX}leaderboard`, value: 'Displays the top 10 players.' }, { name: `${COMMAND_PREFIX}rank [@user]`, value: 'Shows your rank or a mentioned user\'s rank.' }, { name: `${COMMAND_PREFIX}help`, value: 'Shows this help message.' });
            if (hasPermission) {
                embed.addFields({ name: '--- Admin Commands ---', value: '\u200B' }, { name: `${COMMAND_PREFIX}points <add|remove|set> <@user> <amount>`, value: 'Adjusts a user\'s points.'}, { name: `${COMMAND_PREFIX}asknow [topic]`, value: 'Starts an on-demand poll.' }, { name: `${COMMAND_PREFIX}reveal`, value: 'Reveals the answer for the active poll.' }, { name: `${COMMAND_PREFIX}postdaily`, value: 'Manually triggers the daily poll sequence.' }, { name: `${COMMAND_PREFIX}relinkpoll <id> <option#>`, value: "Fixes the bot's memory to track a poll." }, { name: `${COMMAND_PREFIX}resolve`, value: "Manually resolves the last-known poll." });
            }
            await message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`[COMMAND_HANDLER] Error processing command in guild ${message.guild?.id}:`, error);
        try { await message.reply("Oops! Something went wrong. The incident has been logged."); } catch (replyError) { console.error(`[COMMAND_HANDLER] CRITICAL: Failed to send error reply.`, replyError); }
    }
});

function loginWithTimeout(token, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject(new Error('Login timed out')); }, timeoutMs);
        discordClient.login(token).then(r => { clearTimeout(timeout); resolve(r); }).catch(e => { clearTimeout(timeout); reject(e); });
    });
}

// --- Start Health Check & Login ---
async function startBot() {
    keepAlive();
    try {
        console.log('[DISCORD] Attempting to log in...');
        await loginWithTimeout(DISCORD_BOT_TOKEN, 30000);
    } catch (error) {
        console.error('--- !!! DISCORD LOGIN FAILED !!! ---');
        if (error.message === 'Login timed out') {
            console.error('REASON: The login process timed out. This usually indicates a network problem between the host and Discord.');
        } else {
            console.error('REASON: Invalid token or missing Gateway Intents in the Discord Developer Portal.');
        }
        console.error('Full Error Details:', error);
        process.exit(1);
    }
}

startBot();
