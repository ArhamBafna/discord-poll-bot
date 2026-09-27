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

        // 6. Test 'mention' subcommand - everyone mode
        {
            const interaction = createMockInteraction('mention', { mode: 'everyone' });
            await handleConfig(interaction);
            const call = dbCalls[dbCalls.length - 1];
            assert.strictEqual(call.key, 'pollMention', 'mention persists under the pollMention key');
            assert.deepStrictEqual(call.value, { mode: 'everyone', roleId: null }, 'everyone mode stores no role id');
            const reply = interaction.getReply();
            assert.ok(reply.includes('Success!'), 'mention success message');
            assert.ok(reply.includes('@everyone'), 'mention reply confirms @everyone');
            assert.ok(reply.length < 80, 'mention confirmation stays to one short line');
        }

        // 7. Test 'mention' subcommand - role mode stores the role id
        {
            const targetRole = { id: 'poll-role-555', name: 'PollPings' };
            const interaction = createMockInteraction('mention', { mode: 'role', role: targetRole });
            await handleConfig(interaction);
            const call = dbCalls[dbCalls.length - 1];
            assert.strictEqual(call.key, 'pollMention', 'role mode persists under the pollMention key');
            assert.deepStrictEqual(call.value, { mode: 'role', roleId: 'poll-role-555' }, 'role mode stores the picked role id');
            assert.ok(interaction.getReply().includes('<@&poll-role-555>'), 'mention reply renders the role mention');
        }

        // 8. Test 'mention' subcommand - role mode without a role is an error and persists nothing
        {
            const callsBefore = dbCalls.length;
            const interaction = createMockInteraction('mention', { mode: 'role', role: null });
            await handleConfig(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true, 'missing-role error is ephemeral');
            assert.ok(reply.content.includes('role'), 'missing-role error names the role option');
            assert.strictEqual(dbCalls.length, callsBefore, 'missing-role error persists nothing');
        }

        // 9. Test 'mention' subcommand - a stray role in the picker is discarded
        {
            const strayRole = { id: 'stray-role-999', name: 'SomeOtherRole' };
            const interaction = createMockInteraction('mention', { mode: 'none', role: strayRole });
            await handleConfig(interaction);
            const call = dbCalls[dbCalls.length - 1];
            assert.deepStrictEqual(
                call.value,
                { mode: 'none', roleId: null },
                'a role supplied alongside a non-role mode is discarded, not stored'
            );
        }

        // 10. Test unknown subcommand
        {
            const interaction = createMockInteraction('invalid-subcommand');
            await handleConfig(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true, 'unknown subcommand error is ephemeral');
            assert.ok(reply.content.includes('Unknown subcommand'), 'unknown subcommand error message');
        }

        // 11. /config view surfaces the current poll ping
        {
            const originalMention = state.pollMention;

            state.pollMention = { mode: 'role', roleId: 'poll-role-555' };
            const roleView = createMockInteraction('view');
            await handleConfig(roleView);
            assert.ok(roleView.getReply().content.includes('Poll Ping'), 'view shows a Poll Ping line');
            assert.ok(roleView.getReply().content.includes('<@&poll-role-555>'), 'view renders the configured role');

            state.pollMention = { mode: 'everyone' };
            const everyoneView = createMockInteraction('view');
            await handleConfig(everyoneView);
            assert.ok(everyoneView.getReply().content.includes('@everyone'), 'view renders @everyone');

            state.pollMention = { mode: 'none' };
            const noneView = createMockInteraction('view');
            await handleConfig(noneView);
            assert.ok(noneView.getReply().content.includes('Off'), 'view renders Off for no ping');

            state.pollMention = null;
            const unsetView = createMockInteraction('view');
            await handleConfig(unsetView);
            assert.ok(unsetView.getReply().content.includes('Off'), 'view renders Off when never configured');

            state.pollMention = originalMention;
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
