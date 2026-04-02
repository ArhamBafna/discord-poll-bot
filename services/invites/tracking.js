// --- Invite Tracking Helper ---
const pool = require('../../database/connection');

// In-memory cache for server invites { guildId: Map<inviteCode, uses> }
const inviteCache = new Map();

async function cacheAndSyncInvites(guild) {
    try {
        if (!guild.members.me.permissions.has('ManageGuild')) {
            console.log(`[INVITES] Missing 'Manage Server' permission in ${guild.name}. Skipping invite tracking.`);
            return;
        }
        const invites = await guild.invites.fetch();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Clear old invites for this guild to handle deletions that happened while offline
            await client.query('DELETE FROM invites WHERE guild_id = $1', [guild.id]);
            for (const inv of invites.values()) {
                if (inv.inviter) {
                    await client.query(
                        `INSERT INTO invites (guild_id, code, inviter_id, uses) VALUES ($1, $2, $3, $4)`,
                        [guild.id, inv.code, inv.inviter.id, inv.uses]
                    );
                }
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        inviteCache.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
        // console.log(`[INVITES] Synced and cached ${invites.size} invites for guild ${guild.name}.`);
    } catch (err) {
        console.error(`[INVITES] Failed to sync invites for guild ${guild.name} (${guild.id}).`, err.message.includes('Missing Access') ? 'Missing Permissions.' : err);
    }
}

module.exports = {
    cacheAndSyncInvites,
    inviteCache
};
