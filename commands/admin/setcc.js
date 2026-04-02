const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleSetCC(interaction) {
    const guildId = interaction.guild.id;
    const targetUser = interaction.options.getUser('user');
    const state = stateManager.getServerState(guildId);

    try {
        await dbOperations.saveStateToDB(guildId, 'ccUser', targetUser.id);
        state.ccUser = targetUser.id;
        await interaction.reply(`Success! **${targetUser.username}** will now be CC'd in welcome messages.`);
    } catch (error) {
        console.error('[SETCC] Error setting CC user:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleSetCC };
