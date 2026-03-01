const { EmbedBuilder } = require('discord.js');
const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');

const USER_COMMANDS = ['leaderboard', 'rank', 'help'];
const ADMIN_COMMANDS = ['asknow', 'reveal', 'postdaily', 'points', 'knowledge', 'relinkpoll', 'resolve', 'milestones', 'settings', 'setcc', 'setwelcome', 'setcontrolrole'];

const COMMAND_DESCRIPTIONS = {
    'leaderboard': 'Check who is leading the server in AI trivia!',
    'rank': 'See your personal rank and total points.',
    'help': 'Get a full list of everything I can do.',
    'asknow': 'Instantly start an on-demand AI poll.',
    'reveal': 'End an active on-demand poll and show the answer.',
    'points': 'Manually adjust user scores for rewards or corrections.',
    'knowledge': 'Update my brain with new info about OWGT or AI.',
    'milestones': 'Set up automated roles for point achievements.',
    'settings': 'View all server configurations at once.'
};

async function checkAndPostEngagement(discordClient) {
    const guilds = Array.from(discordClient.guilds.cache.values());
    
    for (const guild of guilds) {
        try {
            if (!stateManager.serverStateCache[guild.id]) await dbOperations.loadStateForGuild(guild.id);
            const state = stateManager.getServerState(guild.id);
            const stats = state.commandStats || {};
            const now = new Date();

            // --- 1. GENERAL CHANNEL (Every 14 Days) ---
            const lastPostGen = state.lastEngagementPostGeneral ? new Date(state.lastEngagementPostGeneral) : null;
            if (!lastPostGen || (now - lastPostGen) >= 14 * 24 * 60 * 60 * 1000) {
                const generalChannel = guild.channels.cache.find(c => (c.name === 'general' || c.name === 'chat') && c.isTextBased());
                if (generalChannel) {
                    const leastUsed = USER_COMMANDS
                        .map(cmd => ({ name: cmd, uses: stats[cmd] || 0 }))
                        .sort((a, b) => a.uses - b.uses)
                        .slice(0, 2);

                    const cmd1 = leastUsed[0].name;
                    const cmd2 = leastUsed[1].name;

                    const message = `Wassup guys👋! Just a quick reminder abt my features: \n\n` +
                        `Did you know you can use **/${cmd1}** to ${COMMAND_DESCRIPTIONS[cmd1] || 'explore features'}? \n` +
                        `Also, check out **/${cmd2}**—it's a great way to ${COMMAND_DESCRIPTIONS[cmd2] || 'stay engaged'}. \n\n` +
                        `Just putting them out there. Give them a try! 🚀`;

                    await generalChannel.send(message);
                    state.lastEngagementPostGeneral = now.toISOString();
                    await dbOperations.saveStateToDB(guild.id, 'lastEngagementPostGeneral', state.lastEngagementPostGeneral);
                }
            }

            // --- 2. TEAM CHANNEL (Every 9 Days) ---
            const lastPostTeam = state.lastEngagementPostTeam ? new Date(state.lastEngagementPostTeam) : null;
            if (!lastPostTeam || (now - lastPostTeam) >= 9 * 24 * 60 * 60 * 1000) {
                const teamChannel = guild.channels.cache.find(c => (c.name === 'team' || c.name === 'staff') && c.isTextBased());
                if (teamChannel) {
                    const leastUsedAdmin = ADMIN_COMMANDS
                        .map(cmd => ({ name: cmd, uses: stats[cmd] || 0 }))
                        .sort((a, b) => a.uses - b.uses)
                        .slice(0, 3);

                    const cmds = leastUsedAdmin.map(u => `**/${u.name}**`).join(', ');

                    const message = `Hi Team! Lock in. 🌟 \n\n` +
                        `I noticed that we haven't used ${cmds} much lately. These features will engage the people and help the server significantly. \n\n` +
                        `If you have a moment, feel free to test them out or check **/settings** to see the current setup. Let's lock in!`;

                    await teamChannel.send(message);
                    state.lastEngagementPostTeam = now.toISOString();
                    await dbOperations.saveStateToDB(guild.id, 'lastEngagementPostTeam', state.lastEngagementPostTeam);
                }
            }

        } catch (error) {
            console.error(`[ENGAGEMENT][${guild.id}] Failed:`, error);
        }
    }
}

module.exports = { checkAndPostEngagement };
