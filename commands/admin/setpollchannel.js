const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleSetpollchannel(interaction) {
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    try {
        const success = await dbOperations.updateAndPersist(guildId, 'pollChannel', channel.id);
        if (!success) throw new Error('DB Error');
        await interaction.reply(`Success! The poll channel has been set to <#${channel.id}>. Daily polls and summaries will now be posted there.`);
    } catch (error) {
        console.error('[SET_POLL_CHANNEL] Error:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleSetpollchannel };
