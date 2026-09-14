const stateManager = require('../../state/manager');
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../../config');
const { renderWelcomeTemplate } = require('../../lib/serviceHelpers');

async function handleSettings(interaction) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);

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

module.exports = { handleSettings };
