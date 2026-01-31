// --- State Management ---
const serverStateCache = {};

function getServerState(guildId) {
    if (!serverStateCache[guildId]) {
        serverStateCache[guildId] = { leaderboard: {}, lastPollData: null, activeOnDemandPoll: null, knowledgeBase: {}, lastSuccessfulPoll: null };
    }
    return serverStateCache[guildId];
}

module.exports = {
    getServerState,
    serverStateCache
};
