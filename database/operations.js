// --- Database Operations (merged kv_store) ---
const pool = require('./connection');
const stateManager = require('../state/manager');
const { CODECS, isSettingsKey, parseStoredValue, serializeStoredValue } = require('./codecs');

function resetGuildState(state) {
    state.leaderboard = {};
    state.lastPollData = null;
    state.activeOnDemandPoll = null;
    state.lastSuccessfulPoll = null;
    state.ccUser = null;
    state.welcomeTemplate = null;
    state.controlRole = null;
    state.roleMilestones = {};
    state.inviteRewardPoints = 1;
    state.commandStats = {};
    state.lastEngagementPostGeneral = null;
    state.lastEngagementPostTeam = null;
    state.knowledgeBase = {};
}

async function loadStateForGuild(guildId) {
    const state = stateManager.getServerState(guildId);
    try {
        const [leaderboardRes, kvRes, statsRes] = await Promise.all([
            pool.query('SELECT user_id, score FROM leaderboard WHERE guild_id = $1', [guildId]),
            pool.query('SELECT key, value FROM kv_store WHERE guild_id = $1', [guildId]),
            pool.query('SELECT command_name, uses FROM command_stats WHERE guild_id = $1', [guildId])
        ]);
        resetGuildState(state);
        leaderboardRes.rows.forEach(row => { state.leaderboard[row.user_id] = row.score; });

        for (const row of kvRes.rows) {
            if (isSettingsKey(row.key)) {
                state[row.key] = parseStoredValue(row.key, row.value);
            } else {
                state.knowledgeBase[row.key] = typeof row.value === 'string' ? row.value : String(row.value);
            }
        }

        for (const row of statsRes.rows) {
            state.commandStats[row.command_name] = row.uses;
        }
    } catch (error) {
        console.error(`[STATE] CRITICAL ERROR loading state for server ${guildId}:`, error);
    }
}

async function getStateValue(guildId, key) {
    const res = await pool.query('SELECT value FROM kv_store WHERE guild_id = $1 AND key = $2', [guildId, key]);
    if (res.rows.length === 0) return isSettingsKey(key) ? CODECS[key].default : null;
    return parseStoredValue(key, res.rows[0].value);
}

async function batchUpdateScoresInDB(guildId, userIds) {
    if (!userIds || userIds.length === 0) return;
    try {
        await pool.query(`INSERT INTO leaderboard (guild_id, user_id, score) SELECT $1, user_id, 1 FROM unnest($2::varchar[]) AS t(user_id) ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + 1;`, [guildId, userIds]);
    } catch (error) { console.error(`[DATABASE] Failed to batch update scores for ${userIds.length} users in guild ${guildId}:`, error); }
}

async function admin_setOrAddUserScore(guildId, userId, amount, mode = 'set') {
    try {
        const query = mode === 'add' ? `INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, $3) ON CONFLICT (guild_id, user_id) DO UPDATE SET score = leaderboard.score + $3 RETURNING score;` : `INSERT INTO leaderboard (guild_id, user_id, score) VALUES ($1, $2, $3) ON CONFLICT (guild_id, user_id) DO UPDATE SET score = $3 RETURNING score;`;
        const res = await pool.query(query, [guildId, userId, amount]);
        return res.rows.length > 0 ? res.rows[0].score : null;
    } catch (error) { console.error(`[DATABASE] Failed to ${mode} score for user ${userId} in guild ${guildId}:`, error); return null; }
}

async function admin_removeUserScore(guildId, userId, amount) {
    try {
        const res = await pool.query(`UPDATE leaderboard SET score = GREATEST(0, score - $1) WHERE guild_id = $2 AND user_id = $3 RETURNING score;`, [amount, guildId, userId]);
        return res.rows.length > 0 ? res.rows[0].score : 0;
    } catch (error) { console.error(`[DATABASE] Failed to remove score for user ${userId} in guild ${guildId}:`, error); return null; }
}

async function admin_saveKnowledgeBase(guildId, key, value) {
    try {
        await pool.query(`INSERT INTO kv_store (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;`, [guildId, key, String(value)]);
        return true;
    } catch (error) {
        console.error(`[DATABASE] Failed to save knowledge base for key '${key}' in guild ${guildId}:`, error);
        return false;
    }
}


async function updateAndPersist(guildId, key, value) {
    try {
        if (value === null || value === undefined) {
            await pool.query('DELETE FROM kv_store WHERE guild_id = $1 AND key = $2', [guildId, key]);
        } else {
            await pool.query('INSERT INTO kv_store (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;', [guildId, key, serializeStoredValue(key, value)]);
        }
        const state = stateManager.getServerState(guildId);
        state[key] = value;
        return true;
    } catch (error) {
        console.error('[DATABASE] Failed to update and persist key', key, 'for guild', guildId, ':', error);
        return false;
    }
}

async function updateAndPersistKnowledge(guildId, topic, knowledgeText) {
    try {
        await pool.query('INSERT INTO kv_store (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;', [guildId, topic, String(knowledgeText)]);
        const state = stateManager.getServerState(guildId);
        state.knowledgeBase[topic] = knowledgeText;
        return true;
    } catch (error) {
        console.error('[DATABASE] Failed to update and persist knowledge for topic', topic, 'in guild', guildId, ':', error);
        return false;
    }
}


async function saveStateToDB(guildId, key, value) {
    try {
        if (value === null || value === undefined) {
            await pool.query('DELETE FROM kv_store WHERE guild_id = $1 AND key = $2', [guildId, key]);
            return;
        }
        await pool.query(`INSERT INTO kv_store (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;`, [guildId, key, serializeStoredValue(key, value)]);
    } catch (error) { console.error(`[DATABASE] Failed to save state key '${key}' for guild ${guildId}:`, error); }
}

async function deleteStateFromDB(guildId, key) {
    try {
        await pool.query('DELETE FROM kv_store WHERE guild_id = $1 AND key = $2', [guildId, key]);
    } catch (error) { console.error(`[DATABASE] Failed to delete state key '${key}' for guild ${guildId}:`, error); }
}

async function incrementCommandUsage(guildId, commandName) {
    try {
        await pool.query(`INSERT INTO command_stats (guild_id, command_name, uses) VALUES ($1, $2, 1) ON CONFLICT (guild_id, command_name) DO UPDATE SET uses = command_stats.uses + 1;`, [guildId, commandName]);
    } catch (error) { console.error(`[DATABASE] Failed to increment usage for ${commandName} in guild ${guildId}:`, error); }
}

async function resetCommandUsage(guildId) {
    try {
        await pool.query('DELETE FROM command_stats WHERE guild_id = $1', [guildId]);
    } catch (error) { console.error(`[DATABASE] Failed to reset usage stats for guild ${guildId}:`, error); }
}

async function saveQuestionToHistory(guildId, question) {
    try {
        await pool.query('INSERT INTO question_history (guild_id, question) VALUES ($1, $2)', [guildId, question]);
        await pool.query(
            `DELETE FROM question_history a USING (
                SELECT id FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC, id DESC OFFSET 50
             ) old WHERE a.id = old.id;`,
            [guildId]
        );
    } catch (error) { console.error(`[DATABASE] Failed to save question history for guild ${guildId}:`, error); }
}

module.exports = {
    updateAndPersist,
    updateAndPersistKnowledge,
    loadStateForGuild,
    getStateValue,
    batchUpdateScoresInDB,
    admin_setOrAddUserScore,
    admin_removeUserScore,
    admin_saveKnowledgeBase,
    saveStateToDB,
    deleteStateFromDB,
    incrementCommandUsage,
    resetCommandUsage,
    saveQuestionToHistory
};
