// --- Bot Ready Event Handler ---
const { Routes } = require('discord.js');
const cron = require('node-cron');
const { initializeDatabase } = require('../database/initialization');
const { commands, rest } = require('../commands/definitions');
const { cacheAndSyncInvites } = require('../services/invites/tracking');
const { TARGET_CHANNEL_IDS } = require('../config');
const { performDailyPost, postWeeklySummary } = require('../services/polls/posting');
const { checkForMissedPolls } = require('../services/polls/scheduling');
const { checkAndPostEngagement } = require('../services/engagement');
const { syncAllMilestoneRoles } = require('../services/roles/milestones');
const serviceHelpers = require('../lib/serviceHelpers');
const dbOperations = require('../database/operations');
const stateManager = require('../state/manager');

async function handleReady(discordClient) {
    console.log('--- Bot is starting up ---');
    await initializeDatabase();
    console.log(`Logged in as ${discordClient.user.tag}!`);

    try {
        const guilds = Array.from(discordClient.guilds.cache.values());
        for (const guild of guilds) {
            // Refresh commands
            await rest.put(
                Routes.applicationGuildCommands(discordClient.user.id, guild.id),
                { body: commands },
            );

            // --- Background Startup Tasks ---
            (async () => {
                try {
                    // 1. Milestone Sync
                    await dbOperations.loadStateForGuild(guild.id);
                    const state = stateManager.getServerState(guild.id);
                    await syncAllMilestoneRoles(guild, state);

                    // 2. Invite Caching
                    await cacheAndSyncInvites(guild);
                } catch (err) {
                    console.error(`[STARTUP][${guild.id}] Background task failed:`, err);
                }
            })();
        }
        console.log(`[STARTUP] Commands refreshed and background tasks started for ${guilds.length} guilds.`);
    } catch (error) {
        console.error('[STARTUP] Failed during guild initialization:', error);
    }

    TARGET_CHANNEL_IDS.forEach(channelId => {
        cron.schedule('0 6 * * *', () => performDailyPost(channelId, discordClient), { scheduled: true, timezone: 'America/New_York' });
        cron.schedule('0 21 * * 0', () => postWeeklySummary(channelId, discordClient), { scheduled: true, timezone: 'America/New_York' });
    });

    // Engagement scanning is global and already iterates all guilds.
    cron.schedule('0 10 * * *', () => checkAndPostEngagement(discordClient), { scheduled: true, timezone: 'America/New_York' });

    serviceHelpers.startConvQueueWorker(discordClient); // Start the background queue processor
    console.log('--- Bot is fully operational. ---');

    console.log('[STARTUP] Backgrounding catch-up check and initial engagement check...');
    checkForMissedPolls(discordClient).catch(err => console.error('[STARTUP] Catch-up check failed.', err));
    checkAndPostEngagement(discordClient).catch(err => console.error('[STARTUP] Initial engagement check failed.', err));
}

module.exports = { handleReady };
