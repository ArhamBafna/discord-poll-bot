// --- Invite Tracking Event Handlers ---
const pool = require('../database/connection');
const { inviteCache, cacheAndSyncInvites } = require('../services/invites/tracking');
const { ALLOWED_USERNAME } = require('../config');
const dbOperations = require('../database/operations');

async function handleGuildCreate(guild) {
    await cacheAndSyncInvites(guild);
}

async function handleInviteCreate(invite, discordClient) {
    try {
        const guildInvites = inviteCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.set(invite.code, invite.uses);
        }
        await pool.query(
            `INSERT INTO invites (guild_id, code, inviter_id, uses) VALUES ($1, $2, $3, $4) ON CONFLICT (guild_id, code) DO NOTHING`,
            [invite.guild.id, invite.code, invite.inviter.id, invite.uses]
        );
    } catch (err) {
        console.error(`[INVITES] Error in inviteCreate event for guild ${invite.guild.id}:`, err);
    }
}

async function handleInviteDelete(invite) {
    try {
        const guildInvites = inviteCache.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.delete(invite.code);
        }
        await pool.query('DELETE FROM invites WHERE guild_id = $1 AND code = $2', [invite.guild.id, invite.code]);
    } catch (err) {
        console.error(`[INVITES] Error in inviteDelete event for guild ${invite.guild.id}:`, err);
    }
}

async function handleGuildMemberAdd(member, discordClient) {
    try {
        const cachedInvites = inviteCache.get(member.guild.id);
        if (!cachedInvites) {
            return;
        }

        const newInvites = await member.guild.invites.fetch();
        const usedInvite = newInvites.find(inv => inv.uses > (cachedInvites.get(inv.code) || 0));

        inviteCache.set(member.guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

        const welcomeChannel = member.guild.systemChannel;
        if (!welcomeChannel || !welcomeChannel.permissionsFor(member.guild.members.me).has('SendMessages')) {
            return;
        }

        const arHimUser = member.guild.members.cache.find(m => m.user.username === ALLOWED_USERNAME) || (await member.guild.members.fetch()).find(m => m.user.username === ALLOWED_USERNAME);
        let welcomeMessage = `welcome to the server, ${member}!`;
        let inviter = null;

        if (usedInvite && usedInvite.inviter) {
            inviter = await discordClient.users.fetch(usedInvite.inviter.id).catch(() => null);
            if (inviter) {
                welcomeMessage += ` you were invited by ${inviter}.`;
                if (inviter.username !== 'mr.democracy._29458') {
                    const newScore = await dbOperations.admin_setOrAddUserScore(member.guild.id, inviter.id, 1, 'add');
                    if (newScore !== null) {
                        welcomeMessage += ` i added a point to ${inviter}'s score for the invite!`;
                    }
                }
            }
            await pool.query(
                `UPDATE invites SET uses = $1 WHERE guild_id = $2 AND code = $3`,
                [usedInvite.uses, member.guild.id, usedInvite.code]
            ).catch(err => console.error(`[INVITES_DB] Failed to update uses for invite ${usedInvite.code}`, err));
        } else {
            welcomeMessage += " i couldn't figure out who invited you, but we're glad you're here.";
        }

        if (arHimUser) {
            welcomeMessage += ` (cc ${arHimUser})`;
        }

        await welcomeChannel.send(welcomeMessage);

    } catch (err) {
        console.error(`[INVITES] Error in guildMemberAdd event for guild ${member.guild.id}:`, err);
    }
}

module.exports = {
    handleGuildCreate,
    handleInviteCreate,
    handleInviteDelete,
    handleGuildMemberAdd
};
