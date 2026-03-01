// --- Main Scheduled Post Function ---
const { EmbedBuilder } = require('discord.js');
const pool = require('../../database/connection');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { generateTriviaPoll } = require('../ai/generation');
const { FALLBACK_POLLS } = require('./fallbacks');
const serviceHelpers = require('../../lib/serviceHelpers');
const { generateTextWithRetries } = require('../ai/generation');
const pollResolution = require('./resolution');

// State management for posting lock
const postingLock = new Set(); // Prevents concurrent poll posting

async function performDailyPost(channelId, discordClient, isCatchUp = false) {
    if (postingLock.has(channelId)) { console.warn(`[POLL] Aborted post for channel ${channelId}, another is in progress.`); return; }
    postingLock.add(channelId);
    try {
        const channel = await discordClient.channels.fetch(channelId);
        if (!channel || !channel.guild) { console.error(`[POLL] Channel ${channelId} not found.`); return; }
        const guildId = channel.guild.id;
        console.log(`[POLL][${guildId}][#${channel.name}] Starting daily post. Catch-up: ${isCatchUp}`);
        await dbOperations.loadStateForGuild(guildId);
        const state = stateManager.getServerState(guildId);

        await pollResolution.resolveLastPoll(channel, discordClient);

        // Fetch history to prevent any repetition.
        const historyRes = await pool.query('SELECT question FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50', [guildId]);
        const questionHistory = historyRes.rows.map(row => row.question);

        let pollResult = await generateTriviaPoll('', questionHistory);
        let newPollData;
        let usedFallback = false;

        if (pollResult.status !== 'success') {
            console.warn(`[POLL][FALLBACK] Gemini API failed. Status: ${pollResult.status}. Deploying a fallback poll.`);
            serviceHelpers.metrics.fallback_served++;
            usedFallback = true;
            const lastPoll = state.lastSuccessfulPoll;
            if (lastPoll && lastPoll.type === 'trivia') {
                newPollData = { ...lastPoll, isFallback: true };
            } else {
                newPollData = { ...FALLBACK_POLLS[Math.floor(Math.random() * FALLBACK_POLLS.length)], isFallback: true };
            }
        } else {
            newPollData = pollResult.data;
        }

        if (newPollData) {
            newPollData.type = 'trivia'; // All polls are now trivia
            let pollIntroMessage = isCatchUp ? "Oops, I missed the 6 AM slot (likely due to downtime)! Here is today's poll! 😅" : "@everyone **Today's AI Poll!** 🧠";
            if (usedFallback) pollIntroMessage += `\n*(posted using fallback because the AI service was unavailable)*`;

            const newPollMessage = await channel.send({ content: pollIntroMessage, poll: { question: { text: newPollData.question }, answers: newPollData.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
            newPollData.pollMessageId = newPollMessage.id;
            newPollData.createdAt = new Date().toISOString();

            state.lastPollData = newPollData;
            await dbOperations.saveStateToDB(guildId, 'lastPollData', newPollData);

            if (!usedFallback) { // Only save real polls as "last successful" and to history
                await dbOperations.saveStateToDB(guildId, 'lastSuccessfulPoll', newPollData);
                await dbOperations.saveQuestionToHistory(guildId, newPollData.question);
            }

            console.log(`[POLL][${guildId}][#${channel.name}] Successfully posted new poll: "${newPollData.question}"`);
        } else {
            console.error(`[POLL][${guildId}][#${channel.name}] CRITICAL FAILURE: Could not generate a poll from Gemini or use a fallback.`);
        }
    } catch (error) {
        console.error(`[POLL][Channel: ${channelId}] Critical error during daily post:`, error);
    } finally { postingLock.delete(channelId); }
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
            const lastSummaryRes = await dbOperations.pool.query(
                `SELECT value FROM state WHERE guild_id = $1 AND key = 'lastWeeklyLeaderboard'`,
                [guildId]
            );
            if (lastSummaryRes.rows.length > 0) {
                previousLeaderboard = lastSummaryRes.rows[0].value;
            }
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
        const description = summaryText || "Here's a look at this week's top contenders! Great job, everyone.";

        const summaryEmbed = new EmbedBuilder().setColor('#FFD700').setTitle('🏆 Weekly Poll Report 🏆').setDescription(description).addFields({ name: 'Top 10 This Week', value: leaderboardString || 'No participants this week.' }).setFooter({ text: 'A new week of polls starts tomorrow!' });

        // Add Milestone info to embed if available
        const milestonesEmbed = state.roleMilestones;
        if (milestonesEmbed && Object.keys(milestonesEmbed).length > 0) {
            let milestoneStr = "";
            const sortedMilestones = Object.entries(milestonesEmbed).sort(([a], [b]) => Number(a) - Number(b));
            for (const [pts, roleId] of sortedMilestones) {
                milestoneStr += `- **${pts} Points**: <@&${roleId}>\n`;
            }
            summaryEmbed.addFields({ name: '✨ Role Milestones', value: milestoneStr });
        }

        await channel.send({ embeds: [summaryEmbed] });

        // Save current leaderboard as previous for next week
        await dbOperations.saveStateToDB(guildId, 'lastWeeklyLeaderboard', state.leaderboard);
    } catch (error) { console.error(`[LEADERBOARD][Channel: ${channelId}] Failed to post weekly summary:`, error); }
}

module.exports = {
    performDailyPost,
    postWeeklySummary
};
