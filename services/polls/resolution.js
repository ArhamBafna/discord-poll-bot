// --- Poll Resolution Function ---
const { createAnswerEmbed } = require('../../lib/embeds');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { checkAndAssignMilestoneRole } = require('../roles/milestones');

async function resolveLastPoll(channel, discordClient) {
    if (!channel || !channel.guild) { console.error(`[RESOLVE] Invalid channel provided.`); return false; }
    const guildId = channel.guild.id;
    if (!stateManager.serverStateCache[guildId]) await dbOperations.loadStateForGuild(guildId);
    const state = stateManager.getServerState(guildId);

    if (state.lastPollData && state.lastPollData.type === 'discussion' && state.lastPollData.pollMessageId) {
        console.log(`[RESOLVE][${guildId}][#${channel.name}] Resolving discussion poll.`);
        try {
            const answerEmbed = createAnswerEmbed(`Yesterday's Poll Wrap-Up`, `Yesterday's poll was an open discussion, so there are no points or correct answer to reveal. Thanks for sharing your thoughts!`);
            await channel.send({ embeds: [answerEmbed] });
            return true;
        } catch (error) {
            console.error(`[RESOLVE][${guildId}][#${channel.name}] FAILED to resolve discussion poll.`);
            return false;
        }
    } else if (state.lastPollData && (state.lastPollData.type === 'trivia' || !state.lastPollData.type) && state.lastPollData.pollMessageId) {
        const pollId = state.lastPollData.pollMessageId;
        console.log(`[RESOLVE][${guildId}][#${channel.name}] Resolving trivia poll (ID: ${pollId}).`);
        try {
            const pollMessage = await channel.messages.fetch(pollId);
            if (!pollMessage.poll) return false;
            const correctAnswer = pollMessage.poll.answers.at(state.lastPollData.correctAnswerIndex);
            if (!correctAnswer) return false;
            
            const voters = await correctAnswer.voters.fetch();
            const validVoters = Array.from(voters.values()).filter(u => !u.bot);
            const winnerIds = validVoters.map(u => u.id);
            const winnerUsernames = validVoters.map(u => u.username);

            let milestoneAnnouncements = [];

            if (winnerIds.length > 0) {
                await dbOperations.batchUpdateScoresInDB(guildId, winnerIds);
                
                // User lookups are batched rather than one-by-one
                const guildMembers = await channel.guild.members.fetch({ user: winnerIds });
                
                // Winner resolution runs in a single pass; no duplicate scans or double sorts
                for (const userId of winnerIds) {
                    const newScore = (state.leaderboard[userId] || 0) + 1;
                    state.leaderboard[userId] = newScore;
                    
                    const member = guildMembers.get(userId);
                    if (member) {
                        const announcement = await checkAndAssignMilestoneRole(member, newScore);
                        if (announcement) milestoneAnnouncements.push(announcement);
                    }
                }
            }

            const correctOptionLetter = String.fromCharCode(65 + state.lastPollData.correctAnswerIndex);
            let description = `The correct answer to **"${state.lastPollData.question}"** was **${correctOptionLetter}: ${state.lastPollData.options[state.lastPollData.correctAnswerIndex]}**.\n\n${state.lastPollData.explanation}`;
            
            // A long explanation never breaks the answer embed; it is truncated safely.
            if (description.length > 4096) {
                description = description.substring(0, 4093) + '...';
            }

            const answerEmbed = createAnswerEmbed(`Yesterday's Poll Answer`, description)
                .addFields({ name: 'Leaderboard Update', value: `**${winnerUsernames.length}** member(s) answered correctly and have been awarded a point!` });
                
            await channel.send({ embeds: [answerEmbed] });
            
            if (milestoneAnnouncements.length > 0) {
                // The milestone announcement is built by one shared helper
                await channel.send(milestoneAnnouncements.join('\n'));
            }
            
            return true;
        } catch (error) {
            let errorMessage = `[RESOLVE][${guildId}][#${channel.name}] FAILED: Could not process previous poll (ID: ${pollId}).`;
            if (error.code === 10008) errorMessage += ` REASON: Message was deleted. Use /relinkpoll.`;
            else if (error.code === 50013 || error.code === 50001) errorMessage += ` REASON: Missing Permissions.`;
            else errorMessage += ` REASON: Unexpected error.`;
            console.error(errorMessage, error.code !== 10008 ? error : '');
            return false;
        }
    } else {
        console.log(`[RESOLVE][${guildId}][#${channel.name}] No previous trivia poll to resolve.`);
        return true;
    }
}

module.exports = { resolveLastPoll };
