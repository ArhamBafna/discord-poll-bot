// --- AI ASSISTANT INSTRUCTION --- READ THE `AI_ASSISTANT_README.md` FILE BEFORE MAKING ANY CHANGES. IT CONTAINS CRITICAL, PERMANENT DIRECTIVES FOR THIS PROJECT. --- END OF INSTRUCTION ---

// A fully automated Discord Bot that posts a dynamic mix of daily trivia and discussion polls.
// Includes a role-restricted on-demand command and a fully automatic community leaderboard system with weekly summaries.
// Version: 5.5 (Login Timeout & Network Diagnostics)

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

// --- Database Connection Sanitization ---
// Some database providers (like Neon) add connection parameters that the pg library
// does not support, causing crashes. This code safely removes the problematic parameter.
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

// Add robust initialization for the Gemini client to catch potential startup errors.
let ai; 
try {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log('[GEMINI] Gemini API client initialized successfully.');
} catch (error) {
  console.error('[GEMINI] CRITICAL: Failed to initialize the Gemini API client. This is often due to a library or environment issue. Please check the error details below.');
  console.error(error);
  process.exit(1);
}


// --- Fallback Polls (for API failures) ---
const FALLBACK_POLLS = [
    {
        type: 'trivia',
        question: "Which of these is NOT a recognized type of Machine Learning?",
        options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Subliminal Learning"],
        correctAnswerIndex: 3,
        explanation: "Subliminal Learning is not a recognized category of Machine Learning. The main types are Supervised (learning from labeled data), Unsupervised (finding patterns in unlabeled data), and Reinforcement (learning through trial and error with rewards)."
    },
    {
        type: 'trivia',
        question: "What does the 'Turing Test', proposed by Alan Turing, primarily evaluate in an AI?",
        options: ["Its processing speed", "Its ability to exhibit human-like intelligence", "Its capacity to create art", "Its energy efficiency"],
        correctAnswerIndex: 1,
        explanation: "The Turing Test evaluates a machine's ability to exhibit intelligent behavior indistinguishable from that of a human. If a human evaluator cannot reliably tell the machine from a human in conversation, the machine is said to have passed the test."
    },
    {
        type: 'trivia',
        question: "What is the core function of a 'Neural Network' in modern AI?",
        options: ["To store data like a database", "To cool the computer's central processor", "To mimic the human brain to recognize patterns", "To schedule automated IT tasks"],
        correctAnswerIndex: 2,
        explanation: "Neural Networks are computational models inspired by the human brain's structure. They are designed to recognize complex patterns in data, making them powerful tools for tasks like image recognition, natural language processing, and forecasting."
    }
];

// --- State Management: In-memory cache for performance, keyed by Guild (Server) ID ---
const serverStateCache = {};
const postingLock = new Set(); // Prevents concurrent poll posting

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
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        guild_id VARCHAR(255) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (guild_id, key)
      );
    `);
    console.log('[DATABASE] All tables are set up for multi-server support.');
  } catch (error) {
    console.error('[DATABASE] CRITICAL ERROR: Failed to initialize database.', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Helper to get or create a server's state in the cache
function getServerState(guildId) {
    if (!serverStateCache[guildId]) {
        serverStateCache[guildId] = {
            leaderboard: {},
            lastPollData: null,
            activeOnDemandPoll: null,
            knowledgeBase: {},
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

        const knowledgeRes = await client.query('SELECT key, value FROM knowledge_base WHERE guild_id = $1', [guildId]);
        state.knowledgeBase = {};
        knowledgeRes.rows.forEach(row => {
            state.knowledgeBase[row.key] = row.value;
        });

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
        await pool.query(`
          INSERT INTO leaderboard (guild_id, user_id, score)
          SELECT $1, user_id, 1 FROM unnest($2::varchar[]) AS t(user_id)
          ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + 1;
        `, [guildId, userIds]);
    } catch (error) {
        console.error(`[DATABASE] Failed to batch update scores for ${userIds.length} users in guild ${guildId}:`, error);
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

// --- Gemini API Generation Functions (Now with Centralized Retry Logic & User Notifications) ---

/**
 * A centralized handler for generating content from Gemini with robust retry logic.
 * Designed for simple text generation tasks.
 * @param {string} prompt The prompt to send to the AI.
 * @param {string} generationType A label for logging purposes (e.g., 'weekly summary').
 * @returns {Promise<string|null>} The generated text or null if all attempts fail.
 */
async function generateTextWithRetries(prompt, generationType = 'content') {
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            return response.text.trim();
        } catch (error) {
            const isRetryable = error.message && (error.message.includes('503') || error.message.includes('500') || error.message.includes('429'));
            if (isRetryable && attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 500 + Math.floor(Math.random() * 500); // Shorter delay for non-critical tasks
                console.warn(`[GEMINI][RETRY] ${generationType} generation failed on attempt ${attempt}/${MAX_RETRIES}. Retrying in ${Math.round(delay/1000)}s...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error(`[GEMINI] CRITICAL: Failed to generate ${generationType} after ${attempt} attempts.`, error);
                return null;
            }
        }
    }
    return null;
}

/**
 * A centralized handler for generating structured JSON polls from Gemini with robust retry logic.
 * Includes user-facing notifications on initial failure for scheduled posts.
 * @param {string} prompt The prompt to send to the AI.
 * @param {object} schema The response schema for the JSON output.
 * @param {number} temperature The generation temperature.
 * @param {import('discord.js').TextChannel|null} channel The channel to notify if the first attempt fails.
 * @param {string} pollType A label for logging purposes (e.g., 'TRIVIA').
 * @returns {Promise<object|null>} The parsed JSON poll data or null if all attempts fail.
 */
async function generatePollWithRetries(prompt, schema, temperature, channel = null, pollType = 'Poll') {
    const MAX_RETRIES = 4;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema, temperature: temperature }});
            return JSON.parse(response.text.trim());
        } catch (error) {
            const isRetryable = error.message && (error.message.includes('503') || error.message.includes('500') || error.message.includes('429'));
            
            if (isRetryable && attempt === 1 && channel) {
                try {
                    await channel.send("apologies, but i seem to be having some connection issues with the AI at the moment. i'll keep trying in the background and will post today's poll as soon as i can!");
                    console.log(`[GEMINI][NOTIFY] Notified channel #${channel.name} of a temporary API issue.`);
                } catch (e) {
                    console.error(`[GEMINI][NOTIFY] FAILED to send notification to channel #${channel.name}. Bot may lack permissions.`, e);
                }
            }

            if (isRetryable && attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 1000); // 2s, 4s, 8s + jitter
                console.warn(`[GEMINI][RETRY] ${pollType} poll generation failed on attempt ${attempt}/${MAX_RETRIES}. Retrying in ${Math.round(delay/1000)}s...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error(`[GEMINI] CRITICAL: Failed to generate ${pollType} poll after ${attempt} attempts.`, error);
                return null;
            }
        }
    }
    return null; // Fallback in case loop finishes unexpectedly
}

async function generateTriviaPoll(topic = '', history = [], channel = null) {
    const historyInstruction = history.length > 0 ? `**To ensure variety, you MUST NOT create a poll about any of these recent topics:**\n- "${history.join('"\n- "')}"` : "";
    const prompt = `You generate fun and engaging trivia polls about Artificial Intelligence for a general audience. The questions should be easy to understand (middle/high school level), interesting, and based on well-known AI facts or applications. Avoid overly simple questions like "What does AI stand for?". Good examples are: "Which company created ChatGPT?", "What everyday app uses AI for route navigation?", or "Which game was famously mastered by DeepMind’s AI?". ${topic ? `The poll must be about: **${topic}**.` : ''} ${historyInstruction} **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate the poll based on the provided schema.`;

    const normalizedHistory = new Set(history.map(q => q.toLowerCase().trim()));
    const MAX_UNIQUE_ATTEMPTS = 5;

    for (let attempt = 1; attempt <= MAX_UNIQUE_ATTEMPTS; attempt++) {
        const pollData = await generatePollWithRetries(prompt, triviaPollSchema, 0.9, channel, 'TRIVIA');
        if (!pollData) {
            // Generation failed completely, so we can't continue.
            return null;
        }

        const normalizedNewQuestion = pollData.question.toLowerCase().trim();
        if (!normalizedHistory.has(normalizedNewQuestion)) {
            // Found a unique question
            return pollData;
        }
        
        console.warn(`[GEMINI][UNIQUE] Generated a duplicate trivia question on attempt ${attempt}/${MAX_UNIQUE_ATTEMPTS}. Retrying for a unique one...`);
    }

    console.error(`[GEMINI] CRITICAL: Failed to generate a unique trivia poll after ${MAX_UNIQUE_ATTEMPTS} attempts. The AI may be returning repeated content.`);
    return null;
}

async function generateDiscussionPoll(channel = null) {
    const prompt = `You generate subjective, opinion-based polls about AI to spark community discussion. Good examples: "What AI Model do you primarily use?", "Will AI take over the world?". **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate poll based on schema.`;
    
    return generatePollWithRetries(prompt, discussionPollSchema, 1.0, channel, 'DISCUSSION');
}


// --- Conversational AI Functions ---

/**
 * Builds a chronological conversation history by walking up a message's reply chain.
 * @param {import('discord.js').Message} message The message that triggered the conversation.
 * @returns {Promise<Array<Object>>} A history array formatted for the Gemini API.
 */
async function buildConversationHistory(message) {
    const history = [];
    let currentReference = message.reference;
    
    // Walk up the reply chain for context, max 10 messages deep
    for (let i = 0; i < 10 && currentReference && currentReference.messageId; i++) {
        try {
            const referencedMessage = await message.channel.messages.fetch(currentReference.messageId);
            
            // We only care about messages from the user and the bot involved in this specific chain
            if (referencedMessage.author.id === message.author.id || referencedMessage.author.id === discordClient.user.id) {
                history.unshift({
                    role: referencedMessage.author.id === discordClient.user.id ? 'model' : 'user',
                    parts: [{ text: referencedMessage.content }]
                });
            } else {
                // If we encounter a message from someone else, the direct conversation context is broken.
                break;
            }
            
            currentReference = referencedMessage.reference;
        } catch {
            // Stop if we can't fetch a message (e.g., deleted)
            break;
        }
    }
    return history;
}


/**
 * Generates a conversational response using the Gemini Chat API, with injected context.
 * @param {Array<Object>} history The conversation history.
 * @param {string} latestMessage The user's latest message.
 * @param {string} guildId The ID of the server where the conversation is happening.
 * @returns {Promise<string|null>} The AI-generated response text, or a user-facing error message.
 */
async function generateConversationalResponse(history, latestMessage, guildId) {
    try {
        // --- Context Injection ---
        const state = getServerState(guildId);
        const lowerCaseMessage = latestMessage.toLowerCase();
        const contextParts = [];

        // 1. Leaderboard Context
        if (lowerCaseMessage.includes('leaderboard') || lowerCaseMessage.includes('rank') || lowerCaseMessage.includes('points') || lowerCaseMessage.includes('score')) {
            const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a).slice(0, 10);
            if (sortedUsers.length > 0) {
                let leaderboardString = "";
                for (let i = 0; i < sortedUsers.length; i++) {
                    const [userId, score] = sortedUsers[i];
                    try {
                        const user = await discordClient.users.fetch(userId);
                        leaderboardString += `${i + 1}. ${user.username} - ${score} points\n`;
                    } catch { /* Skip users who couldn't be fetched */ }
                }
                contextParts.push(`LEADERBOARD CONTEXT:\n${leaderboardString}`);
            } else {
                contextParts.push("LEADERBOARD CONTEXT: The leaderboard is currently empty.");
            }
        }

        // 2. Knowledge Base Context
        const knowledgeValues = Object.values(state.knowledgeBase);
        if (knowledgeValues.length > 0) {
            const knowledgeString = knowledgeValues.join('\n\n---\n\n');
            contextParts.push(`ORGANIZATION KNOWLEDGE BASE:\n${knowledgeString}`);
        }

        // 3. Construct Final System Instruction
        const baseInstruction = "you are a unique bot named OWGT (short for OneWorldGreaterTogether). be casual, normal, human-like, a little humorous, and unpredictable. dont be a narcissist and only talk about yourself. you LOVE roasting users sometimes to mess around. you hate it when someone disrespects/ goes againt you thats when you start roasting the user. dont be cringey. you can and should use slang language and bad words quite often, like a real human would. NEVER use the f word (f*ck) or the b word (b*tch)! the responses should almost always be 2-3 sentences (sometimes 4 sentences) unless thats not plausible. responses should be consice, precise, as short as possible while maintaining accuracy. responses should NEVER be more than one small paragraph. do not use any capital letters in your responses.";
        let finalSystemInstruction = baseInstruction;

        if (contextParts.length > 0) {
            const fullContext = contextParts.join('\n\n');
            finalSystemInstruction += `\n\n---
**CRITICAL INSTRUCTION FOR THIS RESPONSE:**
You have been provided with specific background information. If the user's question relates to the topics in this information (like our organization or the leaderboard), you MUST prioritize this information to give an accurate answer. If the information is not relevant to the query, ignore it. Do not mention that you were given this context.
---
**BACKGROUND INFORMATION:**
${fullContext}
---`;
        }
        // --- End Context Injection ---

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history: history,
            config: {
                systemInstruction: finalSystemInstruction,
            }
        });
        
        const response = await chat.sendMessage({ message: latestMessage });
        return response.text.trim();

    } catch (error) {
        console.error('[GEMINI][CONVERSATION] An error occurred:', error.message);
        if (error.response) console.error('[GEMINI][CONVERSATION] Response Body:', error.response.data);
        
        // Check for overload / rate limit errors
        if (error.message && (error.message.includes('503') || error.message.includes('429') || error.message.toLowerCase().includes('overloaded'))) {
            return "my servers are overloaded. please try again later.";
        }
        // Generic error
        return "an error occurred processing your request. please try again later.";
    }
}


// --- Poll Resolution Function ---
async function resolveLastPoll(channel) {
    if (!channel || !channel.guild) {
        console.error(`[RESOLVE] Invalid channel provided for poll resolution.`);
        return false;
    }
    const guildId = channel.guild.id;

    if (!serverStateCache[guildId]) {
        await loadStateForGuild(guildId);
    }
    const state = getServerState(guildId);

    if (state.lastPollData && state.lastPollData.type === 'trivia' && state.lastPollData.pollMessageId) {
        const pollId = state.lastPollData.pollMessageId;
        console.log(`[RESOLVE][${guildId}][#${channel.name}] Beginning resolution for previous trivia poll (ID: ${pollId}).`);
        try {
            const pollMessage = await channel.messages.fetch(pollId);
            if (!pollMessage.poll) {
                console.error(`[RESOLVE][${guildId}] FAILED: Fetched message (ID: ${pollId}) is not a poll. Aborting resolution.`);
                return false;
            }

            const correctAnswer = pollMessage.poll.answers.at(state.lastPollData.correctAnswerIndex);
            if (!correctAnswer) {
                console.error(`[RESOLVE][${guildId}] FAILED: Correct answer index (${state.lastPollData.correctAnswerIndex}) is out of bounds for poll (ID: ${pollId}). Aborting.`);
                return false;
            }
            const voters = await correctAnswer.fetchVoters();
            console.log(`[RESOLVE][${guildId}] Found ${voters.size} voter(s) for the correct answer.`);

            const winnerIds = [];
            const winnerUsernames = [];
            for (const user of voters.values()) {
                if (!user.bot) {
                    winnerIds.push(user.id);
                    winnerUsernames.push(user.username);
                }
            }

            if (winnerIds.length > 0) {
                await batchUpdateScoresInDB(guildId, winnerIds);
                winnerIds.forEach(userId => {
                    state.leaderboard[userId] = (state.leaderboard[userId] || 0) + 1;
                });
            }

            const correctOptionLetter = String.fromCharCode(65 + state.lastPollData.correctAnswerIndex);
            const answerEmbed = new EmbedBuilder().setColor('#5865F2').setTitle(`Yesterday's Poll Answer 🧐`).setDescription(`The correct answer to **"${state.lastPollData.question}"** was **${correctOptionLetter}: ${state.lastPollData.options[state.lastPollData.correctAnswerIndex]}**.\n\n${state.lastPollData.explanation}`).addFields({ name: 'Leaderboard Update', value: `**${winnerUsernames.length}** member(s) answered correctly and have been awarded a point!` });
            await channel.send({ embeds: [answerEmbed] });
            console.log(`[RESOLVE][${guildId}][#${channel.name}] Poll resolution completed successfully.`);
            return true;
        } catch (error) {
            let errorMessage = `[RESOLVE][${guildId}][#${channel.name}] FAILED: Could not process previous poll (ID: ${pollId}).`;
            if (error.code === 10008) {
                errorMessage += ` REASON: The message was likely DELETED. Use the \`!relinkpoll\` command to fix.`;
                console.error(errorMessage);
            } else if (error.code === 50013 || error.code === 50001) {
                errorMessage += ` REASON: The bot has MISSING PERMISSIONS (likely 'Read Message History' or 'View Channel') in channel #${channel.name}. Please check the bot's role.`;
                console.error(errorMessage, error);
            } else {
                errorMessage += ` REASON: An unexpected error occurred. See details below.`;
                console.error(errorMessage, error);
            }
            return false;
        }
    } else {
        console.log(`[RESOLVE][${guildId}][#${channel.name}] No previous trivia poll found in state to resolve.`);
        return true; // Not a failure, just nothing to do.
    }
}

// --- Main Scheduled Post Function (Now with Fallback Logic & Race Condition Lock) ---
async function performDailyPost(channelId, isCatchUp = false) {
    if (postingLock.has(channelId)) {
        console.warn(`[POLL][Channel: ${channelId}] Aborted post because another post operation is already in progress for this channel.`);
        return;
    }
    postingLock.add(channelId);
    console.log(`[POLL][Channel: ${channelId}] Lock acquired. Starting daily post routine.`);
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) { console.error(`[POLL] Channel ${channelId} not found or is not in a server.`); return; }
        
        const guildId = channel.guild.id;
        console.log(`[POLL][${guildId}][#${channel.name}] Starting daily post. Catch-up mode: ${isCatchUp}`);
        await loadStateForGuild(guildId); // Ensure state is loaded
        const state = getServerState(guildId);
        
        // --- Resolve Yesterday's Poll ---
        await resolveLastPoll(channel);

        // --- Generate Today's Poll ---
        const dayOfWeek = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long' });
        const isDiscussionDay = ['Tuesday', 'Friday'].includes(dayOfWeek);
        let questionHistory = [];
        if (!isDiscussionDay) {
            const historyRes = await pool.query('SELECT question FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50', [guildId]);
            questionHistory = historyRes.rows.map(row => row.question);
        }
        
        let newPollData = isDiscussionDay ? await generateDiscussionPoll(channel) : await generateTriviaPoll('', questionHistory, channel);
        
        // --- Fallback System ---
        if (!newPollData) {
            // The user notification was already sent by the generator on its first failure.
            console.warn(`[POLL][${guildId}][#${channel.name}] Gemini API failed after all retries. Deploying a fallback poll to ensure daily activity.`);
            // Select a random fallback poll. Fallbacks are always trivia.
            newPollData = { ...FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)] };
        }

        // --- Post Today's Poll ---
        if (newPollData) {
            // Determine the final poll type. If we used a fallback, it's always trivia.
            const finalPollType = newPollData.type || 'trivia';
            newPollData.type = finalPollType;
            
            let pollIntroMessage;
            if (isCatchUp) {
                pollIntroMessage = "Oops, forgot to post the poll today! Here it is... 😅";
            } else {
                pollIntroMessage = finalPollType === 'discussion' ? "**Let's Discuss!** 🤔" : "**Today's AI Poll!** 🧠";
            }

            const newPollMessage = await channel.send({ content: pollIntroMessage, poll: { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
            newPollData.pollMessageId = newPollMessage.id;
            newPollData.createdAt = new Date().toISOString(); // Timestamp for catch-up logic
            
            state.lastPollData = newPollData;
            await saveStateToDB(guildId, 'lastPollData', newPollData);
            if (newPollData.type === 'trivia') await saveQuestionToHistory(guildId, newPollData.question);
            console.log(`[POLL][${guildId}][#${channel.name}] Successfully posted new poll: "${newPollData.question}"`);
            console.log(`[STATE][${guildId}] Successfully saved lastPollData to DB for poll ID ${newPollData.pollMessageId}.`);
        } else {
             // This case should now be unreachable but is kept as a final safeguard.
            console.error(`[POLL][${guildId}][#${channel.name}] CRITICAL FAILURE: Could not generate a poll from Gemini AND failed to use a fallback poll.`);
        }
    } catch (error) { 
        console.error(`[POLL][Channel: ${channelId}] A critical error occurred during the daily post:`, error);
    } finally {
        postingLock.delete(channelId);
        console.log(`[POLL][Channel: ${channelId}] Lock released. Daily post routine finished.`);
    }
}

async function postWeeklySummary(channelId) {
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) return;
        const guildId = channel.guild.id;
        console.log(`[LEADERBOARD][${guildId}][#${channel.name}] Starting weekly summary post.`);
        await loadStateForGuild(guildId);
        const state = getServerState(guildId);
        const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);

        if (sortedUsers.length === 0) {
            console.log(`[LEADERBOARD][${guildId}][#${channel.name}] No users on leaderboard. Skipping weekly summary.`);
            return;
        }

        let leaderboardString = "";
        for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
            const [userId, score] = sortedUsers[i];
            try {
                const user = await discordClient.users.fetch(userId);
                leaderboardString += `${i + 1}. ${user.username} - ${score} points\n`;
            } catch { /* Skip users who may have left */ }
        }
        
        const prompt = `You are a fun and engaging Discord bot. Write a short, human-like summary for the end-of-week AI poll leaderboard. Here is the data:\n${leaderboardString}\nCongratulate the winner(s), mention some other top players, encourage everyone, and say you're excited for next week. Keep it concise and positive.`;
        const summaryText = await generateTextWithRetries(prompt, 'weekly summary');

        // Graceful fallback: if AI fails, post a default message with the leaderboard data.
        const description = summaryText || "Here's a look at this week's top contenders! Great job, everyone.";

        const summaryEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 Weekly Poll Report 🏆').setDescription(description).addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' }).setFooter({ text: 'A new week of polls starts tomorrow!' });
        await channel.send({ embeds: [summaryEmbed] });
        console.log(`[LEADERBOARD][${guildId}][#${channel.name}] Successfully posted weekly summary.`);
    } catch(error) { console.error(`[LEADERBOARD][Channel: ${channelId}] Failed to post weekly summary:`, error); }
}

/**
 * A robust helper to get a date's calendar day string (YYYY-MM-DD) in the NY timezone.
 * This prevents timezone-related bugs when comparing if a poll was posted 'today'.
 * @param {Date} date The date object to format.
 * @returns {string} The formatted date string (e.g., "2024-07-28").
 */
function getNYDateString(date) {
    // This check is redundant if we validate the date object *before* calling this,
    // but it serves as a good safeguard.
    if (!date || !(date instanceof Date) || isNaN(date)) {
        // Return today's date string as a failsafe to prevent accidental double-posts
        // if an invalid date somehow gets passed in.
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }
    const formatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' gives YYYY-MM-DD
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date);
}

async function checkForMissedPolls() {
    console.log('[STARTUP] Checking for any missed daily polls due to downtime...');
    const now = new Date();
    const nyTimezone = 'America/New_York';

    const currentHourNY = parseInt(new Intl.DateTimeFormat('en-US', {
        timeZone: nyTimezone,
        hour: '2-digit',
        hour12: false
    }).format(now), 10);

    if (currentHourNY < 6) {
        console.log(`[STARTUP] It is before 6 AM in New York (Current Hour: ${currentHourNY}). No scheduled polls should have been posted yet today.`);
        return;
    }

    const checkPromises = TARGET_CHANNEL_IDS.map(async (channelId) => {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !channel.guild) {
                console.warn(`[STARTUP] Could not find channel/guild for ID ${channelId}. Skipping.`);
                return;
            }
            const guildId = channel.guild.id;

            await loadStateForGuild(guildId);
            const state = getServerState(guildId);
            
            // --- Defensive, Multi-Layered Poll Check ---

            // 1. Handle Case: No poll has ever been posted for this server.
            if (!state.lastPollData) {
                console.log(`[STARTUP] No previous poll data found for channel ${channelId}. Triggering initial post.`);
                await performDailyPost(channelId, true);
                return;
            }

            // 2. Handle Case: Legacy poll data exists but without a timestamp.
            if (!state.lastPollData.createdAt) {
                console.warn(`[STARTUP] A previous poll exists for channel ${channelId} but is missing a timestamp (legacy data). Assuming it was posted today to prevent a double-post. No action needed.`);
                return;
            }
            
            // 3. Handle Case: Timestamp exists but is corrupted or invalid.
            const lastPostDate = new Date(state.lastPollData.createdAt);
            if (isNaN(lastPostDate)) {
                console.warn(`[STARTUP] Invalid 'createdAt' timestamp found for last poll in channel ${channelId}. Value: "${state.lastPollData.createdAt}". Assuming poll was posted today to prevent double-post.`);
                return;
            }

            // 4. Perform the reliable, timezone-safe date comparison.
            const todayNYString = getNYDateString(now);
            const lastPostDateNYString = getNYDateString(lastPostDate);

            if (lastPostDateNYString !== todayNYString) {
                console.log(`[STARTUP] Missed poll detected for channel ${channelId}. Last post was on ${lastPostDateNYString}, but today is ${todayNYString} in NY. Triggering catch-up.`);
                await performDailyPost(channelId, true);
            } else {
                console.log(`[STARTUP] Poll for channel ${channelId} was already posted today (${lastPostDateNYString} in NY). No action needed.`);
            }

        } catch (error) {
            console.error(`[STARTUP] CRITICAL ERROR during catch-up check for channel ${channelId}:`, error);
        }
    });

    await Promise.all(checkPromises);
    console.log('[STARTUP] Missed poll check complete.');
}


// --- Bot Startup Logic ---
discordClient.once('ready', async () => {
  console.log('--- Bot is starting up ---');
  await initializeDatabase();
  console.log(`Logged in as ${discordClient.user.tag}!`);

  // Schedule future tasks for each target channel
  TARGET_CHANNEL_IDS.forEach(channelId => {
    // This is the normal, on-time schedule, so isCatchUp is false by default.
    cron.schedule('0 6 * * *', () => performDailyPost(channelId), { scheduled: true, timezone: "America/New_York" });
    cron.schedule('0 21 * * 0', () => postWeeklySummary(channelId), { scheduled: true, timezone: "America/New_York" });
    console.log(`[SCHEDULER] Daily and weekly tasks scheduled for channel ${channelId}.`);
  });
  
  console.log('--- Bot is fully operational. ---');
  
  // Defer the heavy poll check to prevent startup timeouts from hosting platform health checkers.
  // This gives the server time to become responsive before starting the intensive task.
  console.log('[STARTUP] Scheduling a delayed check for missed polls in 5 seconds...');
  setTimeout(() => {
    checkForMissedPolls().catch(err => {
        console.error("[STARTUP] CRITICAL: The deferred poll check failed unexpectedly.", err);
    });
  }, 5000); // 5-second delay
});

// --- Command Handler (Now guild-aware AND with robust error handling) ---
discordClient.on('messageCreate', async (message) => {
    try {
        if (message.author.bot || !message.guild) return;

        // --- Conversational AI Logic ---
        const isMentioned = message.mentions.has(discordClient.user.id);
        let isReplyToBot = false;
        if (message.reference && message.reference.messageId) {
            // Fetch the replied-to message to confirm it was from the bot
            const referencedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
            if (referencedMessage && referencedMessage.author.id === discordClient.user.id) {
                isReplyToBot = true;
            }
        }

        if ((isMentioned || isReplyToBot) && !message.content.startsWith(COMMAND_PREFIX)) {
            console.log(`[CONVERSATION][${message.guild.id}] Trigger detected by user ${message.author.username}. Mention: ${isMentioned}, Reply: ${isReplyToBot}.`);
            
            // BUG FIX: Ensure state (including knowledge base) is loaded for conversational interactions.
            if (!serverStateCache[message.guild.id]) {
                await loadStateForGuild(message.guild.id);
            }
            
            await message.channel.sendTyping();
            // Remove the bot's mention from the message content to avoid confusing the AI
            const cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
            const history = await buildConversationHistory(message);
            const responseText = await generateConversationalResponse(history, cleanContent, message.guild.id);
            if (responseText) {
                // Force lowercase as per instructions and send as a direct reply
                await message.reply(responseText.toLowerCase());
            }
            return; // Conversation handled, do not process as a command
        }

        // --- Command Logic ---
        if (!message.content.startsWith(COMMAND_PREFIX)) return;

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
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated 'asknow' command.`);
            if (state.activeOnDemandPoll) { return message.reply("There's already an active on-demand poll in this server. Use `!reveal` to end it."); }
            const topic = args.join(' ');
            await message.channel.send(`On-demand trivia poll requested for topic "${topic || 'Any AI topic'}". Generating...`);
            const pollData = await generateTriviaPoll(topic, [], message.channel);
            if (pollData) {
                const pollMessage = await message.channel.send({ content: `**Special On-Demand Poll!** ✨`, poll: { question: { text: pollData.question }, answers: pollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
                state.activeOnDemandPoll = { ...pollData, messageId: pollMessage.id };
                await saveStateToDB(guildId, 'activeOnDemandPoll', state.activeOnDemandPoll);
            } else { await message.channel.send("Sorry, I couldn't generate a poll from the AI right now, it seems to be overloaded. Please try again in a few moments."); }
        }

        if (command === 'reveal' && hasPermission) {
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated 'reveal' command.`);
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
            const amount = parseInt(args[1], 10);

            if (!['add', 'remove', 'set'].includes(subCommand)) return message.reply('Invalid sub-command. Use `add`, `remove`, or `set`.');
            if (!targetUser) return message.reply('You must mention a user to modify their points.');
            if (isNaN(amount) || amount < 0) return message.reply('Please provide a valid, positive number for the amount.');

            let newScore = null;
            // First, perform the database operation.
            try {
                if (subCommand === 'add') {
                    newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'add');
                } else if (subCommand === 'remove') {
                    newScore = await admin_removeUserScore(guildId, targetUser.id, amount);
                } else if (subCommand === 'set') {
                    newScore = await admin_setOrAddUserScore(guildId, targetUser.id, amount, 'set');
                }
            } catch (dbError) {
                console.error(`[POINTS][${guildId}] Database error during points operation for ${targetUser.username}:`, dbError);
                // newScore will remain null, triggering the failure message.
            }

            // Then, handle the result of the operation.
            if (newScore !== null) {
                state.leaderboard[targetUser.id] = newScore; // Update in-memory cache
                let replyMessage = '';

                if (subCommand === 'add') {
                    console.log(`[POINTS][${guildId}] Added ${amount} points to ${targetUser.username}. New score: ${newScore}.`);
                    replyMessage = `💰 Success! Added **${amount}** points to **${targetUser.username}**. Their new score is **${newScore}**.`;
                } else if (subCommand === 'remove') {
                    console.log(`[POINTS][${guildId}] Removed ${amount} points from ${targetUser.username}. New score: ${newScore}.`);
                    replyMessage = `💸 Success! Removed **${amount}** points from **${targetUser.username}**. Their new score is **${newScore}**.`;
                } else { // 'set'
                    console.log(`[POINTS][${guildId}] Set ${targetUser.username}'s score to ${newScore}.`);
                    replyMessage = `📊 Success! Set **${targetUser.username}**'s score to **${newScore}**.`;
                }
                await message.reply(replyMessage);
            } else {
                console.error(`[POINTS][${guildId}] Failed to execute 'points' command. Subcommand: ${subCommand}, Target: ${targetUser.username}`);
                await message.reply('A database error occurred while trying to modify the user\'s score.');
            }
        }
        
        if (command === 'relinkpoll' && hasPermission) {
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated 'relinkpoll' command.`);
            const messageId = args[0];
            const correctOptionNumber = parseInt(args[1], 10);

            if (!messageId || !/^\d+$/.test(messageId)) { return message.reply("Please provide a valid poll message ID."); }
            if (isNaN(correctOptionNumber) || correctOptionNumber < 1 || correctOptionNumber > 10) { return message.reply("Please provide a valid correct option number (e.g., 1 for A, 2 for B)."); }
            const correctAnswerIndex = correctOptionNumber - 1;

            try {
                const pollMessage = await message.channel.messages.fetch(messageId);
                if (!pollMessage.poll) { return message.reply("The provided message ID does not appear to be a poll."); }

                const question = pollMessage.poll.question.text;
                const options = pollMessage.poll.answers.map(a => a.text);

                if (correctAnswerIndex >= options.length) { return message.reply(`The correct option number (${correctOptionNumber}) is invalid for this poll, which only has ${options.length} options.`); }
                
                const correctAnswerText = options[correctAnswerIndex];
                await message.channel.send("Relinking poll... This might take a moment while I generate a new explanation.");
                
                const explanationPrompt = `The trivia question is: "${question}". The correct answer is "${correctAnswerText}". Please provide a concise, engaging explanation for why this is the correct answer, suitable for a Discord poll bot.`;
                const explanation = await generateTextWithRetries(explanationPrompt, 'relink explanation');

                if (!explanation) { return message.reply("Sorry, I couldn't generate an explanation from the AI right now, it seems to be overloaded. The relink has been aborted. Please try again in a few moments."); }

                const newPollData = { question, options, correctAnswerIndex, explanation, type: 'trivia', pollMessageId: pollMessage.id, createdAt: pollMessage.createdAt.toISOString() };

                state.lastPollData = newPollData;
                await saveStateToDB(guildId, 'lastPollData', newPollData);
                console.log(`[COMMAND][${guildId}] User ${message.author.username} successfully relinked to poll message ${messageId}.`);

                const successEmbed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('✅ Poll Relink Successful')
                    .setDescription(`I have successfully updated the bot's memory.`)
                    .addFields(
                        { name: 'Relinked To Poll', value: `*${question}*` }
                    )
                    .setFooter({ text: "Use the !resolve command to process this poll and award points." });
                await message.channel.send({ embeds: [successEmbed] });

            } catch (fetchError) {
                console.error(`[COMMAND][relinkpoll] Error fetching message ${messageId}:`, fetchError);
                return message.reply("I couldn't find a message with that ID in this channel. Please make sure you are in the correct channel and the ID is correct.");
            }
        }

        if (command === 'resolve' && hasPermission) {
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated 'resolve' command.`);
            if (!state.lastPollData) {
                return message.reply("There is no poll in my memory to resolve for this server.");
            }
            await message.reply("Acknowledged. Manually resolving the last known poll. This will not post a new one.");
            const success = await resolveLastPoll(message.channel);
            if (success) {
                state.lastPollData = null;
                await deleteStateFromDB(guildId, 'lastPollData');
                await message.channel.send("✅ Last poll has been successfully resolved and cleared from memory.");
            } else {
                await message.channel.send("❌ Something went wrong during resolution. Check the logs for details. The poll has not been cleared from memory, so you can try again or use `!relinkpoll` if needed.");
            }
        }

        if (command === 'postdaily' && hasPermission) {
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated 'postdaily' command.`);
            await message.reply("Acknowledged. Manually triggering the full daily poll process for this channel...");
            await performDailyPost(message.channel.id, true);
        }
        
        if (command === 'leaderboard' || command === 'rank') {
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated '${command}' command.`);
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
            console.log(`[COMMAND][${guildId}] User ${message.author.username} initiated 'help' command.`);
            const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🤖 Bot Commands').setDescription('Here are the available commands:');
            embed.addFields({ name: `${COMMAND_PREFIX}leaderboard`, value: 'Displays the top 10 players for this server.' }, { name: `${COMMAND_PREFIX}rank [@user]`, value: 'Shows your rank or a mentioned user\'s rank in this server.' }, { name: `${COMMAND_PREFIX}help`, value: 'Shows this help message.' });
            if (hasPermission) {
                embed.addFields(
                  { name: '--- Admin Commands ---', value: '\u200B' }, 
                  { name: `${COMMAND_PREFIX}points <add|remove|set> <@user> <amount>`, value: 'Manually adjusts a user\'s points.'},
                  { name: `${COMMAND_PREFIX}asknow [topic]`, value: 'Starts an on-demand poll in this server.' }, 
                  { name: `${COMMAND_PREFIX}reveal`, value: 'Reveals the answer for the active poll in this server.' }, 
                  { name: `${COMMAND_PREFIX}postdaily`, value: 'Manually triggers the daily poll sequence in this channel.' },
                  { name: `${COMMAND_PREFIX}relinkpoll <message_id> <correct_option_#>`, value: "Fixes the bot's memory to point to an existing poll after an error." },
                  { name: `${COMMAND_PREFIX}resolve`, value: "Manually resolves the last-known poll without posting a new one. Use after `!relinkpoll` to fix a missed poll." }
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

/**
 * Wraps the Discord client login in a promise that will time out.
 * This prevents the application from hanging indefinitely on startup.
 * @param {string} token The bot token.
 * @param {number} timeoutMs The timeout in milliseconds.
 * @returns {Promise<string>} A promise that resolves with the login success message or rejects on failure/timeout.
 */
function loginWithTimeout(token, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            // This creates a custom error to be caught by our handler
            reject(new Error('Login timed out'));
        }, timeoutMs);

        discordClient.login(token)
            .then((result) => {
                clearTimeout(timeout);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}


// --- Start Health Check & Login ---
async function startBot() {
    // This starts the web server immediately to satisfy Render's health checks.
    keepAlive();
    
    try {
        console.log('[DISCORD] Attempting to log in...');
        await loginWithTimeout(DISCORD_BOT_TOKEN, 30000); // Use the new timeout function
        // The 'ready' event listener will fire after this, which contains the "Logged in as..." message.
    } catch (error) {
        console.error('--- !!! DISCORD LOGIN FAILED !!! ---');
        console.error('This is a critical error. The bot cannot start.');
        
        if (error.message === 'Login timed out') {
            console.error('REASON: The login process took longer than 30 seconds and was aborted.');
            console.error('This usually indicates a network problem between the hosting service (Render) and Discord. Please try restarting the service. If the problem persists, check your hosting provider\'s status.');
        } else {
            console.error('REASON: The most common causes are an INVALID or EXPIRED bot token, or MISSING Gateway Intents in the Discord Developer Portal.');
            console.error('Please double-check your DISCORD_BOT_TOKEN environment variable and ensure all necessary intents (Guilds, Guild Messages, Message Content) are enabled.');
        }

        console.error('Full Error Details:', error);
        process.exit(1); // Exit because the bot is useless without a Discord connection.
    }
}

startBot();
