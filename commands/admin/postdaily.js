// --- /postdaily Command Handler ---
const { performDailyPost } = require('../../services/polls/posting');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { getNYDateString } = require('../../utils/dateUtils');

async function handlePostdaily(interaction, discordClient) {
    // FIX: Use deferReply to prevent 'Unknown Interaction' errors if the bot wakes up slowly or processing takes >3s.
    await interaction.deferReply();

    const guildId = interaction.guild.id;
    await dbOperations.loadStateForGuild(guildId);
    const state = stateManager.getServerState(guildId);
    
    const now = new Date();
    const todayDateStr = getNYDateString(now);

    if (state.lastPollData && state.lastPollData.createdAt && !isNaN(new Date(state.lastPollData.createdAt))) {
        const lastPollDateStr = getNYDateString(new Date(state.lastPollData.createdAt));
        if (lastPollDateStr === todayDateStr) {
            await interaction.editReply("Today's daily poll has already been posted in this server!");
            return;
        }
    }

    await interaction.editReply("Manually triggering the daily poll process...");
    await performDailyPost(interaction.channel.id, discordClient, true);
}

module.exports = { handlePostdaily };
