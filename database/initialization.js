const pool = require('./connection');
const { log } = require('../utils/logger');

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`CREATE TABLE IF NOT EXISTS leaderboard (guild_id VARCHAR(255) NOT NULL, user_id VARCHAR(255) NOT NULL, score INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id));`);
        await client.query(`CREATE TABLE IF NOT EXISTS kv_store (guild_id VARCHAR(255) NOT NULL, key VARCHAR(255) NOT NULL, value TEXT NOT NULL, PRIMARY KEY (guild_id, key));`);
        await client.query(`CREATE TABLE IF NOT EXISTS question_history (id SERIAL PRIMARY KEY, guild_id VARCHAR(255) NOT NULL, question TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
        await client.query(`CREATE TABLE IF NOT EXISTS invites (guild_id VARCHAR(255) NOT NULL, code VARCHAR(255) NOT NULL, inviter_id VARCHAR(255) NOT NULL, uses INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, code));`);
        await client.query(`CREATE TABLE IF NOT EXISTS command_stats (guild_id VARCHAR(255) NOT NULL, command_name VARCHAR(255) NOT NULL, uses INT NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, command_name));`);
        log('All tables are set up for multi-server support.', 'DATABASE');
    } catch (error) {
        log('Failed to initialize database.', 'ERROR');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { initializeDatabase };
