// --- Slash Command & Interaction Handler ---
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../config');
const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');
const { handleLeaderboard } = require('../commands/user/leaderboard');
const { handleRank } = require('../commands/user/rank');
const { handleHelp } = require('../commands/user/help');
const { handlePoints } = require('../commands/admin/points');
const { handleAsknow } = require('../commands/admin/asknow');
const { handlePostdaily } = require('../commands/admin/postdaily');
const { handleRelinkpoll } = require('../commands/admin/relinkpoll');
const { handleResolve } = require('../commands/admin/resolve');
const { handleKnowledge } = require('../commands/admin/knowledge');
const { handleSetCC } = require('../commands/admin/setcc');
const { handleSetWelcome } = require('../commands/admin/setwelcome');
const { handleSetControlRole } = require('../commands/admin/setcontrolrole');
const { handleMilestones } = require('../commands/admin/milestones');
const { handleSettings } = require('../commands/admin/settings');
const { handleSetInvitePoints } = require('../commands/admin/setinvitepoints');

async function handleInteractionCreate(interaction, discordClient) {
    try {
        // --- Slash Autocomplete Handler ---
        if (interaction.isAutocomplete()) {
            if (interaction.commandName !== 'knowledge') {
                await interaction.respond([]);
                return;
            }

            const guildId = interaction.guild.id;
            if (!stateManager.serverStateCache[guildId]) await dbOperations.loadStateForGuild(guildId);
            const state = stateManager.getServerState(guildId);

            const hasPermission = interaction.user.username === ALLOWED_USERNAME ||
                (state.controlRole ? interaction.member?.roles.cache.has(state.controlRole) : interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME));

            if (!hasPermission || interaction.options.getSubcommand() !== 'update') {
                await interaction.respond([]);
                return;
            }

            const focusedValue = interaction.options.getFocused().toLowerCase().trim();
            const topicChoices = Object.keys(state.knowledgeBase)
                .filter(topic => topic.toLowerCase().includes(focusedValue))
                .slice(0, 25)
                .map(topic => ({ name: topic, value: topic }));

            await interaction.respond(topicChoices);
            return;
        }

        // --- Modal Submit Handler ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('knowledgeBaseModal:')) {
                const hasPermission = interaction.user.username === ALLOWED_USERNAME || 
                    (stateManager.getServerState(interaction.guild.id).controlRole ? interaction.member?.roles.cache.has(stateManager.getServerState(interaction.guild.id).controlRole) : interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME));
                
                if (!hasPermission) {
                    return interaction.reply({ content: "You don't have permission to do this.", ephemeral: true });
                }

                const guildId = interaction.guild.id;
                const topic = interaction.customId.split(':')[1];
                const knowledgeText = interaction.fields.getTextInputValue('knowledgeInput');
                const success = await dbOperations.admin_saveKnowledgeBase(guildId, topic, knowledgeText);

                if (success) {
                    const state = stateManager.getServerState(guildId);
                    state.knowledgeBase[topic] = knowledgeText; // Update cache
                    await interaction.reply({ content: `Knowledge for topic **${topic}** has been updated successfully!` });
                } else {
                    await interaction.reply({ content: 'A database error occurred while trying to update the knowledge base.' });
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const guildId = interaction.guild.id;

        if (!stateManager.serverStateCache[guildId]) await dbOperations.loadStateForGuild(guildId);
        const state = stateManager.getServerState(guildId);

        // --- Increment Usage Stats ---
        await dbOperations.incrementCommandUsage(guildId, commandName);
        state.commandStats[commandName] = (state.commandStats[commandName] || 0) + 1;

        const hasPermission = interaction.user.username === ALLOWED_USERNAME || 
            (state.controlRole ? interaction.member?.roles.cache.has(state.controlRole) : interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME));

        // --- User Commands ---
        if (commandName === 'leaderboard') {
            await handleLeaderboard(interaction, discordClient);
        } else if (commandName === 'rank') {
            await handleRank(interaction);
        } else if (commandName === 'help') {
            await handleHelp(interaction);
        }

        // --- Admin Commands ---
        if (!hasPermission && ['points', 'asknow', 'postdaily', 'relinkpoll', 'resolve', 'knowledge', 'setcc', 'setwelcome', 'setcontrolrole', 'invitepoints', 'milestones', 'settings'].includes(commandName)) {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        if (commandName === 'points') {
            await handlePoints(interaction);
        } else if (commandName === 'asknow') {
            await handleAsknow(interaction, discordClient);
        } else if (commandName === 'postdaily') {
            await handlePostdaily(interaction, discordClient);
        } else if (commandName === 'relinkpoll') {
            await handleRelinkpoll(interaction);
        } else if (commandName === 'resolve') {
            await handleResolve(interaction, discordClient);
        } else if (commandName === 'knowledge') {
            await handleKnowledge(interaction);
        } else if (commandName === 'setcc') {
            await handleSetCC(interaction);
        } else if (commandName === 'setwelcome') {
            await handleSetWelcome(interaction);
        } else if (commandName === 'setcontrolrole') {
            await handleSetControlRole(interaction);
        } else if (commandName === 'invitepoints') {
            await handleSetInvitePoints(interaction);
        } else if (commandName === 'milestones') {
            await handleMilestones(interaction);
        } else if (commandName === 'settings') {
            await handleSettings(interaction);
        }

    } catch (error) {
        const commandIdentifier = interaction.isCommand() ? `/${interaction.commandName}` : `(ID: ${interaction.customId})`;
        console.error(`[INTERACTION_HANDLER] Error on ${commandIdentifier} in guild ${interaction.guild?.id}:`, error);

        // Skip error reply for timed-out interactions (Discord error 10062)
        if (error.code === 10062 || error.rawError?.code === 10062) {
            console.warn(`[INTERACTION_HANDLER] Interaction timed out (10062). Skipping error reply.`);
            return;
        }

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

