// --- Poll Resolution Function ---
const { EmbedBuilder } = require('discord.js');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function resolveLastPoll(channel, discordClient) {
    if (!channel || !channel.guild) { console.error(`[RESOLVE] Invalid channel provided.`); return false; }
    const guildId = channel.guild.id;
    if (!stateManager.serverStateCache[guildId]) await dbOperations.loadStateForGuild(guildId);
    const state = stateManager.getServerState(guildId);

    if (state.lastPollData && state.lastPollData.type === 'trivia' && state.lastPollData.pollMessageId) {
        const pollId = state.lastPollData.pollMessageId;
        console.log(`[RESOLVE][${guildId}][#${channel.name}] Resolving trivia poll (ID: ${pollId}).`);
        try {
            const pollMessage = await channel.messages.fetch(pollId);
            if (!pollMessage.poll) return false;
            const correctAnswer = pollMessage.poll.answers.at(state.lastPollData.correctAnswerIndex);
            if (!correctAnswer) return false;
            // FIX: fetchVoters is deprecated in newer discord.js versions
            const voters = await correctAnswer.voters.fetch();
            const winnerIds = Array.from(voters.values()).filter(u => !u.bot).map(u => u.id);
            const winnerUsernames = Array.from(voters.values()).filter(u => !u.bot).map(u => u.username);

            if (winnerIds.length > 0) {
                await dbOperations.batchUpdateScoresInDB(guildId, winnerIds);
                winnerIds.forEach(userId => { state.leaderboard[userId] = (state.leaderboard[userId] || 0) + 1; });
            }

            const correctOptionLetter = String.fromCharCode(65 + state.lastPollData.correctAnswerIndex);
            const answerEmbed = new EmbedBuilder().setColor('#5865F2').setTitle(`Yesterday's Poll Answer 🧐`).setDescription(`The correct answer to **"${state.lastPollData.question}"** was **${correctOptionLetter}: ${state.lastPollData.options[state.lastPollData.correctAnswerIndex]}**.\n\n${state.lastPollData.explanation}`).addFields({ name: 'Leaderboard Update', value: `**${winnerUsernames.length}** member(s) answered correctly and have been awarded a point!` });
            await channel.send({ embeds: [answerEmbed] });
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
