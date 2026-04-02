// --- State Management ---
const serverStateCache = {};

function getServerState(guildId) {
    if (!serverStateCache[guildId]) {
        serverStateCache[guildId] = { 
            leaderboard: {}, 
            lastPollData: null, 
            activeOnDemandPoll: null, 
            knowledgeBase: {}, 
            lastSuccessfulPoll: null,
            ccUser: null, // Stores the ID of the user to CC in welcome messages
            welcomeTemplate: null, // Stores the custom welcome message template
            controlRole: null, // Stores the ID of the role allowed to run admin commands
            roleMilestones: {}, // Stores { points: roleId } mappings for automated role assignment
            inviteRewardPoints: 1, // Points awarded to inviter when someone joins via their invite
            commandStats: {}, // Stores { commandName: useCount } for engagement
            lastEngagementPostGeneral: null, // ISO string of last time engagement message was posted in #general
            lastEngagementPostTeam: null // ISO string of last time engagement message was posted in #team
        };
    }
    return serverStateCache[guildId];
}

module.exports = {
    getServerState,
    serverStateCache
};

