const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleSetInvitePoints(interaction) {
    const guildId = interaction.guild.id;
    const points = interaction.options.getInteger('points');
    const state = stateManager.getServerState(guildId);

    try {
        await dbOperations.saveStateToDB(guildId, 'inviteRewardPoints', points);
        state.inviteRewardPoints = points;

        const unitLabel = points === 1 ? 'point' : 'points';
        await interaction.reply(`Success! Inviters will now receive **${points} ${unitLabel}** for each successful invite.`);
    } catch (error) {
        console.error('[SETINVITEPOINTS] Error setting invite reward points:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleSetInvitePoints };
