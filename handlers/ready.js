// --- Bot Ready Event Handler ---
const { Routes } = require('discord.js');
const cron = require('node-cron');
const { log } = require('../utils/logger');
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
    log('Bot is starting up.', 'STARTUP');
    await initializeDatabase();
    log(`Logged in as ${discordClient.user.tag}!`, 'STARTUP');

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
                    log(`Background task failed for guild ${guild.id}: ${err.message}`, 'STARTUP');
                }
            })();
        }
        log(`Commands refreshed and background tasks started for ${guilds.length} guilds.`, 'STARTUP');
    } catch (error) {
        log(`Failed during guild initialization: ${error.message}`, 'STARTUP');
    }

    TARGET_CHANNEL_IDS.forEach(channelId => {
        cron.schedule('0 6 * * *', () => performDailyPost(channelId, discordClient), { scheduled: true, timezone: 'America/New_York' });
        cron.schedule('0 21 * * 0', () => postWeeklySummary(channelId, discordClient), { scheduled: true, timezone: 'America/New_York' });
    });

    // Engagement scanning is global and already iterates all guilds.
    cron.schedule('0 10 * * *', () => checkAndPostEngagement(discordClient), { scheduled: true, timezone: 'America/New_York' });

    serviceHelpers.startConvQueueWorker(discordClient);
    log('Bot is fully operational.', 'STARTUP');

    log('Backgrounding catch-up check and initial engagement check...', 'STARTUP');
    checkForMissedPolls(discordClient).catch(err => log(`Catch-up check failed: ${err.message}`, 'STARTUP'));
    checkAndPostEngagement(discordClient).catch(err => log(`Initial engagement check failed: ${err.message}`, 'STARTUP'));
}

module.exports = { handleReady };
