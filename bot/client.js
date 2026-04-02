// --- Discord Client Setup ---
const { Client, GatewayIntentBits } = require('discord.js');
const ai = require('../services/ai/client');

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

// Attach AI client to Discord client for queue worker access
discordClient.ai = ai;

module.exports = discordClient;
