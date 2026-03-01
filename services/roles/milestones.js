const stateManager = require('../../state/manager');

/**
 * Checks if a user has reached a milestone and assigns the corresponding role.
 * Replaces old milestone roles with the new one (Highest Only).
 */
async function checkAndAssignMilestoneRole(member, score, channel = null) {
    if (!member || !member.guild) return;
    const guildId = member.guild.id;
    const state = stateManager.getServerState(guildId);
    const milestones = state.roleMilestones;

    if (!milestones || Object.keys(milestones).length === 0) return;

    // 1. Find all milestones reached
    const reachedMilestonePoints = Object.keys(milestones)
        .map(Number)
        .filter(pts => score >= pts)
        .sort((a, b) => b - a); // Highest first

    if (reachedMilestonePoints.length === 0) return;

    const highestMilestonePoints = reachedMilestonePoints[0];
    const targetRoleId = milestones[highestMilestonePoints];

    // 2. Check if the user already has the highest role and NO other milestone roles
    const allMilestoneRoleIds = Object.values(milestones);
    const currentMilestoneRoles = member.roles.cache.filter(role => allMilestoneRoleIds.includes(role.id));
    
    // If they already have EXACTLY the right role and nothing else, skip.
    if (currentMilestoneRoles.size === 1 && currentMilestoneRoles.has(targetRoleId)) return;

    try {
        // 3. Identify roles to remove (Replace mode)
        const rolesToRemove = currentMilestoneRoles.filter(role => role.id !== targetRoleId);
        
        if (rolesToRemove.size > 0) {
            await member.roles.remove(rolesToRemove, 'Replaced by higher AI milestone role');
        }

        // 4. Add the new role if they don't have it
        if (!member.roles.cache.has(targetRoleId)) {
            const targetRole = await member.guild.roles.fetch(targetRoleId);
            if (targetRole) {
                await member.roles.add(targetRole, `Reached AI milestone: ${highestMilestonePoints} points`);
                
                // 5. Public Announcement (only if points were just earned, not during startup sync)
                if (channel) {
                    await channel.send(`🎉 **Congratulations <@${member.id}>!** You've reached the **${highestMilestonePoints} points** milestone and earned the **${targetRole.name}** role! 🚀`);
                }
            }
        }
    } catch (error) {
        console.error(`[ROLES][${guildId}] Failed to update roles for user ${member.id}:`, error);
    }
}

/**
 * Syncs all members in a guild to ensure their roles match their current points.
 */
async function syncAllMilestoneRoles(guild, state) {
    if (!guild) return;
    const milestones = state.roleMilestones;
    if (!milestones || Object.keys(milestones).length === 0) return;

    console.log(`[ROLES][${guild.id}] Starting full milestone sync...`);
    const leaderboard = state.leaderboard;
    if (Object.keys(leaderboard).length === 0) return;

    // Fetch members in chunks to avoid memory spikes
    const members = await guild.members.fetch();

    let syncCount = 0;
    // Process in smaller batches to avoid hitting Discord rate limits too hard
    const entries = Object.entries(leaderboard);
    for (let i = 0; i < entries.length; i += 50) {
        const batch = entries.slice(i, i + 50);
        await Promise.all(batch.map(async ([userId, score]) => {
            const member = members.get(userId);
            if (member) {
                await checkAndAssignMilestoneRole(member, score);
                syncCount++;
            }
        }));
        // Small pause between batches if the leaderboard is huge
        if (entries.length > 100) await new Promise(r => setTimeout(r, 500));
    }
    console.log(`[ROLES][${guild.id}] Full sync complete. Processed ${syncCount} users.`);
}

module.exports = { checkAndAssignMilestoneRole, syncAllMilestoneRoles };
