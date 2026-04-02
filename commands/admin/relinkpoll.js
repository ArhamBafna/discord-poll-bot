// --- /relinkpoll Command Handler ---
const { EmbedBuilder } = require('discord.js');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { generateTextWithRetries } = require('../../services/ai/generation');

async function handleRelinkpoll(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    const messageId = interaction.options.getString('message_id');
    const correctOptionNumber = interaction.options.getInteger('correct_option');
    const correctAnswerIndex = correctOptionNumber - 1;

    try {
        const pollMessage = await interaction.channel.messages.fetch(messageId);
        if (!pollMessage.poll || correctAnswerIndex >= pollMessage.poll.answers.length) return interaction.editReply("Invalid message ID or option number.");

        const question = pollMessage.poll.question.text;
        const options = pollMessage.poll.answers.map(a => a.text);
        const correctAnswerText = options[correctAnswerIndex];

        const explanationPrompt = `The trivia question is: "${question}". The correct answer is "${correctAnswerText}". Please provide a concise, engaging explanation for why this is the correct answer.`;
        const explanation = await generateTextWithRetries(explanationPrompt, 'gemini_relink');

        if (!explanation) return interaction.editReply("Sorry, the AI is overloaded. The relink has been aborted.");
        const newPollData = { question, options, correctAnswerIndex, explanation, type: 'trivia', pollMessageId: pollMessage.id, createdAt: pollMessage.createdAt.toISOString() };
        state.lastPollData = newPollData;
        await dbOperations.saveStateToDB(guildId, 'lastPollData', newPollData);
        await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#2ECC71').setTitle('✅ Poll Relink Successful').setDescription(`Relinked to poll: *${question}*`).setFooter({ text: "Use /resolve to process this poll." })] });
    } catch (fetchError) { return interaction.editReply("I couldn't find a message with that ID in this channel."); }
}

module.exports = { handleRelinkpoll };
