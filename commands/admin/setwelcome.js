const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { renderWelcomeTemplate } = require('../../lib/serviceHelpers');

async function handleSetWelcome(interaction) {
    const guildId = interaction.guild.id;
    const template = interaction.options.getString('template');
    const state = stateManager.getServerState(guildId);

    try {
        const success = await dbOperations.updateAndPersist(guildId, 'welcomeTemplate', template);
        if (!success) throw new Error('DB Error');
        const preview = renderWelcomeTemplate(template, interaction.user, 'someone', 'someone', 'i added a point to someone\\'s score!');
        await interaction.reply(`Success! The welcome message template has been updated.\n\n**Preview:**\n${preview}`);
    } catch (error) {
        console.error('[SETWELCOME] Error setting welcome template:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleSetWelcome };
