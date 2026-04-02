const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');

const USER_COMMANDS = ['leaderboard', 'rank', 'help'];
const ADMIN_COMMANDS = ['asknow', 'postdaily', 'points', 'knowledge', 'relinkpoll', 'resolve', 'milestones', 'settings', 'setcc', 'setwelcome', 'setcontrolrole'];
const USER_CHANNEL_NAMES = ['general', 'chat', 'community', 'lounge'];
const ADMIN_CHANNEL_NAMES = ['team', 'staff', 'admin', 'admins', 'mod', 'mods', 'moderator', 'moderators'];

const COMMAND_DESCRIPTIONS = {
    leaderboard: 'Check who is leading the server in AI trivia!',
    rank: 'See your personal rank and total points.',
    help: 'Get a full list of everything I can do.',
    asknow: 'Instantly start an on-demand AI poll.',
    resolve: 'Resolve on-demand or daily polls on demand.',
    points: 'Manually adjust user scores for rewards or corrections.',
    knowledge: 'Update my brain with new info about OWGT or AI.',
    milestones: 'Set up automated roles for point achievements.',
    settings: 'View all server configurations at once.'
};

function isWritableTextChannel(channel, guild) {
    if (!channel || !channel.isTextBased() || channel.isDMBased()) return false;
    const me = guild.members.me;
    if (!me) return false;
    return channel.permissionsFor(me)?.has(['ViewChannel', 'SendMessages']);
}

function getOrderedWritableChannels(guild, channels) {
    return channels
        .filter((channel) => isWritableTextChannel(channel, guild))
        .sort((a, b) => {
            const posA = typeof a.rawPosition === 'number' ? a.rawPosition : Number.MAX_SAFE_INTEGER;
            const posB = typeof b.rawPosition === 'number' ? b.rawPosition : Number.MAX_SAFE_INTEGER;
            if (posA !== posB) return posA - posB;
            return a.name.localeCompare(b.name);
        });
}

function pickChannelByNames(guild, channels, names) {
    const ordered = getOrderedWritableChannels(guild, channels);

    for (const targetName of names) {
        const found = ordered.find((channel) => channel.name?.toLowerCase().includes(targetName));
        if (found) return found;
    }

    return null;
}

async function findEngagementChannels(guild) {
    await guild.channels.fetch();
    const channels = Array.from(guild.channels.cache.values());
    const orderedWritable = getOrderedWritableChannels(guild, channels);

    const generalChannel = pickChannelByNames(guild, channels, USER_CHANNEL_NAMES)
        || (isWritableTextChannel(guild.systemChannel, guild) ? guild.systemChannel : null)
        || orderedWritable[0];

    const teamChannel = pickChannelByNames(guild, channels, ADMIN_CHANNEL_NAMES)
        || generalChannel;

    return { generalChannel, teamChannel };
}

async function checkAndPostEngagement(discordClient) {
    const guilds = Array.from(discordClient.guilds.cache.values());

    for (const guild of guilds) {
        try {
            if (!stateManager.serverStateCache[guild.id]) {
                await dbOperations.loadStateForGuild(guild.id);
            }

            const state = stateManager.getServerState(guild.id);
            const stats = state.commandStats || {};
            const now = new Date();
            const { generalChannel, teamChannel } = await findEngagementChannels(guild);

            const lastPostGen = state.lastEngagementPostGeneral ? new Date(state.lastEngagementPostGeneral) : null;
            if ((!lastPostGen || (now - lastPostGen) >= 14 * 24 * 60 * 60 * 1000) && generalChannel) {
                const leastUsed = USER_COMMANDS
                    .map((cmd) => ({ name: cmd, uses: stats[cmd] || 0 }))
                    .sort((a, b) => a.uses - b.uses)
                    .slice(0, 2);

                const cmd1 = leastUsed[0].name;
                const cmd2 = leastUsed[1].name;

                const message = `Wassup guys! Just a quick reminder about my features:\n\n`
                    + `Did you know you can use **/${cmd1}** to ${COMMAND_DESCRIPTIONS[cmd1] || 'explore features'}?\n`
                    + `Also, check out **/${cmd2}**. It is a great way to ${COMMAND_DESCRIPTIONS[cmd2] || 'stay engaged'}.\n\n`
                    + 'Give them a try!';

                await generalChannel.send(message);
                state.lastEngagementPostGeneral = now.toISOString();
                await dbOperations.saveStateToDB(guild.id, 'lastEngagementPostGeneral', state.lastEngagementPostGeneral);
            }

            const lastPostTeam = state.lastEngagementPostTeam ? new Date(state.lastEngagementPostTeam) : null;
            if ((!lastPostTeam || (now - lastPostTeam) >= 9 * 24 * 60 * 60 * 1000) && teamChannel) {
                const leastUsedAdmin = ADMIN_COMMANDS
                    .map((cmd) => ({ name: cmd, uses: stats[cmd] || 0 }))
                    .sort((a, b) => a.uses - b.uses)
                    .slice(0, 3);

                const cmds = leastUsedAdmin.map((usage) => `**/${usage.name}**`).join(', ');

                const message = 'Hi Team! Quick admin reminder.\n\n'
                    + `I noticed we have not used ${cmds} much lately. These features can help the server significantly.\n\n`
                    + 'If you have a moment, test them or check **/settings** to see the current setup.';

                await teamChannel.send(message);
                state.lastEngagementPostTeam = now.toISOString();
                await dbOperations.saveStateToDB(guild.id, 'lastEngagementPostTeam', state.lastEngagementPostTeam);
            }
        } catch (error) {
            console.error(`[ENGAGEMENT][${guild.id}] Failed:`, error);
        }
    }
}

module.exports = { checkAndPostEngagement };


