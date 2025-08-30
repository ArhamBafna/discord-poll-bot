
// A fully automated Discord Bot that posts a dynamic mix of daily trivia and discussion polls.
// Includes a role-restricted on-demand command and a fully automatic community leaderboard system with weekly summaries.

// IMPORTANT NOTE FOR RENDER USERS: Render's free instances have an ephemeral filesystem.
// This means the 'leaderboard.json' and 'lastpoll.json' files will be DELETED every time
// the bot restarts or redeploys. For a persistent leaderboard, consider using a free database service.

// --- Import necessary libraries ---
const keepAlive = require('./keepAlive.js');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { GoogleGenAI, Type } = require('@google/genai');
const cron = require('node-cron');
const fs = require('fs');

// --- Configuration ---
const GEMINI_API_KEY = process.env.API_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TARGET_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const ALLOWED_USERNAME = 'ar_him';
const CONTROL_ROLE_NAME = 'bot-control'; // The name of the role that can use commands
const COMMAND_PREFIX = '!';
const LEADERBOARD_FILE = './leaderboard.json';
const LAST_POLL_FILE = './lastpoll.json';

// Check if all necessary environment variables are set.
if (!GEMINI_API_KEY || !DISCORD_BOT_TOKEN || !TARGET_CHANNEL_ID) {
  console.error("CRITICAL ERROR: Make sure API_KEY, DISCORD_BOT_TOKEN, and DISCORD_CHANNEL_ID are set in Replit Secrets.");
  process.exit(1);
}

// --- State Management ---
let lastPollData = null;
let onDemandHistory = [];
let leaderboard = {};
let activeOnDemandPoll = null; // To hold the currently active on-demand poll

// --- State File Functions ---
function loadState() {
  // Load Leaderboard
  if (fs.existsSync(LEADERBOARD_FILE)) {
    try {
      const leaderboardData = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
      if (leaderboardData) {
        leaderboard = JSON.parse(leaderboardData);
        console.log('Leaderboard loaded successfully.');
      }
    } catch (error) {
      console.warn('Could not parse leaderboard.json, it might be corrupted. Starting with a fresh leaderboard.');
      leaderboard = {};
    }
  }

  // Load Last Poll Data
  if (fs.existsSync(LAST_POLL_FILE)) {
    try {
      const lastPollFileData = fs.readFileSync(LAST_POLL_FILE, 'utf8');
      if (lastPollFileData) {
        lastPollData = JSON.parse(lastPollFileData);
        console.log('Last poll data loaded successfully.');
      }
    } catch (error) {
      console.warn('Could not parse lastpoll.json, it might be corrupted. Will proceed without last poll data.');
      lastPollData = null;
    }
  }
}

function saveLeaderboard() {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
    console.log('Leaderboard saved.');
  } catch (error) { console.error('Error saving leaderboard:', error); }
}

function saveLastPoll() {
  try {
    fs.writeFileSync(LAST_POLL_FILE, JSON.stringify(lastPollData, null, 2));
  } catch (error) { console.error('Error saving last poll data:', error); }
}

// --- Initialize Clients ---
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- Gemini API Schemas ---
const triviaPollSchema = {
    type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 }, correctAnswerIndex: { type: Type.INTEGER }, explanation: { type: Type.STRING } }, required: ["question", "options", "correctAnswerIndex", "explanation"]
};
const discussionPollSchema = {
    type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 2, maxItems: 4 } }, required: ["question", "options"]
};

// --- Gemini API Generation Functions ---
async function generateTriviaPoll(topic = '', history = []) {
    console.log(`Generating a new TRIVIA poll. Topic: ${topic || 'Any'}`);
    const historyInstruction = history.length > 0 ? `**Avoid topics similar to these recent questions:** - "${history.join('"\n- "')}"` : "";
    const topicInstruction = topic ? `The poll must be about this specific topic: **${topic}**.` : '';
    const prompt = `You generate simple, general knowledge AI trivia polls for a non-technical audience. Your goal is to create an easy, fun, and accessible poll. ${topicInstruction} ${historyInstruction} **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate the poll based on the provided schema.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: triviaPollSchema, temperature: 0.9 }});
        return JSON.parse(response.text.trim());
    } catch (error) { console.error("Error generating TRIVIA poll:", error); return null; }
}

async function generateDiscussionPoll() {
    console.log("Generating a new DISCUSSION poll.");
    const prompt = `You generate subjective, opinion-based polls about AI to spark community discussion. Questions should be open-ended in nature but have distinct options. Good examples: "What AI Model do you primarily use?", "Will AI take over the world?". **CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate poll based on schema.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: discussionPollSchema, temperature: 1.0 }});
        return JSON.parse(response.text.trim());
    } catch (error) { console.error("Error generating DISCUSSION poll:", error); return null; }
}


// --- Main Daily Post Function ---
async function performDailyPost(channelId = TARGET_CHANNEL_ID) {
  console.log(`Starting daily post procedure for channel: ${channelId}`);
  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel) { console.error(`Target channel ${channelId} not found.`); return; }

    if (lastPollData && lastPollData.type === 'trivia' && lastPollData.pollMessageId) {
      console.log("Processing yesterday's trivia poll for automatic scoring.");
      try {
        const pollMessage = await channel.messages.fetch(lastPollData.pollMessageId);
        if (pollMessage && pollMessage.poll) {
          const correctAnswerIndex = lastPollData.correctAnswerIndex;
          const answers = pollMessage.poll.answers;

          if (answers && answers.length > correctAnswerIndex) {
            const correctAnswer = answers.at(correctAnswerIndex);
            const voters = await correctAnswer.fetchVoters();
            let winners = [];
            voters.forEach(user => {
              if (!user.bot) {
                leaderboard[user.id] = (leaderboard[user.id] || 0) + 1;
                winners.push(user.username);
              }
            });
            if (winners.length > 0) {
              console.log(`Awarded points to: ${winners.join(', ')}`);
              saveLeaderboard();
            }

            const correctOptionLetter = String.fromCharCode(65 + lastPollData.correctAnswerIndex);
            const correctOptionText = lastPollData.options[lastPollData.correctAnswerIndex];
            const answerEmbed = new EmbedBuilder().setColor('#5865F2').setTitle(`Yesterday's Poll Answer 🧐`).setDescription(`**Q: ${lastPollData.question}**`)
              .addFields(
                { name: 'Correct Answer', value: `**${correctOptionLetter}: ${correctOptionText}**` },
                { name: 'Explanation', value: lastPollData.explanation },
                { name: 'Leaderboard', value: `**${winners.length}** member(s) answered correctly and have been awarded a point!` }
              ).setFooter({ text: 'Points are awarded automatically. No need to claim!' });
            await channel.send({ embeds: [answerEmbed] });
          }
        }
      } catch (fetchError) { console.error("Could not fetch or process the previous poll message. It might have been from a different server or deleted.", fetchError); }
    } else if (lastPollData && lastPollData.type === 'discussion') {
        await channel.send(`Thanks for sharing your thoughts on yesterday's discussion: **"${lastPollData.question}"**`);
    }

    const isDiscussionDay = Math.random() < 0.35;
    let newPollData = isDiscussionDay ? await generateDiscussionPoll() : await generateTriviaPoll();
    if (newPollData) {
      newPollData.type = isDiscussionDay ? 'discussion' : 'trivia';
      const pollPayload = { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false };
      const title = newPollData.type === 'discussion' ? "**Let's Discuss!** 🤔" : "**Today's AI Poll!** 🧠";
      const newPollMessage = await channel.send({ content: title, poll: pollPayload });
      newPollData.pollMessageId = newPollMessage.id;
      lastPollData = newPollData;
      saveLastPoll();
      console.log(`Successfully posted a ${newPollData.type} poll.`);
    }
  } catch (error) { console.error("An error occurred during the daily post:", error); }
}


// --- Weekly Summary Function ---
async function postWeeklySummary() {
    console.log("Generating weekly leaderboard summary.");
    const sortedUsers = Object.entries(leaderboard).sort(([,a],[,b]) => b - a).slice(0, 10);
    if (sortedUsers.length === 0) {
        console.log("Leaderboard is empty, skipping weekly summary.");
        return;
    }

    let leaderboardString = "";
    for (let i = 0; i < sortedUsers.length; i++) {
        const [userId, score] = sortedUsers[i];
        try {
            const user = await discordClient.users.fetch(userId);
            leaderboardString += `${i + 1}. ${user.username} - ${score} points\n`;
        } catch { /* Skip users who may have left */ }
    }

    const prompt = `You are a fun and engaging Discord bot. Your task is to write a short, human-like summary for the end-of-week AI poll leaderboard.
    Here is the leaderboard data:
    ${leaderboardString}

    Your summary should:
    - Congratulate the winner(s).
    - Mention some of the other top players.
    - Be encouraging to everyone else.
    - End by saying you're excited for next week's polls.
    Keep it concise and positive.`;

    try {
        const channel = await discordClient.channels.fetch(TARGET_CHANNEL_ID);
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });

        const summaryEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Weekly Poll Report 🏆')
            .setDescription(response.text)
            .addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' })
            .setFooter({ text: 'A new week of polls starts tomorrow!' });

        await channel.send({ embeds: [summaryEmbed] });
        console.log("Weekly summary posted.");
    } catch(error) {
        console.error("Failed to post weekly summary:", error);
    }
}


// --- Bot Startup Logic ---
discordClient.once('ready', () => {
  console.log(`Bot is logged in as ${discordClient.user.tag}!`);
  loadState();
  // Daily poll at 10 AM ET
  cron.schedule('0 10 * * *', () => performDailyPost(), { scheduled: true, timezone: "America/New_York" });
  // Weekly summary at 9 PM ET on Sunday
  cron.schedule('0 21 * * 0', postWeeklySummary, { scheduled: true, timezone: "America/New_York" });
});

// --- Command Handler ---
discordClient.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(COMMAND_PREFIX)) return;

  const hasPermission = message.author.username === ALLOWED_USERNAME || message.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);

  const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // !asknow [optional topic]
  if (command === 'asknow') {
    if (!hasPermission) return;
    if (activeOnDemandPoll) {
      await message.channel.send("There's already an active on-demand poll. Please use `!reveal` to end it before starting a new one.");
      return;
    }
    const topic = args.join(' ');
    try {
      await message.channel.send(`On-demand trivia poll requested. Generating...`);
      const pollData = await generateTriviaPoll(topic, onDemandHistory);
      if (pollData) {
        onDemandHistory.push(pollData.question);
        if (onDemandHistory.length > 5) onDemandHistory.shift();
        const pollMessage = await message.channel.send({ content: `**Special On-Demand Poll!** ✨`, poll: { question: { text: pollData.question }, answers: pollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });

        // Save the poll data to be revealed later
        activeOnDemandPoll = { ...pollData, messageId: pollMessage.id };
        await message.channel.send("Poll created! Use `!reveal` to show the answer when you're ready.");
      }
    } catch (error) { console.error("Error handling '!asknow' command:", error); }
  }

  // !reveal command
  if (command === 'reveal') {
    if (!hasPermission) return;
    if (!activeOnDemandPoll) {
        return message.channel.send("There is no active on-demand poll to reveal.");
    }

    try {
        const pollData = activeOnDemandPoll;
        const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);
        const correctOptionText = pollData.options[pollData.correctAnswerIndex];
        const answerEmbed = new EmbedBuilder().setColor('#2ECC71').setTitle('Answer & Explanation 🧐').setDescription(`**Q: ${pollData.question}**`)
          .addFields({ name: 'Correct Answer', value: `**${correctOptionLetter}: ${correctOptionText}**` }, { name: 'Explanation', value: pollData.explanation })
          .setFooter({text: 'On-demand polls do not count towards the leaderboard.'});

        await message.channel.send({ embeds: [answerEmbed] });

        // Reset the state so a new poll can be created
        activeOnDemandPoll = null;
        console.log("On-demand poll revealed and reset.");
    } catch (error) {
        console.error("Error handling '!reveal' command:", error);
    }
  }

  // !postdaily command
  if (command === 'postdaily') {
    if (!hasPermission) return;
    try {
        await message.channel.send("Acknowledged. Manually triggering the daily poll process for this channel...");
        // Pass the ID of the channel where the command was used
        await performDailyPost(message.channel.id);
    } catch (error) {
        console.error("Error handling '!postdaily' command:", error);
        await message.channel.send("An unexpected error occurred while trying to post the daily poll.");
    }
  }

  // !leaderboard
  if (command === 'leaderboard') {
    const sortedUsers = Object.entries(leaderboard).sort(([,a],[,b]) => b - a).slice(0, 10);
    if (sortedUsers.length === 0) {
      return message.channel.send('The leaderboard is empty! Participate in the daily polls to get on the board.');
    }
    const leaderboardEmbed = new EmbedBuilder().setColor('#F1C40F').setTitle('🏆 AI Poll Leaderboard 🏆');
    let description = '';
    for (let i = 0; i < sortedUsers.length; i++) {
        const [userId, score] = sortedUsers[i];
        try {
            const user = await discordClient.users.fetch(userId);
            description += `**${i + 1}. ${user.username}** - ${score} points\n`;
        } catch { /* Skip users who couldn't be fetched */ }
    }
    leaderboardEmbed.setDescription(description || 'No users to display.');
    await message.channel.send({ embeds: [leaderboardEmbed] });
  }
});

// --- Login to Discord ---
discordClient.login(DISCORD_BOT_TOKEN);
keepAlive();
