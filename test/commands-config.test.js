// Unit tests for /admin config command handler
// Run: node --test test/commands-config.test.js
const assert = require('node:assert');
const { handleConfig } = require('../commands/admin/config.js');
const stateManager = require('../state/manager.js');
const dbOperations = require('../database/operations.js');

const GUILD_ID = 'guild-test-config';
const state = stateManager.getServerState(GUILD_ID);

// Mock interaction helper
function createMockInteraction(subcommand, options = {}) {
    let replyPayload = null;
    return {
        guild: { id: GUILD_ID },
        user: { id: 'test-user-id', username: 'TestAdmin', toString: () => '<@test-user-id>' },
        options: {
            getSubcommand: () => subcommand,
            getString: (name) => options[name] ?? null,
            getInteger: (name) => options[name] ?? null,
            getUser: (name) => options[name] ?? null,
            getRole: (name) => options[name] ?? null,
        },
        reply: async (payload) => {
            replyPayload = payload;
            return payload;
        },
        getReply: () => replyPayload
    };
}

async function runTests() {
    // Save original updateAndPersist
    const originalUpdateAndPersist = dbOperations.updateAndPersist;
    const dbCalls = [];
    dbOperations.updateAndPersist = async (guildId, key, value) => {
        dbCalls.push({ guildId, key, value });
        state[key] = value;
        return true;
    };

    try {
        // 1. Test 'view' subcommand
        {
            state.inviteRewardPoints = 5;
            state.ccUser = 'user-123';
            state.controlRole = 'role-456';
            const interaction = createMockInteraction('view');
            await handleConfig(interaction);
            const reply = interaction.getReply();
            assert.ok(reply && reply.content, 'view returned reply content');
            assert.ok(reply.content.includes('OWGT Bot Configuration Overview'), 'overview header present');
            assert.ok(reply.content.includes('<@&role-456>'), 'control role rendered');
            assert.ok(reply.content.includes('<@user-123>'), 'cc user rendered');
            assert.ok(reply.content.includes('5 points'), 'invite points rendered');
        }

        // 2. Test 'welcome' subcommand
        {
            const template = 'Welcome {user} invited by {inviter}!';
            const interaction = createMockInteraction('welcome', { template });
            await handleConfig(interaction);
            assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'welcomeTemplate');
            assert.strictEqual(dbCalls[dbCalls.length - 1].value, template);
            const reply = interaction.getReply();
            assert.ok(reply.includes('Success! The welcome message template has been updated.'), 'welcome success message');
        }

        // 3. Test 'cc' subcommand
        {
            const targetUser = { id: 'target-999', username: 'TargetMod' };
            const interaction = createMockInteraction('cc', { user: targetUser });
            await handleConfig(interaction);
            assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'ccUser');
            assert.strictEqual(dbCalls[dbCalls.length - 1].value, 'target-999');
            const reply = interaction.getReply();
            assert.ok(reply.includes('TargetMod'), 'cc user reply includes username');
        }

        // 4. Test 'role' subcommand
        {
            const targetRole = { id: 'admin-role-888', name: 'ServerAdmin' };
            const interaction = createMockInteraction('role', { role: targetRole });
            await handleConfig(interaction);
            assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'controlRole');
            assert.strictEqual(dbCalls[dbCalls.length - 1].value, 'admin-role-888');
            const reply = interaction.getReply();
            assert.ok(reply.includes('ServerAdmin'), 'role reply includes role name');
        }

        // 5. Test 'invite-points' subcommand
        {
            const interaction = createMockInteraction('invite-points', { points: 10 });
            await handleConfig(interaction);
            assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'inviteRewardPoints');
            assert.strictEqual(dbCalls[dbCalls.length - 1].value, 10);
            const reply = interaction.getReply();
            assert.ok(reply.includes('10 points'), 'invite points reply includes count and plural unit');
        }

        // 6. Test unknown subcommand
        {
            const interaction = createMockInteraction('invalid-subcommand');
            await handleConfig(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true, 'unknown subcommand error is ephemeral');
            assert.ok(reply.content.includes('Unknown subcommand'), 'unknown subcommand error message');
        }

        console.log('commands-config tests passed');
    } finally {
        dbOperations.updateAndPersist = originalUpdateAndPersist;
    }
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
