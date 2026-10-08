// --- Poll Scheduling & Missed Poll Checks ---
const { getNYDateString, hasPostedToday } = require('../../utils/dateUtils');
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

    const todayDateStr = getNYDateString(now);
    const { getOrGenerateDailyPoll } = require('./posting');

    // Generated lazily: only once we know at least one channel actually needs it, so a restart
    // where everything is already current costs zero AI calls. If generation fails we log it and
    // post nothing this run; the next restart retries.
    let sharedPollData = null;
    let generationFailed = false;

    for (const guild of discordClient.guilds.cache.values()) {
        try {
            await dbOperations.loadStateForGuild(guild.id);
            const state = stateManager.getServerState(guild.id);
            if (!state.pollChannel) continue;
            
            const channelId = state.pollChannel;
            const channel = await discordClient.channels.fetch(channelId);
            if (!channel || !channel.guild) continue;

            // Check if we have data for TODAY (NY time)
            if (!state.lastPollData || !state.lastPollData.createdAt || isNaN(new Date(state.lastPollData.createdAt))) {
                console.log(`[STARTUP] No previous valid poll found. Catching up for ${channel.name}.`);
            } else if (!hasPostedToday(state, todayDateStr)) {
                console.log(`[STARTUP] Last poll was from ${getNYDateString(new Date(state.lastPollData.createdAt))}, but today is ${todayDateStr}. Catching up for ${channel.name}.`);
            } else {
                console.log(`[STARTUP] Poll for today (${todayDateStr}) already exists in ${channel.name}. No action needed.`);
                continue;
            }

            if (generationFailed) continue;
            if (!sharedPollData) {
                try {
                    sharedPollData = await getOrGenerateDailyPoll(todayDateStr);
                } catch (error) {
                    generationFailed = true;
                    console.error('[STARTUP] CRITICAL ERROR during catch-up generation:', error);
                    continue;
                }
            }
            await performDailyPost(channelId, discordClient, true, sharedPollData);
        } catch (error) { console.error(`[STARTUP] CRITICAL ERROR during catch-up check for channel ${channelId}:`, error); }
    }
    console.log('[STARTUP] Missed poll check complete.');
}

module.exports = { checkForMissedPolls };
