const stateManager = require('../../state/manager');
const dbOperations = require('../../database/operations');
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../../config');
const { renderWelcomeTemplate } = require('../../lib/serviceHelpers');

async function handleView(interaction, state) {
    const ccUser = state.ccUser ? `<@${state.ccUser}>` : `Default (${ALLOWED_USERNAME})`;
    const controlRole = state.controlRole ? `<@&${state.controlRole}>` : `Default (${CONTROL_ROLE_NAME})`;
    const inviteRewardPoints = Math.max(0, Number(state.inviteRewardPoints) || 1);
    const inviteUnit = inviteRewardPoints === 1 ? 'point' : 'points';
    const welcomeTemplate = state.welcomeTemplate || 'Default Template';

    let preview = welcomeTemplate;
    if (welcomeTemplate !== 'Default Template') {
        preview = renderWelcomeTemplate(
            welcomeTemplate,
            interaction.user,
            interaction.user,
            interaction.user,
            `i added ${inviteRewardPoints} ${inviteUnit} to your score!`
        );
    } else {
        preview = `welcome to the server, ${interaction.user}! you were invited by ${interaction.user}. i added ${inviteRewardPoints} ${inviteUnit} to your score for the invite! (cc <@${interaction.user.id}>)`;
    }

    if (preview.length > 500) {
        preview = preview.substring(0, 500) + '... (truncated)';
    }

    const response = `**OWGT Bot Configuration Overview**\n\n` +
        `**Config**\n` +
        `- Administrative Role: ${controlRole}\n` +
        `- CC User: ${ccUser}\n` +
        `- Invite Reward: ${inviteRewardPoints} ${inviteUnit}\n` +
        `- Role Milestones: ${Object.keys(state.roleMilestones).length} set\n\n` +
        `**Preview (Welcome)**\n` +
        `${preview}\n\n` +
        `**Health**\n` +
        `- Active Poll: ${state.activeOnDemandPoll ? 'Yes' : 'None'}\n` +
        `- Knowledge Base Topics: ${Object.keys(state.knowledgeBase).length}`;

    await interaction.reply({ content: response });
}

async function handleWelcome(interaction, guildId) {
    const template = interaction.options.getString('template');
    try {
        const success = await dbOperations.updateAndPersist(guildId, 'welcomeTemplate', template);
        if (!success) throw new Error('DB Error');
        const preview = renderWelcomeTemplate(template, interaction.user, 'someone', 'someone', "i added a point to someone's score!");
        await interaction.reply(`Success! The welcome message template has been updated.\n\n**Preview:**\n${preview}`);
    } catch (error) {
        console.error('[CONFIG WELCOME] Error setting welcome template:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

async function handleCC(interaction, guildId) {
    const targetUser = interaction.options.getUser('user');
    try {
        const success = await dbOperations.updateAndPersist(guildId, 'ccUser', targetUser.id);
        if (!success) throw new Error('DB Error');
        await interaction.reply(`Success! **${targetUser.username}** will now be CC'd in welcome messages.`);
    } catch (error) {
        console.error('[CONFIG CC] Error setting CC user:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

async function handleRole(interaction, guildId) {
    const targetRole = interaction.options.getRole('role');
    try {
        const success = await dbOperations.updateAndPersist(guildId, 'controlRole', targetRole.id);
        if (!success) throw new Error('DB Error');
        await interaction.reply(`Success! Members with the **${targetRole.name}** role can now run administrative commands.`);
    } catch (error) {
        console.error('[CONFIG ROLE] Error setting control role:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

async function handleInvitePoints(interaction, guildId) {
    const points = interaction.options.getInteger('points');
    try {
        const success = await dbOperations.updateAndPersist(guildId, 'inviteRewardPoints', points);
        if (!success) throw new Error('DB Error');
        const unitLabel = points === 1 ? 'point' : 'points';
        await interaction.reply(`Success! Inviters will now receive **${points} ${unitLabel}** for each successful invite.`);
    } catch (error) {
        console.error('[CONFIG INVITE-POINTS] Error setting invite reward points:', error);
        await interaction.reply({ content: 'A database error occurred.', ephemeral: true });
    }
}

async function handleConfig(interaction) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'view': return handleView(interaction, state);
        case 'welcome': return handleWelcome(interaction, guildId);
        case 'cc': return handleCC(interaction, guildId);
        case 'role': return handleRole(interaction, guildId);
        case 'invite-points': return handleInvitePoints(interaction, guildId);
        default: return interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
    }
}

module.exports = { handleConfig };
