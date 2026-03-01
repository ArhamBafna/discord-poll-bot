const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleSetWelcome(interaction) {
    const guildId = interaction.guild.id;
    const template = interaction.options.getString('template');
    const state = stateManager.getServerState(guildId);

    try {
        await dbOperations.saveStateToDB(guildId, 'welcomeTemplate', template);
        state.welcomeTemplate = template;
        await interaction.reply(`Success! The welcome message template has been updated.\n\n**Preview:**\n${template.replace('{user}', interaction.user).replace('{inviter}', 'someone').replace('{cc}', 'someone').replace('{points_msg}', 'i added a point to someone\'s score!')}`);
    } catch (error) {
        console.error('[SETWELCOME] Error setting welcome template:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleSetWelcome };
