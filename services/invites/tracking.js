// --- Invite Tracking Helper ---
const pool = require('../../database/connection');

// In-memory cache for server invites { guildId: { data: Map<inviteCode, uses>, expiresAt: number } }
const inviteCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes expiry

async function cacheAndSyncInvites(guild) {
    try {
        if (!guild.members.me.permissions.has('ManageGuild')) {
            console.log(`[INVITES] Missing 'Manage Server' permission in ${guild.name}. Skipping invite tracking.`);
            return;
        }

        const cached = inviteCache.get(guild.id);
        if (cached && cached.expiresAt > Date.now()) {
            // Already fresh
            return;
        }

        const invites = await guild.invites.fetch();
        try {
            // Collect valid invites
            const values = [];
            let queryParams = [];
            let i = 1;
            
            for (const inv of invites.values()) {
                if (inv.inviter) {
                    values.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
                    queryParams.push(guild.id, inv.code, inv.inviter.id, inv.uses);
                }
            }
            
            if (values.length > 0) {
                // Bulk upsert instead of delete-plus-loop
                const queryText = `
                    INSERT INTO invites (guild_id, code, inviter_id, uses) 
                    VALUES ${values.join(', ')} 
                    ON CONFLICT (guild_id, code) 
                    DO UPDATE SET uses = EXCLUDED.uses, inviter_id = EXCLUDED.inviter_id
                `;
                await pool.query(queryText, queryParams);
            }
        } catch (e) {
            throw e;
        }
        
        // Cache with expiry
        inviteCache.set(guild.id, {
            data: new Map(invites.map(inv => [inv.code, inv.uses])),
            expiresAt: Date.now() + CACHE_TTL_MS
        });
        
    } catch (err) {
        console.error(`[INVITES] Failed to sync invites for guild ${guild.name} (${guild.id}).`, err.message && err.message.includes('Missing Access') ? 'Missing Permissions.' : err);
    }
}

// Wrapper for existing getter
const exportedCache = {
    get: (guildId) => {
        const cached = inviteCache.get(guildId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        return null;
    },
    set: (guildId, data) => {
        inviteCache.set(guildId, {
            data,
            expiresAt: Date.now() + CACHE_TTL_MS
        });
    },
    delete: (guildId) => {
        inviteCache.delete(guildId);
    }
};

module.exports = {
    cacheAndSyncInvites,
    inviteCache: exportedCache
};
