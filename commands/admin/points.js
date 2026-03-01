// --- /points Command Handler ---
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { checkAndAssignMilestoneRole } = require('../../services/roles/milestones');

async function handlePoints(interaction) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    const subCommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    let newScore = null;
    if (subCommand === 'add') newScore = await dbOperations.admin_setOrAddUserScore(guildId, targetUser.id, amount, 'add');
    else if (subCommand === 'remove') newScore = await dbOperations.admin_removeUserScore(guildId, targetUser.id, amount);
    else if (subCommand === 'set') newScore = await dbOperations.admin_setOrAddUserScore(guildId, targetUser.id, amount, 'set');

    if (newScore !== null) {
        state.leaderboard[targetUser.id] = newScore;
        
        // --- Milestone Role Check ---
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (member) {
            await checkAndAssignMilestoneRole(member, newScore, interaction.channel);
        }

        await interaction.reply(`Success! **${targetUser.username}**'s score is now **${newScore}**.`);
    } else { await interaction.reply({ content: 'A database error occurred.', ephemeral: true }); }
}

module.exports = { handlePoints };
