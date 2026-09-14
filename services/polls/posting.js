// --- Main Scheduled Post Function ---
const { createLeaderboardEmbed } = require('../../lib/embeds');
const pool = require('../../database/connection');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { generateTriviaPoll, generateDiscussionPoll } = require('../ai/generation');
const { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS } = require('./fallbacks');
const serviceHelpers = require('../../lib/serviceHelpers');
const { generateTextWithRetries } = require('../ai/generation');
const pollResolution = require('./resolution');
const { getNYDateString, getNYWeekString } = require('../../utils/dateUtils');
const { TARGET_CHANNEL_IDS } = require('../../config');

// State management for posting lock
const postingLock = new Set(); // Prevents concurrent poll posting

async function getOrGenerateDailyPoll(dateStr) {
    const globalKey = `daily_poll_${dateStr}`;
    const existingPoll = await dbOperations.getGlobalStateValue(globalKey);
    if (existingPoll) {
        console.log(`[POLL][COORDINATOR] Found existing global poll for ${dateStr}. Skipping generation.`);
        return existingPoll;
    }

    console.log(`[POLL][COORDINATOR] No global poll found for ${dateStr}. Generating new one.`);
    // Fetch history from global
    const historyRes = await pool.query("SELECT question FROM question_history WHERE guild_id = 'global' ORDER BY created_at DESC LIMIT 50");
    const questionHistory = historyRes.rows.map(row => row.question);

    let pollResult;
    let newPollData;
    let usedFallback = false;
    
    let isDiscussion = false;
    const currentNYWeek = getNYWeekString(new Date());
    const lastDiscussionWeek = await dbOperations.getGlobalStateValue('last_discussion_poll_week');
    
    if (lastDiscussionWeek !== currentNYWeek && Math.random() < 0.20) {
        isDiscussion = true;
        await dbOperations.saveGlobalStateValue('last_discussion_poll_week', currentNYWeek);
    }

    if (isDiscussion) {
        pollResult = await generateDiscussionPoll('', questionHistory);
        if (pollResult.status !== 'success') {
            console.warn(`[POLL][COORDINATOR] Gemini and OpenRouter failed for discussion. Deploying preset fallback.`);
            serviceHelpers.metrics.fallback_served++;
            usedFallback = true;
            newPollData = { ...FALLBACK_DISCUSSION_POLLS[Math.floor(Math.random() * FALLBACK_DISCUSSION_POLLS.length)], kind: 'fallback' };
        } else {
            newPollData = pollResult.data;
            newPollData.kind = 'AI';
        }
        newPollData.type = 'discussion';
    } else {
        pollResult = await generateTriviaPoll('', questionHistory);
        if (pollResult.status !== 'success') {
            console.warn(`[POLL][COORDINATOR] Gemini and OpenRouter failed. Status: ${pollResult.status}. Deploying preset fallback.`);
            serviceHelpers.metrics.fallback_served++;
            usedFallback = true;
            newPollData = { ...FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)], kind: 'fallback' };
        } else {
            newPollData = pollResult.data;
            newPollData.kind = 'AI';
        }
        newPollData.type = 'trivia';
    }
    
    // Save to global kv_store and history
    await dbOperations.saveGlobalStateValue(globalKey, newPollData);
    if (!usedFallback) {
        await dbOperations.saveQuestionToHistory('global', newPollData.question);
    }

    return newPollData;
}

async function performDailyPost(channelId, discordClient, isCatchUp = false, sharedPollData = null) {
    if (postingLock.has(channelId)) { console.warn(`[POLL] Aborted post for channel ${channelId}, another is in progress.`); return; }
    postingLock.add(channelId);
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) { console.error(`[POLL] Channel ${channelId} not found.`); return; }
        const guildId = channel.guild.id;
        console.log(`[POLL][${guildId}][#${channel.name}] Starting daily post. Catch-up: ${isCatchUp}`);
        await dbOperations.loadStateForGuild(guildId);
        const state = stateManager.getServerState(guildId);

        const now = new Date();
        const todayDateStr = getNYDateString(now);

        // Check if we already posted today in this channel
        if (state.lastPollData && state.lastPollData.createdAt && !isNaN(new Date(state.lastPollData.createdAt))) {
            const lastPollDateStr = getNYDateString(new Date(state.lastPollData.createdAt));
            if (lastPollDateStr === todayDateStr) {
                console.log(`[POLL][${guildId}][#${channel.name}] Poll for today (${todayDateStr}) already posted. Skipping.`);
                return;
            }
        }

        await pollResolution.resolveLastPoll(channel, discordClient);

        let newPollData = sharedPollData;
        if (!newPollData) {
             newPollData = await getOrGenerateDailyPoll(todayDateStr);
        }
        
        // Deep clone to not mess up global shared references across channels
        newPollData = JSON.parse(JSON.stringify(newPollData));
        newPollData.kind = isCatchUp ? 'catch-up' : newPollData.kind;

        if (newPollData) {
            let pollIntroMessage;
            if (newPollData.type === 'discussion') {
                pollIntroMessage = isCatchUp ? "Oops, I missed the 6 AM slot! Here is today's discussion poll! 💬 (No right or wrong answer, share your thoughts!)" : "@everyone **Today's AI Discussion Poll!** 💬 (No right or wrong answer, share your thoughts!)";
            } else {
                pollIntroMessage = isCatchUp ? "Oops, I missed the 6 AM slot (likely due to downtime)! Here is today's poll!" : "@everyone **Today's AI Poll!** 🧠";
            }
            if (newPollData.kind === 'fallback') pollIntroMessage += `\n*(posted using a preset fallback because the AI service was unavailable)*`;

            const newPollMessage = await channel.send({ content: pollIntroMessage, poll: { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
            newPollData.pollMessageId = newPollMessage.id;
            newPollData.createdAt = new Date().toISOString();

            state.lastPollData = newPollData;
            await dbOperations.saveStateToDB(guildId, 'lastPollData', newPollData);

            if (newPollData.kind !== 'fallback') {
                await dbOperations.saveStateToDB(guildId, 'lastSuccessfulPoll', newPollData);
            }

            console.log(`[POLL][${guildId}][#${channel.name}] Successfully posted new poll: "${newPollData.question}"`);
        } else {
            console.error(`[POLL][${guildId}][#${channel.name}] CRITICAL FAILURE: Could not retrieve a poll.`);
        }
    } catch (error) {
        console.error(`[POLL][Channel: ${channelId}] Critical error during daily post:`, error);
    } finally { postingLock.delete(channelId); }
}

async function runCentralizedDailyPost(discordClient) {
    console.log('[POLL][COORDINATOR] Starting centralized daily post run.');
    const now = new Date();
    const todayDateStr = getNYDateString(now);
    const sharedPollData = await getOrGenerateDailyPoll(todayDateStr);

    for (const channelId of TARGET_CHANNEL_IDS) {
        await performDailyPost(channelId, discordClient, false, sharedPollData);
    }
    console.log('[POLL][COORDINATOR] Centralized daily post run complete.');
}

async function postWeeklySummary(channelId, discordClient) {
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) return;
        const guildId = channel.guild.id;
        await dbOperations.loadStateForGuild(guildId);
        const state = stateManager.getServerState(guildId);
        const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);
        if (sortedUsers.length === 0) return;

        // Fetch previous leaderboard for comparison
        let previousLeaderboard = null;
        try {
            const stored = await dbOperations.getStateValue(guildId, 'lastWeeklyLeaderboard');
            if (stored && typeof stored === 'object') previousLeaderboard = stored;
        } catch (err) { console.error(`[LEADERBOARD] Failed to fetch previous leaderboard:`, err); }

        let leaderboardString = "";
        for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
            try {
                const user = await discordClient.users.fetch(sortedUsers[i][0]);
                leaderboardString += `${i + 1}. ${user.username} - ${sortedUsers[i][1]} points\n`;
            } catch { }
        }

        let comparisonContext = "";
        if (previousLeaderboard) {
            comparisonContext = "\nPREVIOUS WEEK TOP 5:\n";
            const prevTop = Object.entries(previousLeaderboard)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);
            for (const [uid, score] of prevTop) {
                try {
                    const user = await discordClient.users.fetch(uid);
                    comparisonContext += `- ${user.username}: ${score} points\n`;
                } catch { }
            }
        }

        let milestoneContext = "";
        const milestones = state.roleMilestones;
        if (milestones && Object.keys(milestones).length > 0) {
            milestoneContext = "\nROLE MILESTONES:\n";
            Object.entries(milestones).forEach(([pts, roleId]) => {
                milestoneContext += `- ${pts} points: RoleID ${roleId}\n`;
            });
        }

        const prompt = `You are a fun and engaging Discord bot for OWGT (OneWorldGreaterTogether), an AI education org for teens. 
Write a short, human-like summary for the end-of-week AI poll leaderboard. 

DATA:
CURRENT LEADERBOARD:
${leaderboardString}
${comparisonContext}
${milestoneContext}

INSTRUCTIONS:
1. Create a fun summary of the previous week's performance.
2. Give your own witty AI comments on the competition. Compare current standings with previous week if data is provided.
3. Congratulate the winner(s) and mention top players.
4. Mention if anyone hit a new role milestone or is very close to one.
5. Identify anyone who hasn't gained any points this week (inactive) and give them a humorous/supportive "nudge" to participate again.
6. DO NOT "nudge" people just for being at the bottom of the top 10 if they were active.
7. Be casual, use some slang, but stay encouraging. 
8. Keep it concise (1-2 paragraphs).`;

        const summaryText = await generateTextWithRetries(prompt, 'gemini_summary');
        const aiComment = summaryText && summaryText.trim().length > 0
            ? summaryText.trim()
            : "AI summary unavailable this week due to a temporary service issue. Great effort from everyone, and we will be back with full AI analysis next report.";
        const description = '**AI Comment**\n' + aiComment;

        const summaryEmbed = createLeaderboardEmbed('Weekly Poll Report', description).addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' }).setFooter({ text: 'A new week of polls starts tomorrow!' });

        // Add Milestone info to embed if available
        const milestonesEmbed = state.roleMilestones;
        if (milestonesEmbed && Object.keys(milestonesEmbed).length > 0) {
            let milestoneStr = "";
            const sortedMilestones = Object.entries(milestonesEmbed).sort(([a], [b]) => Number(a) - Number(b));
            for (const [pts, roleId] of sortedMilestones) {
                milestoneStr += `- **${pts} Points**: <@&${roleId}>\n`;
            }
            summaryEmbed.addFields({ name: 'Role Milestones', value: milestoneStr });
        }

        await channel.send({ embeds: [summaryEmbed] });

        // Save current leaderboard as previous for next week
        await dbOperations.saveStateToDB(guildId, 'lastWeeklyLeaderboard', state.leaderboard);
    } catch (error) { console.error(`[LEADERBOARD][Channel: ${channelId}] Failed to post weekly summary:`, error); }
}
module.exports = {
    performDailyPost,
    postWeeklySummary,
    runCentralizedDailyPost,
    getOrGenerateDailyPoll
};


