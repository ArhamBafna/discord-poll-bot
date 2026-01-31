// --- Database Initialization ---
const pool = require('./connection');

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS leaderboard (guild_id VARCHAR(255) NOT NULL, user_id VARCHAR(255) NOT NULL, score INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id));`);
        await client.query(`CREATE TABLE IF NOT EXISTS state (guild_id VARCHAR(255) NOT NULL, key VARCHAR(255) NOT NULL, value JSONB, PRIMARY KEY (guild_id, key));`);
        await client.query(`CREATE TABLE IF NOT EXISTS question_history (id SERIAL PRIMARY KEY, guild_id VARCHAR(255) NOT NULL, question TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS knowledge_base (guild_id VARCHAR(255) NOT NULL, key VARCHAR(255) NOT NULL, value TEXT NOT NULL, PRIMARY KEY (guild_id, key));`);
        await client.query(`CREATE TABLE IF NOT EXISTS invites (guild_id VARCHAR(255) NOT NULL, code VARCHAR(255) NOT NULL, inviter_id VARCHAR(255) NOT NULL, uses INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, code));`);
        console.log('[DATABASE] All tables are set up for multi-server support.');
    } catch (error) {
        console.error('[DATABASE] CRITICAL ERROR: Failed to initialize database.', error);
        process.exit(1);
    } finally {
        client.release();
    }
}

module.exports = { initializeDatabase };
