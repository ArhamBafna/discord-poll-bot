// Codec registry for the merged kv_store table.
// Each settings key declares its default plus how to parse (TEXT -> value)
// and serialize (value -> TEXT). Knowledge topics are any key NOT listed
// here and are stored as plain human-readable text.
function parseJson(raw, fallback) {
    if (raw === null || raw === undefined || raw === '') return fallback;
    if (typeof raw === 'object') return raw;
    try {
        const parsed = JSON.parse(raw);
        return parsed === undefined ? fallback : parsed;
    } catch {
        return fallback;
    }
}

function serializeJson(value) {
    return JSON.stringify(value);
}

function parseText(raw, fallback) {
    if (raw === null || raw === undefined) return fallback;
    return typeof raw === 'string' ? raw : String(raw);
}

function serializeText(value) {
    return String(value);
}

function parseInviteRewardPoints(raw) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 1;
}

function serializeInviteRewardPoints(value) {
    const n = Number(value);
    return String(Number.isFinite(n) ? n : 1);
}

const CODECS = {
    lastPollData: { default: null, parse: (raw) => parseJson(raw, null), serialize: serializeJson },
    activeOnDemandPoll: { default: null, parse: (raw) => parseJson(raw, null), serialize: serializeJson },
    lastSuccessfulPoll: { default: null, parse: (raw) => parseJson(raw, null), serialize: serializeJson },
    lastWeeklyLeaderboard: { default: null, parse: (raw) => parseJson(raw, null), serialize: serializeJson },
    roleMilestones: { default: {}, parse: (raw) => parseJson(raw, {}), serialize: serializeJson },
    ccUser: { default: null, parse: (raw) => parseText(raw, null), serialize: serializeText },
    welcomeTemplate: { default: null, parse: (raw) => parseText(raw, null), serialize: serializeText },
    controlRole: { default: null, parse: (raw) => parseText(raw, null), serialize: serializeText },
    lastEngagementPostGeneral: { default: null, parse: (raw) => parseText(raw, null), serialize: serializeText },
    lastEngagementPostTeam: { default: null, parse: (raw) => parseText(raw, null), serialize: serializeText },
    inviteRewardPoints: { default: 1, parse: parseInviteRewardPoints, serialize: serializeInviteRewardPoints }
};

function isSettingsKey(key) {
    return Object.prototype.hasOwnProperty.call(CODECS, key);
}

function parseStoredValue(key, raw) {
    if (!isSettingsKey(key)) return typeof raw === 'string' ? raw : String(raw);
    if (raw === null || raw === undefined) return CODECS[key].default;
    return CODECS[key].parse(raw);
}

function serializeStoredValue(key, value) {
    if (!isSettingsKey(key)) return String(value);
    return CODECS[key].serialize(value);
}

module.exports = { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue };
