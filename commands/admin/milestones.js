const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { syncAllMilestoneRoles } = require('../../services/roles/milestones');

async function handleMilestones(interaction) {
    const guildId = interaction.guild.id;
    const subCommand = interaction.options.getSubcommand();
    const state = stateManager.getServerState(guildId);

    try {
        if (subCommand === 'add') {
            const points = interaction.options.getInteger('points');
            const role = interaction.options.getRole('role');
            const milestones = { ...state.roleMilestones };
            milestones[points] = role.id;
            
            await dbOperations.saveStateToDB(guildId, 'roleMilestones', milestones);
            state.roleMilestones = milestones;
            
            // Sync roles immediately for all users who might already have these points
            await syncAllMilestoneRoles(interaction.guild, state);
            
            await interaction.reply(`Success! Users will now be awarded the **${role.name}** role when they reach **${points}** points.`);
        } 
        else if (subCommand === 'remove') {
            const points = interaction.options.getInteger('points');
            const milestones = { ...state.roleMilestones };
            
            if (!milestones[points]) {
                return await interaction.reply({ content: `There is no milestone set for **${points}** points.` });
            }
            
            delete milestones[points];
            await dbOperations.saveStateToDB(guildId, 'roleMilestones', milestones);
            state.roleMilestones = milestones;
            
            await interaction.reply(`Success! The milestone for **${points}** points has been removed.`);
        }
    } catch (error) {
        console.error('[MILESTONES] Error managing milestones:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

module.exports = { handleMilestones };
