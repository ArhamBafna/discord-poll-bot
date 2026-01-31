// --- /reveal Command Handler ---
const { EmbedBuilder } = require('discord.js');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleReveal(interaction) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    
    if (!state.activeOnDemandPoll) return interaction.reply({ content: "There is no active on-demand poll to reveal.", ephemeral: true });
    const pollData = state.activeOnDemandPoll;
    const correctOptionLetter = String.fromCharCode(65 + pollData.correctAnswerIndex);
    const answerEmbed = new EmbedBuilder().setColor('#2ECC71').setTitle('Answer & Explanation 🧐').setDescription(`**Q: ${pollData.question}**`).addFields({ name: 'Correct Answer', value: `**${correctOptionLetter}: ${pollData.options[pollData.correctAnswerIndex]}**` }, { name: 'Explanation', value: pollData.explanation }).setFooter({ text: 'On-demand polls do not award points.' });
    await interaction.reply({ embeds: [answerEmbed] });
    state.activeOnDemandPoll = null;
    await dbOperations.deleteStateFromDB(guildId, 'activeOnDemandPoll');
}

module.exports = { handleReveal };
