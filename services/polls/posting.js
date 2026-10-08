// --- Main Scheduled Post Function ---
const { createLeaderboardEmbed } = require('../../lib/embeds');
const pool = require('../../database/connection');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { GLOBAL_GUILD_ID, QUESTION_HISTORY_LIMIT } = dbOperations;
const { generateTriviaPoll, generateDiscussionPoll } = require('../ai/generation');
const { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS } = require('./fallbacks');
const serviceHelpers = require('../../lib/serviceHelpers');
const { generateTextWithRetries } = require('../ai/generation');
const pollResolution = require('./resolution');
const { getNYDateString, getNYWeekString, hasPostedToday } = require('../../utils/dateUtils');
const { applyPollMention, resolvePollMention } = require('../../lib/mentions');

// State management for posting lock
const postingLock = new Set(); // Prevents concurrent poll posting

// Single-flight map keyed by date: only one daily poll is ever built at a time, so the
// 6 AM alarm, restart catch-up, and a manual command racing each other share one result
// instead of paying for (and posting) different questions. In-process only, which is
// enough because exactly one bot copy runs. Multi-process would need a DB advisory lock.
const inFlightPolls = new Map();

async function getOrGenerateDailyPoll(dateStr) {
    if (inFlightPolls.has(dateStr)) {
        console.log(`[POLL][COORDINATOR] Generation for ${dateStr} already in progress. Waiting on it.`);
        return inFlightPolls.get(dateStr);
    }

    const generation = (async () => {
        const globalKey = `daily_poll_${dateStr}`;
        const existingPoll = await dbOperations.getGlobalStateValue(globalKey);
        if (existingPoll) {
            console.log(`[POLL][COORDINATOR] Found existing global poll for ${dateStr}. Skipping generation.`);
            return existingPoll;
        }

        console.log(`[POLL][COORDINATOR] No global poll found for ${dateStr}. Generating new one.`);
        // Question history is intentionally GLOBAL-ONLY since daily polls are shared across
        // every server. Per-guild question_history rows are left in place but never read.
        // Consequence: the global list starts empty, so a question recently asked in one server
        // can reappear there until the shared list fills up. This is an accepted trade-off of
        // centralization -- do not re-add per-guild reads without revisiting the shared-question
        // decision (see issues #25 and #26).
        const historyRes = await pool.query(
            `SELECT question FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT $2`,
            [GLOBAL_GUILD_ID, QUESTION_HISTORY_LIMIT]
        );
        const questionHistory = historyRes.rows.map(row => row.question);

        let pollResult;
        let newPollData;

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
                newPollData = { ...FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)], kind: 'fallback' };
            } else {
                newPollData = pollResult.data;
                newPollData.kind = 'AI';
            }
            newPollData.type = 'trivia';
        }

        // Save to global kv_store and history. Fallback questions go into history too, so the
        // AI keeps avoiding preset questions we already showed. Only the question text is stored.
        await dbOperations.saveGlobalStateValue(globalKey, newPollData);
        await dbOperations.saveQuestionToHistory(GLOBAL_GUILD_ID, newPollData.question);

        return newPollData;
    })();

    inFlightPolls.set(dateStr, generation);
    try {
        return await generation;
    } finally {
        // Clears on failure too, so the next caller retries from scratch.
        inFlightPolls.delete(dateStr);
    }
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

        // RULE: one daily poll per SERVER (guild), not per channel. lastPollData is guild-scoped,
        // so we store at most one pollChannel per guild. If multiple channels were supported,
        // the first to post would win and the rest would be skipped that day.
        // skipped that day.
        if (hasPostedToday(state, todayDateStr)) {
            console.log(`[POLL][${guildId}][#${channel.name}] Server already posted today (${todayDateStr}). Skipping channel.`);
            return;
        }

        await pollResolution.resolveLastPoll(channel, discordClient);

        let newPollData = sharedPollData;
        if (!newPollData) {
             newPollData = await getOrGenerateDailyPoll(todayDateStr);
        }

        // getOrGenerateDailyPoll either returns an object or throws, so a miss here means the
        // shared data was corrupted. Fail loudly and let the per-channel catch log it.
        if (!newPollData) {
            throw new Error('CRITICAL FAILURE: Could not retrieve a poll.');
        }

        // Deep clone to not mess up global shared references across channels
        newPollData = JSON.parse(JSON.stringify(newPollData));
        if (isCatchUp && newPollData.kind !== 'fallback') {
            newPollData.kind = 'catch-up';
        }

        const pollIntroMessage = getPollIntroMessage(newPollData, isCatchUp, resolvePollMention(state, channel));

        const newPollMessage = await channel.send({ content: pollIntroMessage, poll: { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
        newPollData.pollMessageId = newPollMessage.id;
        newPollData.createdAt = new Date().toISOString();

        state.lastPollData = newPollData;
        await dbOperations.saveStateToDB(guildId, 'lastPollData', newPollData);

        if (newPollData.kind !== 'fallback') {
            await dbOperations.saveStateToDB(guildId, 'lastSuccessfulPoll', newPollData);
        }

        console.log(`[POLL][${guildId}][#${channel.name}] Successfully posted new poll: "${newPollData.question}"`);
    } catch (error) {
        console.error(`[POLL][Channel: ${channelId}] Critical error during daily post:`, error);
    } finally { postingLock.delete(channelId); }
}

async function runCentralizedDailyPost(discordClient) {
    console.log('[POLL][COORDINATOR] Starting centralized daily post run.');
    try {
        const now = new Date();
        const todayDateStr = getNYDateString(now);
        const sharedPollData = await getOrGenerateDailyPoll(todayDateStr);

        for (const guild of discordClient.guilds.cache.values()) {
            await dbOperations.loadStateForGuild(guild.id);
            const state = stateManager.getServerState(guild.id);
            if (state.pollChannel) {
                await performDailyPost(state.pollChannel, discordClient, false, sharedPollData);
            } else {
                console.warn(`[POLL][${guild.id}] No pollChannel configured for guild "${guild.name}". Skipping daily post. Run /setpollchannel to configure.`);
            }
        }
        console.log('[POLL][COORDINATOR] Centralized daily post run complete.');
    } catch (error) {
        // Skip-the-day: no retry here. The next restart catch-up is the recovery path.
        console.error('[POLL][COORDINATOR] Centralized daily post run failed:', error);
    }
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
8. Keep it short and mobile-readable: a tight list of brief bullet-point highlights, not paragraphs. Prioritize the most interesting highlights instead of commenting on every instruction above.`;

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

        // The summary is an embed with no message body, so it has nowhere to carry a ping
        // until one is configured. Only add a text line when there is actually a mention.
        const summaryMention = resolvePollMention(state, channel);
        const summaryPayload = { embeds: [summaryEmbed] };
        if (summaryMention) summaryPayload.content = applyPollMention('**Weekly Leaderboard 🏆**', summaryMention);
        await channel.send(summaryPayload);

        // Save current leaderboard as previous for next week
        await dbOperations.saveStateToDB(guildId, 'lastWeeklyLeaderboard', state.leaderboard);
    } catch (error) { console.error(`[LEADERBOARD][Channel: ${channelId}] Failed to post weekly summary:`, error); }
}
// The `kind` argument is only consulted when a bare poll type string is passed instead of a
// poll object, which no caller does; `mention` sits ahead of it so callers do not have to
// pass a placeholder.
function getPollIntroMessage(pollDataOrType, isCatchUp = false, mention = '', kind = null) {
    const type = typeof pollDataOrType === 'object' && pollDataOrType ? pollDataOrType.type : pollDataOrType;
    const pollKind = typeof pollDataOrType === 'object' && pollDataOrType ? pollDataOrType.kind : kind;

    let message;
    if (type === 'discussion') {
        message = isCatchUp
            ? "**Today's AI Discussion Poll!** 💬 (No right or wrong answer, share your thoughts! Also it's a late post cuz I missed the set time.)"
            : "**Today's AI Discussion Poll!** 💬 (No right or wrong answer, share your thoughts!)";
    } else {
        message = isCatchUp
            ? "**Today's AI Poll!** 🧠 (It's a late post cuz I missed the set time.)"
            : "**Today's AI Poll!** 🧠";
    }

    if (pollKind === 'fallback') {
        message += `\n*(posted using a preset fallback because the AI service was unavailable)*`;
    }

    return applyPollMention(message, mention);
}

module.exports = {
    performDailyPost,
    postWeeklySummary,
    runCentralizedDailyPost,
    getOrGenerateDailyPoll,
    getPollIntroMessage
};


