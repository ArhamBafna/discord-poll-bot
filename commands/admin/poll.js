const { EmbedBuilder } = require('discord.js');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { generateTriviaPoll, generateTextWithRetries } = require('../../services/ai/generation');
const { createSuccessEmbed, replySuccess, replyError } = require('../../lib/embeds');
const { resolveLastPoll } = require('../../services/polls/resolution');

function normalizeResolveMode(rawMode) {
    return rawMode || null;
}

async function resolveOnDemand(interaction, state, guildId) {
    if (!state.activeOnDemandPoll) {
        return interaction.reply({ content: 'There is no active on-demand poll to resolve.', ephemeral: true });
    }

    const pollData = state.activeOnDemandPoll;
    const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);

    const answerEmbed = createSuccessEmbed('Answer & Explanation', `**Q: ${pollData.question}**`)
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

async function handleAsk(interaction, state, guildId) {
    if (state.activeOnDemandPoll) return interaction.reply({ content: "There's already an active on-demand poll. Use `/poll resolve poll:on-demand` to end it.", ephemeral: true });
    const topic = interaction.options.getString('topic') || '';
    await interaction.reply(`On-demand trivia poll requested for topic "${topic || 'Any AI topic'}". Generating...`);
    const pollResult = await generateTriviaPoll(topic, []);
    if (pollResult.status === 'success') {
        const pollMessage = await interaction.channel.send({ content: `**Special On-Demand Poll!**`, poll: { question: { text: pollResult.data.question }, answers: pollResult.data.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
        state.activeOnDemandPoll = { ...pollResult.data, messageId: pollMessage.id };
        await dbOperations.saveStateToDB(guildId, 'activeOnDemandPoll', state.activeOnDemandPoll);
        await interaction.editReply('Poll generated successfully!');
    } else {
        await interaction.editReply("i'm overloaded - please try again in a few minutes.");
    }
}

async function handleResolve(interaction, state, guildId, discordClient) {
    const mode = normalizeResolveMode(interaction.options.getString('poll'));
    if (mode === 'on-demand') return resolveOnDemand(interaction, state, guildId);
    if (mode === 'daily') return resolveDaily(interaction, state, guildId, discordClient);
    return interaction.reply({ content: 'Invalid resolve poll type. Use on-demand or daily.', ephemeral: true });
}

async function handleRelink(interaction, state, guildId) {
    await interaction.deferReply({ ephemeral: true });
    const messageId = interaction.options.getString('message_id');
    const correctOptionNumber = interaction.options.getInteger('correct_option');
    const correctAnswerIndex = correctOptionNumber - 1;

    try {
        const pollMessage = await interaction.channel.messages.fetch(messageId);
        if (!pollMessage.poll || correctAnswerIndex >= pollMessage.poll.answers.length) return replyError(interaction, "Error", "Invalid message ID or option number.");

        const question = pollMessage.poll.question.text;
        const options = pollMessage.poll.answers.map(a => a.text);
        const correctAnswerText = options[correctAnswerIndex];

        const explanationPrompt = `The trivia question is: "${question}". The correct answer is "${correctAnswerText}". Please provide a concise, engaging explanation for why this is the correct answer.`;
        const explanation = await generateTextWithRetries(explanationPrompt, 'gemini_relink');

        if (!explanation) return replyError(interaction, "Error", "Sorry, the AI is overloaded. The relink has been aborted.");
        const newPollData = { question, options, correctAnswerIndex, explanation, type: 'trivia', pollMessageId: pollMessage.id, createdAt: pollMessage.createdAt.toISOString() };
        state.lastPollData = newPollData;
        await dbOperations.saveStateToDB(guildId, 'lastPollData', newPollData);
        await replySuccess(interaction, '✅ Poll Relink Successful', `Relinked to poll: *${question}*`, "Use /poll resolve to process this poll.");
    } catch (fetchError) { return replyError(interaction, "Error", "I couldn't find a message with that ID in this channel."); }
}

async function handlePoll(interaction, discordClient) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'ask': return handleAsk(interaction, state, guildId);
        case 'resolve': return handleResolve(interaction, state, guildId, discordClient);
        case 'relink': return handleRelink(interaction, state, guildId);
        default: return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
    }
}

module.exports = { handlePoll };
