// --- /update-knowledge Command Handler ---
const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const stateManager = require('../../state/manager');

async function handleUpdateKnowledge(interaction) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    
    // FIX: Ensure text is safe and valid (not null/undefined, and under 4000 chars)
    const rawKnowledge = state.knowledgeBase['main-info'];
    // If undefined, use placeholder. Slice to safeguard against DB overflowing Discord limit.
    const currentKnowledge = (rawKnowledge || 'Enter your organization\'s information here.').slice(0, 3999);

    const modal = new ModalBuilder()
        .setCustomId('knowledgeBaseModal')
        .setTitle('Update Knowledge Base');
    const knowledgeInput = new TextInputBuilder()
        .setCustomId('knowledgeInput')
        .setLabel("What the bot should know about the org:")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(currentKnowledge) // Safe value
        .setPlaceholder('- Our mission is to...\n- We were founded in...')
        .setRequired(true);
    const actionRow = new ActionRowBuilder().addComponents(knowledgeInput);
    modal.addComponents(actionRow);
    await interaction.showModal(modal);
}

module.exports = { handleUpdateKnowledge };
