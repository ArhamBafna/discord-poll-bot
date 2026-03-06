const stateManager = require('../../state/manager');
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../../config');

async function handleSettings(interaction) {
    const guildId = interaction.guild.id;
    const state = stateManager.getServerState(guildId);

    const ccUser = state.ccUser ? `<@${state.ccUser}>` : `Default (${ALLOWED_USERNAME})`;
    const welcomeTemplate = state.welcomeTemplate || 'Default Template';
    const controlRole = state.controlRole ? `<@&${state.controlRole}>` : `Default (${CONTROL_ROLE_NAME})`;
    const inviteRewardPoints = Math.max(0, Number(state.inviteRewardPoints) || 1);
    const inviteUnit = inviteRewardPoints === 1 ? 'point' : 'points';

    let preview = welcomeTemplate;
    if (welcomeTemplate !== 'Default Template') {
        preview = welcomeTemplate
            .replace('{user}', interaction.user)
            .replace('{inviter}', interaction.user)
            .replace('{cc}', interaction.user)
            .replace('{points_msg}', `i added ${inviteRewardPoints} ${inviteUnit} to your score!`);
    } else {
        preview = `welcome to the server, ${interaction.user}! you were invited by ${interaction.user}. i added ${inviteRewardPoints} ${inviteUnit} to your score for the invite! (cc <@${interaction.user.id}>)`;
    }

    const response = `**OWGT Bot Configuration Overview**\n\n` +
        `**1. Permissions**\n` +
        `- **Administrative Role:** ${controlRole}\n\n` +
        `**2. Invite Points**\n` +
        `- **Reward Per Invite:** ${inviteRewardPoints} ${inviteUnit}\n\n` +
        `**3. Welcome Routine**\n` +
        `- **CC User:** ${ccUser}\n` +
        `- **Template:** \n\`\`\`\n${welcomeTemplate}\n\`\`\`\n` +
        `**4. Welcome Message Preview**\n` +
        `${preview}\n\n` +
        `**5. Role Milestones**\n` +
        (Object.keys(state.roleMilestones).length > 0
            ? Object.entries(state.roleMilestones).sort(([a], [b]) => Number(a) - Number(b)).map(([pts, roleId]) => `- **${pts} Points**: <@&${roleId}>`).join('\n')
            : '- No milestones set.') + '\n\n' +
        `**6. Other States**\n` +
        `- **Active Poll:** ${state.activeOnDemandPoll ? 'Yes' : 'None'}\n` +
        `- **Knowledge Base Topics:** ${Object.keys(state.knowledgeBase).length > 0 ? Object.keys(state.knowledgeBase).join(', ') : 'None'}`;

    await interaction.reply({ content: response });
}

module.exports = { handleSettings };
