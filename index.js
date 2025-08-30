
// A fully automated Discord Bot that posts a dynamic mix of daily trivia and discussion polls.
// Includes a role-restricted on-demand command and a fully automatic community leaderboard system with weekly summaries.
// Version: 3.0 (Multi-Server Proof)

// --- Import necessary libraries ---
const keepAlive = require('./keepAlive.js');
const { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const { GoogleGenAI, Type } = require('@google/genai');
const cron = require('node-cron');
const { Pool } = require('pg');

// --- Configuration ---
const GEMINI_API_KEY = process.env.API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
// NEW: Reads a comma-separated list of channel IDs for scheduled posts.
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

// --- Database Functions (Now all guild-aware) ---
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // We add 'guild_id' to every table to separate data between servers.
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
    console.log('[DATABASE] All tables are set up and ready for multi-server operation.');
  } catch (error) {
    console.error('[DATABASE] CRITICAL ERROR: Failed to initialize database.', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Loads a server's state into cache on-demand for efficiency
async function loadGuildState(guildId) {
    if (serverStateCache[guildId]) return serverStateCache[guildId]; // Already loaded

    console.log(`[STATE] Loading state for server ${guildId} from DB...`);
    const client = await pool.connect();
    try {
        const guildState = { leaderboard: {}, lastPollData: null, activeOnDemandPoll: null };
        
        const leaderboardRes = await client.query('SELECT user_id, score FROM leaderboard WHERE guild_id = $1', [guildId]);
        leaderboardRes.rows.forEach(row => {
            guildState.leaderboard[row.user_id] = row.score;
        });

        const stateRes = await client.query("SELECT key, value FROM state WHERE guild_id = $1", [guildId]);
        stateRes.rows.forEach(row => {
            guildState[row.key] = row.value;
        });

        serverStateCache[guildId] = guildState;
        console.log(`[STATE] State for server ${guildId} loaded successfully.`);
        return guildState;
    } catch (error) {
        console.error(`[STATE] CRITICAL ERROR loading state for server ${guildId}:`, error);
        return { leaderboard: {}, lastPollData: null, activeOnDemandPoll: null }; // Return default state on error
    } finally {
        client.release();
    }
}

async function updateUserScore(guildId, userId) {
    const guildState = await loadGuildState(guildId);
    guildState.leaderboard[userId] = (guildState.leaderboard[userId] || 0) + 1; // Update cache
    try {
        await pool.query(`
            INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, 1)
            ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + 1;
        `, [guildId, userId]);
    } catch (error) {
        console.error(`[DATABASE] Error updating score for user ${userId} in server ${guildId}:`, error);
        guildState.leaderboard[userId]--; // Revert cache if DB fails
    }
}

async function saveGuildState(guildId, key, value) {
    const guildState = await loadGuildState(guildId);
    guildState[key] = value; // Update cache
    try {
        await pool.query(`
            INSERT INTO state (guild_id, key, value) VALUES ($1, $2, $3)
            ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;
        `, [guildId, key, JSON.stringify(value)]);
    } catch (error) {
        console.error(`[DATABASE] Error saving state for key '${key}' in server ${guildId}:`, error);
    }
}

async function deleteGuildState(guildId, key) {
    const guildState = await loadGuildState(guildId);
    guildState[key] = null; // Update cache
    try {
        await pool.query('DELETE FROM state WHERE guild_id = $1 AND key = $2', [guildId, key]);
    } catch (error) {
        console.error(`[DATABASE] Error deleting state for key '${key}' in server ${guildId}:`, error);
    }
}

async function saveQuestionToHistory(guildId, question) {
    try {
        await pool.query('INSERT INTO question_history (guild_id, question) VALUES ($1, $2)', [guildId, question]);
        await pool.query(`
            DELETE FROM question_history WHERE id NOT IN (
                SELECT id FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50
            );
        `, [guildId]);
    } catch (error) {
        console.error(`[DATABASE] Error saving question history for server ${guildId}:`, error);
    }
}

// --- Gemini API Schemas and Functions (Unchanged) ---
const triviaPollSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["question", "options", "correctAnswerIndex", "explanation"] };
const discussionPollSchema = { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 2, maxItems: 4 } }, required: ["question", "options"] };

async function generateTriviaPoll(topic = '', history = []) { /* ... unchanged ... */ 
    const historyInstruction = history.length > 0 ? `**To ensure variety, you MUST NOT create a poll about any of these recent topics:**\n- "${history.join('"\n- "')}"` : "";
    const prompt = `You generate engaging, intermediate-level trivia polls exclusively about Artificial Intelligence. Questions should be challenging but not obscure. ${topic ? `The poll must be about: **${topic}**.` : ''} ${historyInstruction} **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate the poll based on the provided schema.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: triviaPollSchema, temperature: 0.9 }});
        return JSON.parse(response.text.trim());
    } catch (error) { console.error("[GEMINI] Error generating TRIVIA poll:", error); return null; }
}
async function generateDiscussionPoll() { /* ... unchanged ... */ 
    const prompt = `You generate subjective, opinion-based polls about AI to spark community discussion. Good examples: "What AI Model do you primarily use?", "Will AI take over the world?". **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate poll based on schema.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: discussionPollSchema, temperature: 1.0 }});
        return JSON.parse(response.text.trim());
    } catch (error) { console.error("[GEMINI] Error generating DISCUSSION poll:", error); return null; }
}


// --- Main Scheduled Post Functions (Now loops through channels) ---
async function performDailyPost() {
  console.log('[POLL] Starting daily poll sequence for all target channels...');
  for (const channelId of TARGET_CHANNEL_IDS) {
    try {
      const channel = await discordClient.channels.fetch(channelId);
      if (!channel || !channel.guild) {
        console.error(`[POLL] Could not find channel or guild for channel ID: ${channelId}`);
        continue;
      }
      const guildId = channel.guild.id;
      const guildState = await loadGuildState(guildId);
      console.log(`[POLL] Processing daily post for server: ${channel.guild.name}`);

      if (guildState.lastPollData && guildState.lastPollData.type === 'trivia' && guildState.lastPollData.pollMessageId) {
        // ... (Logic for revealing yesterday's poll, now using guildState)
        try {
            const pollMessage = await channel.messages.fetch(guildState.lastPollData.pollMessageId);
            const correctAnswer = pollMessage.poll.answers.at(guildState.lastPollData.correctAnswerIndex);
            const voters = await correctAnswer.fetchVoters();
            let winners = [];
            for (const user of voters.values()) {
                if (!user.bot) {
                    await updateUserScore(guildId, user.id);
                    winners.push(user.username);
                }
            }
            const correctOptionLetter = String.fromCharCode(65 + guildState.lastPollData.correctAnswerIndex);
            const answerEmbed = new EmbedBuilder().setColor('#5865F2').setTitle(`Yesterday's Poll Answer 🧐`).setDescription(`**Q: ${guildState.lastPollData.question}**`).addFields({ name: 'Correct Answer', value: `**${correctOptionLetter}: ${guildState.lastPollData.options[guildState.lastPollData.correctAnswerIndex]}**` }, { name: 'Explanation', value: guildState.lastPollData.explanation }, { name: 'Points Awarded!', value: `**${winners.length}** member(s) answered correctly!` });
            await channel.send({ embeds: [answerEmbed] });
        } catch (fetchError) { console.error(`[POLL] Could not process previous poll for server ${guildId}:`, fetchError.message); }
      }

      // Generate and post new poll...
      const dayOfWeek = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'long' });
      const isDiscussionDay = ['Tuesday', 'Friday'].includes(dayOfWeek);
      let questionHistory = [];
      if (!isDiscussionDay) {
          const historyRes = await pool.query('SELECT question FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 25', [guildId]);
          questionHistory = historyRes.rows.map(r => r.question);
      }
      
      const newPollData = isDiscussionDay ? await generateDiscussionPoll() : await generateTriviaPoll('', questionHistory);
      if (newPollData) {
        newPollData.type = isDiscussionDay ? 'discussion' : 'trivia';
        const pollMessage = await channel.send({ content: `**${isDiscussionDay ? "Let's Discuss! 🤔" : "Today's AI Poll! 🧠"}**`, poll: { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultoselect: false }});
        newPollData.pollMessageId = pollMessage.id;
        await saveGuildState(guildId, 'lastPollData', newPollData);
        if (newPollData.type === 'trivia') await saveQuestionToHistory(guildId, newPollData.question);
      }
    } catch (error) {
      console.error(`[POLL] A critical error occurred during daily post for channel ${channelId}:`, error);
    }
  }
}

async function postWeeklySummary() {
  console.log('[LEADERBOARD] Starting weekly summary for all target channels...');
  for (const channelId of TARGET_CHANNEL_IDS) {
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) continue;
        const guildId = channel.guild.id;
        const guildState = await loadGuildState(guildId);
        console.log(`[LEADERBOARD] Generating summary for server: ${channel.guild.name}`);

        const sortedUsers = Object.entries(guildState.leaderboard).sort(([,a],[,b]) => b - a);
        if (sortedUsers.length === 0) continue;

        let leaderboardString = "";
        for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
            const [userId, score] = sortedUsers[i];
            try {
                const user = await discordClient.users.fetch(userId);
                leaderboardString += `${i + 1}. ${user.username} - ${score} points\n`;
            } catch { /* Skip users who may have left */ }
        }

        const prompt = `You are a fun Discord bot. Write a short, human-like summary for the end-of-week AI poll leaderboard. Here is the data for this server:\n${leaderboardString}\nCongratulate the winner(s) and encourage everyone for next week.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const summaryEmbed = new EmbedBuilder().setColor('#FFD700').setTitle(`🏆 Weekly Poll Report for ${channel.guild.name} 🏆`).setDescription(response.text).addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' });
        await channel.send({ embeds: [summaryEmbed] });
    } catch (error) {
        console.error(`[LEADERBOARD] Failed to post weekly summary for channel ${channelId}:`, error);
    }
  }
}


// --- Bot Startup Logic ---
discordClient.once('ready', async () => {
  console.log('--- Bot is starting up ---');
  await initializeDatabase();
  console.log(`Logged in as ${discordClient.user.tag}!`);
  
  // Schedule tasks to run for all specified channels.
  cron.schedule('0 10 * * *', performDailyPost, { scheduled: true, timezone: "America/New_York" });
  cron.schedule('0 21 * * 0', postWeeklySummary, { scheduled: true, timezone: "America/New_York" });
  
  console.log('--- Bot is fully operational and scheduled tasks are running. ---');
});

// --- Command Handler (Now guild-aware) ---
discordClient.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(COMMAND_PREFIX) || !message.guild) return;

  const guildId = message.guild.id;
  const hasPermission = message.author.username === ALLOWED_USERNAME || message.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);
  const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  // For all commands, we now operate on the specific guild's state.
  const guildState = await loadGuildState(guildId);

  // !asknow
  if (command === 'asknow' && hasPermission) {
    if (guildState.activeOnDemandPoll) {
      return message.reply("There's already an active poll in this server. Use `!reveal` to end it.");
    }
    const topic = args.join(' ');
    await message.channel.send(`On-demand poll requested. Generating...`);
    const pollData = await generateTriviaPoll(topic); // On-demand polls don't need history
    if (pollData) {
        const pollMessage = await message.channel.send({ content: `**Special On-Demand Poll!** ✨`, poll: { question: { text: pollData.question }, answers: pollData.options.map(o => ({ text: o })), duration: 24, allowMultoselect: false } });
        const pollToSave = { ...pollData, messageId: pollMessage.id };
        await saveGuildState(guildId, 'activeOnDemandPoll', pollToSave);
        await message.channel.send("Poll created! Use `!reveal` to show the answer.");
    } else {
        await message.channel.send("Sorry, I couldn't generate a poll right now.");
    }
  }

  // !reveal
  if (command === 'reveal' && hasPermission) {
    if (!guildState.activeOnDemandPoll) {
      return message.reply("There is no active poll in this server to reveal.");
    }
    const pollData = guildState.activeOnDemandPoll;
    const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);
    const answerEmbed = new EmbedBuilder().setColor('#2ECC71').setTitle('Answer & Explanation 🧐').setDescription(`**Q: ${pollData.question}**`).addFields({ name: 'Correct Answer', value: `**${correctOptionLetter}: ${pollData.options[pollData.correctAnswerIndex]}**` }, { name: 'Explanation', value: pollData.explanation });
    await message.channel.send({ embeds: [answerEmbed] });
    await deleteGuildState(guildId, 'activeOnDemandPoll');
  }

  // !leaderboard
  if (command === 'leaderboard') {
    const sortedUsers = Object.entries(guildState.leaderboard).sort(([,a],[,b]) => b - a).slice(0, 10);
    if (sortedUsers.length === 0) {
      return message.channel.send('The leaderboard for this server is empty!');
    }
    const leaderboardEmbed = new EmbedBuilder().setColor('#F1C40F').setTitle(`🏆 AI Poll Leaderboard for ${message.guild.name} 🏆`);
    let description = '';
    for (let i = 0; i < sortedUsers.length; i++) {
        const [userId, score] = sortedUsers[i];
        try {
            const user = await discordClient.users.fetch(userId);
            description += `**${i + 1}. ${user.username}** - ${score} points\n`;
        } catch { /* Skip users who couldn't be fetched */ }
    }
    leaderboardEmbed.setDescription(description);
    await message.channel.send({ embeds: [leaderboardEmbed] });
  }
  
  // !rank
  if (command === 'rank') {
    const targetUser = message.mentions.users.first() || message.author;
    const score = guildState.leaderboard[targetUser.id];
    if (score !== undefined) {
        const rank = Object.keys(guildState.leaderboard).sort((a, b) => guildState.leaderboard[b] - guildState.leaderboard[a]).indexOf(targetUser.id) + 1;
        await message.channel.send(`${targetUser.username}, you are rank **#${rank}** in this server with **${score}** point(s).`);
    } else {
        await message.channel.send(`${targetUser.username}, you are not on the leaderboard for this server yet.`);
    }
  }

  // !help and other commands can be added here following the same guild-aware pattern
  if (command === 'help') {
    const helpEmbed = new EmbedBuilder().setColor('#5865F2').setTitle('🤖 Bot Commands').setDescription('Here are the available commands:');
    helpEmbed.addFields({ name: `${COMMAND_PREFIX}leaderboard`, value: 'Displays the top 10 players in this server.' }, { name: `${COMMAND_PREFIX}rank [@user]`, value: 'Shows your rank or the rank of a mentioned user in this server.' }, { name: `${COMMAND_PREFIX}help`, value: 'Shows this help message.' });
    if (hasPermission) {
        helpEmbed.addFields({ name: '--- Admin Commands ---', value: '\u200B' }, { name: `${COMMAND_PREFIX}asknow [topic]`, value: 'Starts a persistent on-demand poll for this server.' }, { name: `${COMMAND_PREFIX}reveal`, value: 'Reveals the answer to the active on-demand poll in this server.' });
    }
    await message.channel.send({ embeds: [helpEmbed] });
  }
});


// --- Login to Discord ---
discordClient.login(DISCORD_BOT_TOKEN);
keepAlive();
