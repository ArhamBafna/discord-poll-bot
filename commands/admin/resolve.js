// --- /resolve Command Handler ---
const { resolveLastPoll } = require('../../services/polls/resolution');
const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');

async function handleResolve(interaction, discordClient) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    
    if (!state.lastPollData) return interaction.reply({ content: "There is no poll in memory to resolve.", ephemeral: true });
    await interaction.reply("Manually resolving the last known poll...");
    if (await resolveLastPoll(interaction.channel, discordClient)) {
        state.lastPollData = null;
        await dbOperations.deleteStateFromDB(guildId, 'lastPollData');
        await interaction.followUp("✅ Last poll has been resolved and cleared from memory.");
    } else { await interaction.followUp("❌ Something went wrong during resolution. Check logs."); }
}

module.exports = { handleResolve };
