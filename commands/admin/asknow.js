// --- /asknow Command Handler ---
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { generateTriviaPoll } = require('../../services/ai/generation');

async function handleAsknow(interaction, discordClient) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    
    if (state.activeOnDemandPoll) return interaction.reply({ content: "There's already an active on-demand poll. Use `/reveal` to end it.", ephemeral: true });
    const topic = interaction.options.getString('topic') || '';
    await interaction.reply(`On-demand trivia poll requested for topic "${topic || 'Any AI topic'}". Generating...`);
    const pollResult = await generateTriviaPoll(topic, []);
    if (pollResult.status === 'success') {
        const pollMessage = await interaction.channel.send({ content: `**Special On-Demand Poll!** ✨`, poll: { question: { text: pollResult.data.question }, answers: pollResult.data.options.map(o => ({ text: o })), duration: 24, allowMultiselect: false } });
        state.activeOnDemandPoll = { ...pollResult.data, messageId: pollMessage.id };
        await dbOperations.saveStateToDB(guildId, 'activeOnDemandPoll', state.activeOnDemandPoll);
        await interaction.editReply("Poll generated successfully!");
    } else { await interaction.editReply("i'm overloaded — please try again in a few minutes."); }
}

module.exports = { handleAsknow };
