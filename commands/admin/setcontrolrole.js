const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleSetControlRole(interaction) {
    const guildId = interaction.guild.id;
    const targetRole = interaction.options.getRole('role');
    const state = stateManager.getServerState(guildId);

    try {
        await dbOperations.saveStateToDB(guildId, 'controlRole', targetRole.id);
        state.controlRole = targetRole.id;
        await interaction.reply(`Success! Members with the **${targetRole.name}** role can now run administrative commands.`);
    } catch (error) {
        console.error('[SETCONTROLROLE] Error setting control role:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleSetControlRole };
