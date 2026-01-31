// --- Slash Command & Interaction Handler ---
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../config');
const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');
const { handleLeaderboard } = require('../commands/user/leaderboard');
const { handleRank } = require('../commands/user/rank');
const { handleHelp } = require('../commands/user/help');
const { handlePoints } = require('../commands/admin/points');
const { handleAsknow } = require('../commands/admin/asknow');
const { handleReveal } = require('../commands/admin/reveal');
const { handlePostdaily } = require('../commands/admin/postdaily');
const { handleRelinkpoll } = require('../commands/admin/relinkpoll');
const { handleResolve } = require('../commands/admin/resolve');
const { handleUpdateKnowledge } = require('../commands/admin/updateKnowledge');

async function handleInteractionCreate(interaction, discordClient) {
    try {
        // --- Modal Submit Handler ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'knowledgeBaseModal') {
                const hasPermission = interaction.user.username === ALLOWED_USERNAME || interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);
                if (!hasPermission) {
                    return interaction.reply({ content: "You don't have permission to do this.", ephemeral: true });
                }

                const guildId = interaction.guild.id;
                const knowledgeText = interaction.fields.getTextInputValue('knowledgeInput');
                const success = await dbOperations.admin_saveKnowledgeBase(guildId, 'main-info', knowledgeText);

                if (success) {
                    const state = stateManager.getServerState(guildId);
                    state.knowledgeBase['main-info'] = knowledgeText; // Update cache
                    await interaction.reply({ content: '✅ Knowledge base has been updated successfully!', ephemeral: true });
                } else {
                    await interaction.reply({ content: '❌ A database error occurred while trying to update the knowledge base.', ephemeral: true });
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const guildId = interaction.guild.id;
        const hasPermission = interaction.user.username === ALLOWED_USERNAME || interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME);

        if (!stateManager.serverStateCache[guildId]) await dbOperations.loadStateForGuild(guildId);

        // --- User Commands ---
        if (commandName === 'leaderboard') {
            await handleLeaderboard(interaction, discordClient);
        } else if (commandName === 'rank') {
            await handleRank(interaction);
        } else if (commandName === 'help') {
            await handleHelp(interaction);
        }

        // --- Admin Commands ---
        if (!hasPermission && ['points', 'asknow', 'reveal', 'postdaily', 'relinkpoll', 'resolve', 'update-knowledge'].includes(commandName)) {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        if (commandName === 'points') {
            await handlePoints(interaction);
        } else if (commandName === 'asknow') {
            await handleAsknow(interaction, discordClient);
        } else if (commandName === 'reveal') {
            await handleReveal(interaction);
        } else if (commandName === 'postdaily') {
            await handlePostdaily(interaction, discordClient);
        } else if (commandName === 'relinkpoll') {
            await handleRelinkpoll(interaction);
        } else if (commandName === 'resolve') {
            await handleResolve(interaction, discordClient);
        } else if (commandName === 'update-knowledge') {
            await handleUpdateKnowledge(interaction);
        }

    } catch (error) {
        const commandIdentifier = interaction.isCommand() ? `/${interaction.commandName}` : `(ID: ${interaction.customId})`;
        console.error(`[INTERACTION_HANDLER] Error on ${commandIdentifier} in guild ${interaction.guild?.id}:`, error);
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "Oops! Something went wrong while executing this command.", ephemeral: true });
            } else {
                await interaction.reply({ content: "Oops! Something went wrong while executing this command.", ephemeral: true });
            }
        } catch (replyError) { console.error(`[INTERACTION_HANDLER] CRITICAL: Failed to send error reply.`, replyError); }
    }
}

module.exports = { handleInteractionCreate };
