// --- Poll Mention Resolution ---
// One shared resolver for the configurable poll ping. Every post that can carry a ping
// (daily poll, weekly leaderboard, on-demand poll) goes through this, so the rule cannot be
// changed on one post and forgotten on another.
const { PermissionFlagsBits } = require('discord.js');

const POLL_MENTION_MODES = { EVERYONE: 'everyone', ROLE: 'role', NONE: 'none' };

// Guild id for log context. Optional chaining throughout, because these helpers also run
// against partial channel objects before a post has been fully validated.
function guildIdOf(channel) {
    return channel?.guild?.id || 'unknown';
}

/**
 * Whether the bot is known to be allowed to ping @everyone in this channel.
 *
 * Only a positive "no" degrades the ping, and that is deliberate. Discord downgrades a
 * disallowed @everyone to plain text rather than rejecting the message, so a wrong guess
 * here costs nothing either way -- but assuming the worst would silently cost admins a
 * working ping the first time the permission lookup came back empty.
 */
function canMentionEveryone(channel) {
    const perms = channel?.permissionsFor?.(channel.guild?.members?.me);
    if (perms?.has(PermissionFlagsBits.MentionEveryone) === false) {
        console.warn(`[MENTION][${guildIdOf(channel)}] Bot lacks Mention Everyone here. Posting the poll without a ping. Grant the permission to restore it.`);
        return false;
    }
    return true;
}

/**
 * Resolves a guild's pollMention setting into the string to prefix onto a poll, or '' for a
 * silent post.
 *
 * A setting that cannot produce a real mention degrades to a silent post and a log warning.
 * The stored setting is never cleared: restoring the role or the permission brings the ping
 * back without the admin having to reconfigure anything. Auto-clearing would hide the fact
 * that something is wrong.
 *
 * @param {object} state The guild's server state.
 * @param {object} channel The channel the poll will be posted to.
 * @returns {string} The mention prefix, or '' for no ping.
 */
function resolvePollMention(state, channel) {
    const setting = state ? state.pollMention : null;
    if (!setting || typeof setting !== 'object') return '';

    if (setting.mode === POLL_MENTION_MODES.EVERYONE) {
        return canMentionEveryone(channel) ? '@everyone' : '';
    }

    if (setting.mode === POLL_MENTION_MODES.ROLE) {
        if (!setting.roleId) {
            console.warn(`[MENTION][${guildIdOf(channel)}] Poll mention is set to a role but no role id was stored. Posting without a ping.`);
            return '';
        }
        // Unlike the permission check this one must positively confirm the role exists: the
        // failure mode of guessing wrong is a visible broken tag in the message itself.
        const role = channel?.guild?.roles?.cache?.get(setting.roleId);
        if (!role) {
            console.warn(`[MENTION][${guildIdOf(channel)}] Configured ping role ${setting.roleId} no longer exists. Posting without a ping. Re-run /config mention to choose another.`);
            return '';
        }
        return `<@&${setting.roleId}>`;
    }

    return '';
}

/**
 * Prefixes a mention onto a message body. Used by every post that can carry a ping, so a
 * silent poll keeps its text byte-for-byte with no leftover separator, and a mentioned one
 * gets exactly one space, at every call site.
 *
 * @param {string} text The message body.
 * @param {string} mention The mention prefix, or '' for none.
 * @returns {string} The body, with the mention prefixed when there is one.
 */
function applyPollMention(text, mention) {
    return mention ? `${mention} ${text}` : text;
}

/**
 * Human-readable form of a stored setting, for /config view and the change confirmation.
 * Takes the setting itself rather than the whole state, because that is all it needs.
 *
 * @param {object} setting The stored pollMention value.
 * @returns {string} What a reader would see, or 'Off'.
 */
function describePollMention(setting) {
    if (!setting || typeof setting !== 'object') return 'Off';
    if (setting.mode === POLL_MENTION_MODES.EVERYONE) return '@everyone';
    if (setting.mode === POLL_MENTION_MODES.ROLE) return setting.roleId ? `<@&${setting.roleId}>` : 'Off';
    return 'Off';
}

module.exports = { POLL_MENTION_MODES, resolvePollMention, applyPollMention, describePollMention };
