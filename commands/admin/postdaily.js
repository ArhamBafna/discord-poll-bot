// --- /postdaily Command Handler ---
const { performDailyPost } = require('../../services/polls/posting');

async function handlePostdaily(interaction, discordClient) {
    // FIX: Use deferReply to prevent 'Unknown Interaction' errors if the bot wakes up slowly or processing takes >3s.
    await interaction.deferReply();
    await interaction.editReply("Manually triggering the daily poll process...");
    await performDailyPost(interaction.channel.id, discordClient, true);
}

module.exports = { handlePostdaily };
