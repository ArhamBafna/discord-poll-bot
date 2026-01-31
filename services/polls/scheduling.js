// --- Poll Scheduling & Missed Poll Checks ---
const { getNYDateString } = require('../../utils/dateUtils');
const { TARGET_CHANNEL_IDS } = require('../../config');
const { performDailyPost } = require('./posting');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function checkForMissedPolls(discordClient) {
    console.log('[STARTUP] Checking for missed daily polls...');
    const now = new Date();
    const currentHourNY = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }).format(now), 10);
    // If it's before 6 AM NY time, we shouldn't have posted yet anyway.
    if (currentHourNY < 6) {
        console.log('[STARTUP] Before 6AM NY time, no catch-up needed.');
        return;
    }

    const checkPromises = TARGET_CHANNEL_IDS.map(async (channelId) => {
        try {
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !channel.guild) return;
            const guildId = channel.guild.id;
            await dbOperations.loadStateForGuild(guildId);
            const state = stateManager.getServerState(guildId);
            
            // Check if we have data for TODAY (NY time)
            if (!state.lastPollData || !state.lastPollData.createdAt || isNaN(new Date(state.lastPollData.createdAt))) {
                console.log(`[STARTUP] No previous valid poll found. Catching up for ${channel.name}.`);
                await performDailyPost(channelId, discordClient, true);
                return;
            }
            
            const lastPollDateStr = getNYDateString(new Date(state.lastPollData.createdAt));
            const todayDateStr = getNYDateString(now);

            if (lastPollDateStr !== todayDateStr) {
                console.log(`[STARTUP] Last poll was from ${lastPollDateStr}, but today is ${todayDateStr}. Catching up for ${channel.name}.`);
                await performDailyPost(channelId, discordClient, true);
            } else {
                console.log(`[STARTUP] Poll for today (${todayDateStr}) already exists in ${channel.name}. No action needed.`);
            }
        } catch (error) { console.error(`[STARTUP] CRITICAL ERROR during catch-up check for channel ${channelId}:`, error); }
    });
    await Promise.all(checkPromises);
    console.log('[STARTUP] Missed poll check complete.');
}

module.exports = { checkForMissedPolls };
