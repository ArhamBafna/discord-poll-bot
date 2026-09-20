// A Discord bot that posts daily trivia and discussion polls.
// Includes a role-restricted on-demand command and an automatic leaderboard with weekly summaries.

try {
    process.loadEnvFile();
} catch (e) {}

process.on('unhandledRejection', err => {
    console.error(`[${new Date().toISOString()}] [FATAL] Unhandled rejection: ${err.message || err}`);
    console.error(err);
});

process.on('uncaughtException', err => {
    console.error(`[${new Date().toISOString()}] [FATAL] Uncaught exception: ${err.message || err}`);
    console.error(err);
});

const discordClient = require('./bot/client.js');
const { startBot } = require('./utils/startup');
const { log } = require('./utils/logger');
const { handleReady } = require('./handlers/ready');
const { handleMessageCreate } = require('./handlers/message');
const { handleInteractionCreate } = require('./handlers/interaction');
const { handleGuildCreate, handleInviteCreate, handleInviteDelete, handleGuildMemberAdd } = require('./handlers/invites');

const { Events } = require('discord.js');

discordClient.once(Events.ClientReady, () => handleReady(discordClient));
discordClient.on('messageCreate', (message) => handleMessageCreate(message, discordClient));
discordClient.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, discordClient));
discordClient.on('guildCreate', (guild) => handleGuildCreate(guild));
discordClient.on('inviteCreate', (invite) => handleInviteCreate(invite, discordClient));
discordClient.on('inviteDelete', (invite) => handleInviteDelete(invite));
discordClient.on('guildMemberAdd', (member) => handleGuildMemberAdd(member, discordClient));

async function main() {
    try {
        await startBot(discordClient);
    } catch (error) {
        log(`Startup failed: ${error.message}`, 'FATAL');
        console.error(error);
        process.exit(1);
    }
}

main();
