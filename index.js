// --- AI ASSISTANT INSTRUCTION --- READ THE `AI_ASSISTANT_README.md` FILE BEFORE MAKING ANY CHANGES. IT CONTAINS CRITICAL, PERMANENT DIRECTIVES FOR THIS PROJECT. --- END OF INSTRUCTION ---

// A fully automated Discord Bot that posts a dynamic mix of daily trivia and discussion polls.
// Includes a role-restricted on-demand command and a fully automatic community leaderboard system with weekly summaries.
// Version: 7.2 (Slash Commands, Interactive KB, Spam Protection & Stability Fixes)

// --- Global Error Handlers (Safety Net) ---
process.on('unhandledRejection', err => {
    console.error(`[${new Date().toISOString()}] [FATAL] Unhandled rejection: ${err.message || err}`);
    console.error(err); // Keep full stack trace
});

process.on('uncaughtException', err => {
    console.error(`[${new Date().toISOString()}] [FATAL] Uncaught exception: ${err.message || err}`);
    console.error(err); // Keep full stack trace
});

// --- Import Modules ---
const keepAlive = require('./keepAlive.js');
const discordClient = require('./bot/client');
const { startBot } = require('./utils/startup');
const { handleReady } = require('./handlers/ready');
const { handleMessageCreate } = require('./handlers/message');
const { handleInteractionCreate } = require('./handlers/interaction');
const { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd } = require('./handlers/invites');

// --- Register Event Handlers ---
discordClient.once('ready', () => handleReady(discordClient));
discordClient.on('messageCreate', (message) => handleMessageCreate(message, discordClient));
discordClient.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, discordClient));
discordClient.on('guildCreate', (guild) => handleGuildCreate(guild));
discordClient.on('inviteCreate', (invite) => handleInviteCreate(invite, discordClient));
discordClient.on('inviteDelete', (invite) => handleInviteDelete(invite));
discordClient.on('guildMemberAdd', (member) => handleGuildMemberAdd(member, discordClient));

// --- Start Bot ---
startBot(discordClient, keepAlive);
