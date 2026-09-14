// --- /leaderboard Command Handler ---
const { createLeaderboardEmbed } = require('../../lib/embeds');
const stateManager = require('../../state/manager');

async function handleLeaderboard(interaction, discordClient) {
    await interaction.deferReply();
    const state = stateManager.getServerState(interaction.guild.id);
    const sortedUsers = Object.entries(state.leaderboard).sort(([, a], [, b]) => b - a);
    if (sortedUsers.length === 0) return interaction.editReply('The leaderboard is empty!');

    let description = '';
    for (let i = 0; i < Math.min(sortedUsers.length, 10); i++) {
        try {
            const user = await discordClient.users.fetch(sortedUsers[i][0]);
            description += `**${i + 1}. ${user.username}** - ${sortedUsers[i][1]} points\n`;
        } catch { description += `**${i + 1}.** *Unknown User* - ${sortedUsers[i][1]} points\n`; }
    }
    await interaction.editReply({ embeds: [createLeaderboardEmbed(`🏆 Leaderboard for ${interaction.guild.name}`, description)] });
}

module.exports = { handleLeaderboard };
