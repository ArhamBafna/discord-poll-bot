// --- /resolve Command Handler ---
const { EmbedBuilder } = require('discord.js');
const { resolveLastPoll } = require('../../services/polls/resolution');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

function normalizeResolveMode(rawMode) {
    if (!rawMode) return null;
    return rawMode;
}

async function resolveOnDemand(interaction, state, guildId) {
    if (!state.activeOnDemandPoll) {
        return interaction.reply({ content: 'There is no active on-demand poll to resolve.', ephemeral: true });
    }

    const pollData = state.activeOnDemandPoll;
    const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);

    const answerEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('Answer & Explanation')
        .setDescription(`**Q: ${pollData.question}**`)
        .addFields(
            { name: 'Correct Answer', value: `**${correctOptionLetter}: ${pollData.options[pollData.correctAnswerIndex]}**` },
            { name: 'Explanation', value: pollData.explanation }
        )
        .setFooter({ text: 'On-demand polls do not award points.' });

    await interaction.reply({ embeds: [answerEmbed] });
    state.activeOnDemandPoll = null;
    await dbOperations.deleteStateFromDB(guildId, 'activeOnDemandPoll');
}

async function resolveDaily(interaction, state, guildId, discordClient) {
    if (!state.lastPollData) {
        return interaction.reply({ content: 'There is no poll in memory to resolve.', ephemeral: true });
    }

    await interaction.reply('Manually resolving the last known poll...');

    if (await resolveLastPoll(interaction.channel, discordClient)) {
        state.lastPollData = null;
        await dbOperations.deleteStateFromDB(guildId, 'lastPollData');
        await interaction.followUp('Last poll has been resolved and cleared from memory.');
    } else {
        await interaction.followUp('Something went wrong during resolution. Check logs.');
    }
}

async function handleResolve(interaction, discordClient) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    const mode = normalizeResolveMode(interaction.options.getString('poll'));

    if (mode === 'on-demand') {
        return resolveOnDemand(interaction, state, guildId);
    }

    if (mode === 'daily') {
        return resolveDaily(interaction, state, guildId, discordClient);
    }

    return interaction.reply({ content: 'Invalid resolve poll type. Use on-demand or daily.', ephemeral: true });
}

module.exports = { handleResolve };
