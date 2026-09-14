// --- Slash Command & Interaction Handler ---
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../config');
const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');
const { registry } = require('../commands/registry');

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
                const guildId = interaction.guild.id;
                if (!stateManager.serverStateCache[guildId]) await dbOperations.loadStateForGuild(guildId);
                const state = stateManager.getServerState(guildId);
                
                const hasPermission = interaction.user.username === ALLOWED_USERNAME || 
                    (state.controlRole ? interaction.member?.roles.cache.has(state.controlRole) : interaction.member?.roles.cache.some(role => role.name === CONTROL_ROLE_NAME));
                
                if (!hasPermission) {
                    return interaction.reply({ content: "You don't have permission to do this.", ephemeral: true });
                }

                const topic = interaction.customId.split(':')[1];
                const knowledgeText = interaction.fields.getTextInputValue('knowledgeInput');
                const success = await dbOperations.updateAndPersistKnowledge(guildId, topic, knowledgeText);

                if (success) { // Update cache
                    await interaction.reply({ content: \`Knowledge for topic **\${topic}** has been updated successfully!\` });
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

        const cmdDef = registry.find(c => c.builder.name === commandName);
        if (!cmdDef) {
            return interaction.reply({ content: "Unknown command.", ephemeral: true });
        }

        if (cmdDef.adminOnly && !hasPermission) {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }

        await cmdDef.handler(interaction, discordClient);

    } catch (error) {
        const commandIdentifier = interaction.isCommand() ? \`/\${interaction.commandName}\` : \`(ID: \${interaction.customId})\`;
        console.error(\`[INTERACTION_HANDLER] Error on \${commandIdentifier} in guild \${interaction.guild?.id}:\`, error);

        // Skip error reply for timed-out interactions (Discord error 10062)
        if (error.code === 10062 || error.rawError?.code === 10062) {
            console.warn(\`[INTERACTION_HANDLER] Interaction timed out (10062). Skipping error reply.\`);
            return;
        }

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: "Oops! Something went wrong while executing this command.", ephemeral: true });
            } else {
                await interaction.reply({ content: "Oops! Something went wrong while executing this command.", ephemeral: true });
            }
        } catch (replyError) { console.error(\`[INTERACTION_HANDLER] CRITICAL: Failed to send error reply.\`, replyError); }
    }
}

module.exports = { handleInteractionCreate };
