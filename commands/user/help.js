// --- /help Command Handler ---
const { EmbedBuilder } = require('discord.js');
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../../config');

async function handleHelp(interaction) {
    const hasPermission = interaction.user.username === ALLOWED_USERNAME || interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);
    const embed = new EmbedBuilder().setColor('#5865F2').setTitle('🤖 Bot Commands').setDescription('Here are the available commands:');
    embed.addFields({ name: `/leaderboard`, value: 'Displays the top 10 players.' }, { name: `/rank [user]`, value: 'Shows your rank or a mentioned user\'s rank.' }, { name: `/help`, value: 'Shows this help message.' });
    if (hasPermission) {
        embed.addFields({ name: '--- Admin Commands ---', value: '\u200B' }, { name: `/points <add|remove|set> <user> <amount>`, value: 'Adjusts a user\'s points.' }, { name: `/update-knowledge`, value: "Opens a form to update the bot's knowledge base." }, { name: `/asknow [topic]`, value: 'Starts an on-demand poll.' }, { name: `/reveal`, value: 'Reveals the answer for the active poll.' }, { name: `/postdaily`, value: 'Manually triggers the daily poll sequence.' }, { name: `/relinkpoll <id> <option#>`, value: "Fixes the bot's memory to track a poll." }, { name: `/resolve`, value: "Manually resolves the last-known poll." });
    }
    await interaction.reply({ embeds: [embed] });
}

module.exports = { handleHelp };
