const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleSetCC(interaction) {
    const guildId = interaction.guild.id;
    const targetUser = interaction.options.getUser('user');
    const state = stateManager.getServerState(guildId);

    try {
        const success = await dbOperations.updateAndPersist(guildId, 'ccUser', targetUser.id);
        if (!success) throw new Error('DB Error');
        await interaction.reply(`Success! **${targetUser.username}** will now be CC'd in welcome messages.`);
    } catch (error) {
        console.error('[SETCC] Error setting CC user:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleSetCC };
