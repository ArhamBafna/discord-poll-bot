// --- Database Operations ---
const pool = require('./connection');
const stateManager = require('../state/manager');

async function loadStateForGuild(guildId) {
    // console.log(`[STATE] Loading state from DB for server ${guildId}...`);
    const state = stateManager.getServerState(guildId);
    const client = await pool.connect();
    try {
        const leaderboardRes = await client.query('SELECT user_id, score FROM leaderboard WHERE guild_id = $1', [guildId]);
        state.leaderboard = {};
        leaderboardRes.rows.forEach(row => { state.leaderboard[row.user_id] = row.score; });

        const stateRes = await client.query("SELECT key, value FROM state WHERE guild_id = $1", [guildId]);
        state.lastPollData = null;
        state.activeOnDemandPoll = null;
        state.lastSuccessfulPoll = null;
        for (const row of stateRes.rows) {
            if (row.key === 'lastPollData') state.lastPollData = row.value;
            if (row.key === 'activeOnDemandPoll') state.activeOnDemandPoll = row.value;
            if (row.key === 'lastSuccessfulPoll') state.lastSuccessfulPoll = row.value;
        }

        const knowledgeRes = await client.query('SELECT key, value FROM knowledge_base WHERE guild_id = $1', [guildId]);
        state.knowledgeBase = {};
        knowledgeRes.rows.forEach(row => { state.knowledgeBase[row.key] = row.value; });

        // console.log(`[STATE] State loaded for guild ${guildId}.`);
    } catch (error) {
        console.error(`[STATE] CRITICAL ERROR loading state for server ${guildId}:`, error);
    } finally {
        client.release();
    }
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
        await pool.query(`INSERT INTO knowledge_base (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;`, [guildId, key, value]);
        return true;
    } catch (error) {
        console.error(`[DATABASE] Failed to save knowledge base for key '${key}' in guild ${guildId}:`, error);
        return false;
    }
}

async function saveStateToDB(guildId, key, value) {
    try {
        await pool.query(`INSERT INTO state (guild_id, key, value) VALUES ($1, $2, $3) ON CONFLICT (guild_id, key) DO UPDATE SET value = $3;`, [guildId, key, JSON.stringify(value)]);
    } catch (error) { console.error(`[DATABASE] Failed to save state key '${key}' for guild ${guildId}:`, error); }
}

async function deleteStateFromDB(guildId, key) {
    try {
        await pool.query('DELETE FROM state WHERE guild_id = $1 AND key = $2', [guildId, key]);
    } catch (error) { console.error(`[DATABASE] Failed to delete state key '${key}' for guild ${guildId}:`, error); }
}

async function saveQuestionToHistory(guildId, question) {
    try {
        await pool.query('INSERT INTO question_history (guild_id, question) VALUES ($1, $2)', [guildId, question]);
        await pool.query(`DELETE FROM question_history WHERE guild_id = $1 AND id NOT IN (SELECT id FROM question_history WHERE guild_id = $1 ORDER BY created_at DESC LIMIT 50);`, [guildId]);
    } catch (error) { console.error(`[DATABASE] Failed to save question history for guild ${guildId}:`, error); }
}

module.exports = {
    loadStateForGuild,
    batchUpdateScoresInDB,
    admin_setOrAddUserScore,
    admin_removeUserScore,
    admin_saveKnowledgeBase,
    saveStateToDB,
    deleteStateFromDB,
    saveQuestionToHistory
};
