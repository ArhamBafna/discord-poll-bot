// --- /rank Command Handler ---
const stateManager = require('../../state/manager');

async function handleRank(interaction) {
    await interaction.deferReply();
    const state = stateManager.getServerState(interaction.guild.id);
    const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);
    if (sortedUsers.length === 0) return interaction.editReply('The leaderboard is empty!');

    const targetUser = interaction.options.getUser('user') || interaction.user;
    const isSelf = targetUser.id === interaction.user.id;
    const userRankIndex = sortedUsers.findIndex(([userId]) => userId === targetUser.id);

    if (userRankIndex !== -1) {
        const message = isSelf
            ? `${targetUser.username}, you are rank **#${userRankIndex + 1}** with **${sortedUsers[userRankIndex][1]}** point(s).`
            : `${targetUser.username} is rank **#${userRankIndex + 1}** with **${sortedUsers[userRankIndex][1]}** point(s).`;
        await interaction.editReply(message);
    } else {
        const message = isSelf
            ? `${targetUser.username}, you are not on the leaderboard yet.`
            : `${targetUser.username} is not on the leaderboard yet.`;
        await interaction.editReply(message);
    }
}

module.exports = { handleRank };
