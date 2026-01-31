// --- Bot Ready Event Handler ---
const { Routes } = require('discord.js');
const cron = require('node-cron');
const { initializeDatabase } = require('../database/initialization');
const { commands, rest } = require('../commands/definitions');
const { cacheAndSyncInvites } = require('../services/invites/tracking');
const { TARGET_CHANNEL_IDS } = require('../config');
const { performDailyPost, postWeeklySummary } = require('../services/polls/posting');
const { checkForMissedPolls } = require('../services/polls/scheduling');
const serviceHelpers = require('../lib/serviceHelpers');

async function handleReady(discordClient) {
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
        cron.schedule('0 6 * * *', () => performDailyPost(channelId, discordClient), { scheduled: true, timezone: "America/New_York" });
        cron.schedule('0 21 * * 0', () => postWeeklySummary(channelId, discordClient), { scheduled: true, timezone: "America/New_York" });
        console.log(`[SCHEDULER] Daily/Weekly tasks scheduled for ${channelId}.`);
    });

    serviceHelpers.startConvQueueWorker(discordClient); // Start the background queue processor
    console.log('--- Bot is fully operational. ---');

    console.log('[STARTUP] Scheduling catch-up check in 5 seconds...');
    setTimeout(() => { checkForMissedPolls(discordClient).catch(err => console.error("[STARTUP] Catch-up check failed.", err)); }, 5000);
}

module.exports = { handleReady };
