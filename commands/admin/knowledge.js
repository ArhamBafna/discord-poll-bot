const { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } = require('discord.js');
const stateManager = require('../../state/manager');

async function handleKnowledge(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);

    if (subCommand === 'update') {
        const topic = interaction.options.getString('topic').toLowerCase().trim().replace(/\s+/g, '-');
        const rawKnowledge = state.knowledgeBase[topic];
        const currentKnowledge = (rawKnowledge || '').slice(0, 3999);

        const modal = new ModalBuilder()
            .setCustomId(`knowledgeBaseModal:${topic}`)
            .setTitle(`Update: ${topic}`);
        const knowledgeInput = new TextInputBuilder()
            .setCustomId('knowledgeInput')
            .setLabel(`Knowledge for "${topic}":`)
            .setStyle(TextInputStyle.Paragraph)
            .setValue(currentKnowledge)
            .setPlaceholder('Enter the information for this topic...')
            .setRequired(true);
        const actionRow = new ActionRowBuilder().addComponents(knowledgeInput);
        modal.addComponents(actionRow);
        await interaction.showModal(modal);
    } 
    else if (subCommand === 'list') {
        const topics = Object.keys(state.knowledgeBase);
        if (topics.length === 0) {
            return interaction.reply({ content: "The knowledge base is currently empty." });
        }

        let response = "**Current Knowledge Base Topics:**\n";
        topics.forEach(t => {
            const length = state.knowledgeBase[t].length;
            response += `- **${t}**: ${length} characters\n`;
        });
        response += "\n*Use `/knowledge update topic:<name>` to edit or add.*";
        await interaction.reply({ content: response });
    } 
    else if (subCommand === 'delete') {
        const topic = interaction.options.getString('topic').toLowerCase().trim();
        if (!state.knowledgeBase[topic]) {
            return interaction.reply({ content: `Topic **${topic}** not found.` });
        }

        try {
            const dbOperations = require('../../database/operations');
            const pool = require('../../database/connection');
            await pool.query('DELETE FROM knowledge_base WHERE guild_id = $1 AND key = $2', [guildId, topic]);
            delete state.knowledgeBase[topic];
            await interaction.reply({ content: `Successfully deleted topic: **${topic}**` });
        } catch (error) {
            console.error(`[KNOWLEDGE] Failed to delete topic ${topic}:`, error);
            await interaction.reply({ content: "A database error occurred." });
        }
    }
}

module.exports = { handleKnowledge };
