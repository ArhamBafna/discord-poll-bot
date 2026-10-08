// Consolidated slash command tests: registry, help, config, poll, and knowledge handlers
const logger = require('../utils/logger');
logger.log = () => {};

const test = require('node:test');
const assert = require('node:assert');
const { registry } = require('../commands/registry.js');
const { buildHelpEmbed, handleHelp } = require('../commands/user/help.js');
const { handleConfig } = require('../commands/admin/config.js');
const { handlePoll } = require('../commands/admin/poll.js');
const { handleKnowledge } = require('../commands/admin/knowledge.js');
const { USER_COMMANDS, ADMIN_COMMANDS, COMMAND_DESCRIPTIONS } = require('../services/engagement.js');
const stateManager = require('../state/manager.js');
const dbOperations = require('../database/operations.js');

// Shared mock interaction helper
function createMockInteraction({ subcommand, guildId = 'guild-test', options = {}, channel = {}, user = { id: 'admin-user-id', username: 'TestAdmin', toString: () => '<@admin-user-id>' } } = {}) {
    let replyPayload = null;
    let modalPayload = null;
    let deferred = false;
    return {
        guild: { id: guildId },
        channel,
        user,
        options: {
            getSubcommand: () => subcommand,
            getString: (name) => options[name] ?? null,
            getInteger: (name) => options[name] ?? null,
            getUser: (name) => options[name] ?? null,
            getRole: (name) => options[name] ?? null,
        },
        deferReply: async (opts) => { deferred = true; return opts; },
        reply: async (payload) => { replyPayload = payload; return payload; },
        showModal: async (payload) => { modalPayload = payload; return payload; },
        getReply: () => replyPayload,
        getModal: () => modalPayload,
        isDeferred: () => deferred
    };
}

test('commands: registry and engagement structure', () => {
    // 1. Config command structure
    const configCmd = registry.find(c => c.builder.name === 'config');
    assert.ok(configCmd, 'config command is registered');
    assert.strictEqual(configCmd.adminOnly, true, 'config command is admin-only');
    const configJson = configCmd.builder.toJSON();
    const configSubcommands = configJson.options.map(opt => opt.name);
    assert.deepStrictEqual(
        configSubcommands.sort(),
        ['cc', 'invite-points', 'mention', 'role', 'view', 'welcome'].sort(),
        'config has correct subcommands'
    );

    const mentionSub = configJson.options.find(opt => opt.name === 'mention');
    assert.ok(mentionSub, 'config mention subcommand exists');
    const mentionMode = mentionSub.options.find(opt => opt.name === 'mode');
    assert.ok(mentionMode, 'config mention has a mode option');
    assert.strictEqual(mentionMode.required, true, 'mention mode is required');
    assert.deepStrictEqual(
        mentionMode.choices.map(c => c.value).sort(),
        ['everyone', 'none', 'role'].sort(),
        'mention mode offers exactly everyone, role and none'
    );
    const mentionRole = mentionSub.options.find(opt => opt.name === 'role');
    assert.ok(mentionRole, 'config mention has a role option');
    assert.strictEqual(mentionRole.type, 8, 'mention role option is a role picker');
    assert.notStrictEqual(mentionRole.required, true, 'mention role option stays optional');

    // 2. Poll command structure
    const pollCmd = registry.find(c => c.builder.name === 'poll');
    assert.ok(pollCmd, 'poll command is registered');
    assert.strictEqual(pollCmd.adminOnly, true, 'poll command is admin-only');
    const pollJson = pollCmd.builder.toJSON();
    const pollSubcommands = pollJson.options.map(opt => opt.name);
    assert.deepStrictEqual(
        pollSubcommands.sort(),
        ['ask', 'relink', 'resolve'].sort(),
        'poll has correct subcommands'
    );

    // 3. Exact registry command set matches expectations
    const registeredNames = registry.map(c => c.builder.name);
    assert.deepStrictEqual(
        registeredNames.sort(),
        ['config', 'help', 'knowledge', 'leaderboard', 'milestones', 'points', 'poll', 'rank', 'setpollchannel'].sort(),
        'registry contains exactly expected 9 commands'
    );

    // 4. Engagement service commands match registry and descriptions are complete
    const allEngagementCommands = [...USER_COMMANDS, ...ADMIN_COMMANDS];
    for (const cmd of allEngagementCommands) {
        assert.ok(registeredNames.includes(cmd), `Engagement command '${cmd}' must exist in command registry`);
        assert.ok(COMMAND_DESCRIPTIONS[cmd] && COMMAND_DESCRIPTIONS[cmd].length > 0, `COMMAND_DESCRIPTIONS must have non-empty description for '${cmd}'`);
    }
    assert.ok(ADMIN_COMMANDS.includes('config'), 'ADMIN_COMMANDS includes config');
    assert.ok(ADMIN_COMMANDS.includes('poll'), 'ADMIN_COMMANDS includes poll');
});

test('commands: help embed formatting', async () => {
    const embed = buildHelpEmbed(registry);
    assert.strictEqual(embed.data.title, 'Bot Commands');
    assert.strictEqual(embed.data.description, 'Here are the available commands:');
    assert.strictEqual(embed.data.fields.length, registry.length);

    const fieldMap = new Map();
    for (const field of embed.data.fields) {
        fieldMap.set(field.name, field.value);
    }

    assert.ok(fieldMap.has('/leaderboard'), 'has /leaderboard field');
    assert.ok(fieldMap.has('/rank'), 'has /rank field');
    assert.ok(fieldMap.has('/help'), 'has /help field');

    const rankValue = fieldMap.get('/rank');
    assert.ok(rankValue.includes('Usage: **/rank [user]**'), 'rank displays option usage');

    assert.ok(fieldMap.has('/config (Admin)'), 'has /config (Admin) field');
    assert.ok(fieldMap.has('/poll (Admin)'), 'has /poll (Admin) field');
    assert.ok(fieldMap.has('/points (Admin)'), 'has /points (Admin) field');
    assert.ok(fieldMap.has('/knowledge (Admin)'), 'has /knowledge (Admin) field');
    assert.ok(fieldMap.has('/milestones (Admin)'), 'has /milestones (Admin) field');

    const configValue = fieldMap.get('/config (Admin)');
    assert.ok(configValue.includes('/config view'), 'config has /config view');
    assert.ok(configValue.includes('/config welcome <template>'), 'config has /config welcome <template>');
    assert.ok(configValue.includes('/config cc <user>'), 'config has /config cc <user>');
    assert.ok(configValue.includes('/config role <role>'), 'config has /config role <role>');
    assert.ok(configValue.includes('/config invite-points <points>'), 'config has /config invite-points <points>');
    assert.ok(configValue.includes('/config mention <mode> [role]'), 'config has /config mention <mode> [role]');

    const pollValue = fieldMap.get('/poll (Admin)');
    assert.ok(pollValue.includes('/poll ask [topic]'), 'poll has /poll ask [topic]');
    assert.ok(pollValue.includes('/poll resolve <poll>'), 'poll has /poll resolve <poll>');
    assert.ok(pollValue.includes('/poll relink <message_id> <correct_option>'), 'poll has /poll relink <message_id> <correct_option>');

    const mockInteraction = createMockInteraction();
    await handleHelp(mockInteraction);
    const reply = mockInteraction.getReply();
    assert.ok(reply, 'handleHelp called reply');
    assert.ok(reply.embeds && reply.embeds.length === 1, 'replied with 1 embed');
    assert.strictEqual(reply.embeds[0].data.title, 'Bot Commands');
});

test('commands: config handler', async () => {
    const GUILD_ID = 'guild-test-config';
    const state = stateManager.getServerState(GUILD_ID);

    const originalUpdateAndPersist = dbOperations.updateAndPersist;
    const dbCalls = [];
    dbOperations.updateAndPersist = async (guildId, key, value) => {
        dbCalls.push({ guildId, key, value });
        state[key] = value;
        return true;
    };

    try {
        // view subcommand
        state.inviteRewardPoints = 5;
        state.ccUser = 'user-123';
        state.controlRole = 'role-456';
        const viewInteraction = createMockInteraction({ subcommand: 'view', guildId: GUILD_ID });
        await handleConfig(viewInteraction);
        const viewReply = viewInteraction.getReply();
        assert.ok(viewReply && viewReply.content, 'view returned reply content');
        assert.ok(viewReply.content.includes('OWGT Bot Configuration Overview'), 'overview header present');
        assert.ok(viewReply.content.includes('<@&role-456>'), 'control role rendered');
        assert.ok(viewReply.content.includes('<@user-123>'), 'cc user rendered');
        assert.ok(viewReply.content.includes('5 points'), 'invite points rendered');

        // welcome subcommand
        const template = 'Welcome {user} invited by {inviter}!';
        const welcomeInteraction = createMockInteraction({ subcommand: 'welcome', guildId: GUILD_ID, options: { template } });
        await handleConfig(welcomeInteraction);
        assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'welcomeTemplate');
        assert.strictEqual(dbCalls[dbCalls.length - 1].value, template);

        // cc subcommand
        const targetUser = { id: 'target-999', username: 'TargetMod' };
        const ccInteraction = createMockInteraction({ subcommand: 'cc', guildId: GUILD_ID, options: { user: targetUser } });
        await handleConfig(ccInteraction);
        assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'ccUser');
        assert.strictEqual(dbCalls[dbCalls.length - 1].value, 'target-999');

        // role subcommand
        const targetRole = { id: 'admin-role-888', name: 'ServerAdmin' };
        const roleInteraction = createMockInteraction({ subcommand: 'role', guildId: GUILD_ID, options: { role: targetRole } });
        await handleConfig(roleInteraction);
        assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'controlRole');
        assert.strictEqual(dbCalls[dbCalls.length - 1].value, 'admin-role-888');

        // invite-points subcommand
        const pointsInteraction = createMockInteraction({ subcommand: 'invite-points', guildId: GUILD_ID, options: { points: 10 } });
        await handleConfig(pointsInteraction);
        assert.strictEqual(dbCalls[dbCalls.length - 1].key, 'inviteRewardPoints');
        assert.strictEqual(dbCalls[dbCalls.length - 1].value, 10);

        // mention subcommand - everyone mode
        const everyoneInteraction = createMockInteraction({ subcommand: 'mention', guildId: GUILD_ID, options: { mode: 'everyone' } });
        await handleConfig(everyoneInteraction);
        assert.deepStrictEqual(dbCalls[dbCalls.length - 1].value, { mode: 'everyone', roleId: null });

        // mention subcommand - role mode
        const mentionRoleTarget = { id: 'poll-role-555', name: 'PollPings' };
        const mentionRoleInteraction = createMockInteraction({ subcommand: 'mention', guildId: GUILD_ID, options: { mode: 'role', role: mentionRoleTarget } });
        await handleConfig(mentionRoleInteraction);
        assert.deepStrictEqual(dbCalls[dbCalls.length - 1].value, { mode: 'role', roleId: 'poll-role-555' });

        // mention subcommand - role mode without a role is error
        const callsBefore = dbCalls.length;
        const missingRoleInteraction = createMockInteraction({ subcommand: 'mention', guildId: GUILD_ID, options: { mode: 'role', role: null } });
        await handleConfig(missingRoleInteraction);
        assert.strictEqual(missingRoleInteraction.getReply().ephemeral, true);
        assert.strictEqual(dbCalls.length, callsBefore, 'missing-role error persists nothing');

        // unknown subcommand
        const unknownInteraction = createMockInteraction({ subcommand: 'invalid-subcommand', guildId: GUILD_ID });
        await handleConfig(unknownInteraction);
        assert.strictEqual(unknownInteraction.getReply().ephemeral, true);
    } finally {
        dbOperations.updateAndPersist = originalUpdateAndPersist;
    }
});

test('commands: poll handler', async () => {
    const GUILD_ID = 'guild-test-poll';
    const state = stateManager.getServerState(GUILD_ID);

    const originalDeleteState = dbOperations.deleteStateFromDB;
    const deleteCalls = [];
    dbOperations.deleteStateFromDB = async (guildId, key) => {
        deleteCalls.push({ guildId, key });
        state[key] = null;
        return true;
    };

    try {
        // Resolve on-demand with no active poll
        state.activeOnDemandPoll = null;
        const noActiveInteraction = createMockInteraction({ subcommand: 'resolve', guildId: GUILD_ID, options: { poll: 'on-demand' } });
        await handlePoll(noActiveInteraction);
        assert.strictEqual(noActiveInteraction.getReply().ephemeral, true);

        // Resolve on-demand with active poll
        state.activeOnDemandPoll = {
            question: 'What is deep learning?',
            options: ['Cooking recipe', 'Subset of machine learning', 'Rock band'],
            correctAnswerIndex: 1,
            explanation: 'Deep learning is neural network based ML.'
        };
        const activeInteraction = createMockInteraction({ subcommand: 'resolve', guildId: GUILD_ID, options: { poll: 'on-demand' } });
        await handlePoll(activeInteraction);
        assert.strictEqual(state.activeOnDemandPoll, null);
        assert.strictEqual(deleteCalls[deleteCalls.length - 1].key, 'activeOnDemandPoll');
        assert.ok(activeInteraction.getReply().embeds.length === 1);

        // Resolve daily with no poll in memory
        state.lastPollData = null;
        const noDailyInteraction = createMockInteraction({ subcommand: 'resolve', guildId: GUILD_ID, options: { poll: 'daily' } });
        await handlePoll(noDailyInteraction);
        assert.strictEqual(noDailyInteraction.getReply().ephemeral, true);

        // Resolve with invalid poll mode
        const invalidModeInteraction = createMockInteraction({ subcommand: 'resolve', guildId: GUILD_ID, options: { poll: 'invalid-mode' } });
        await handlePoll(invalidModeInteraction);
        assert.strictEqual(invalidModeInteraction.getReply().ephemeral, true);

        // Ask when on-demand poll already active
        state.activeOnDemandPoll = { question: 'Existing poll' };
        const askActiveInteraction = createMockInteraction({ subcommand: 'ask', guildId: GUILD_ID });
        await handlePoll(askActiveInteraction);
        assert.strictEqual(askActiveInteraction.getReply().ephemeral, true);

        // Unknown subcommand
        const unknownInteraction = createMockInteraction({ subcommand: 'unknown-subcommand', guildId: GUILD_ID });
        await handlePoll(unknownInteraction);
        assert.strictEqual(unknownInteraction.getReply().ephemeral, true);
    } finally {
        dbOperations.deleteStateFromDB = originalDeleteState;
    }
});

test('commands: knowledge handler', async () => {
    const GUILD_ID = 'guild-test-knowledge';

    // Valid topic update shows modal
    const validUpdate = createMockInteraction({ subcommand: 'update', guildId: GUILD_ID, options: { topic: 'some-valid-topic' } });
    await handleKnowledge(validUpdate);
    assert.ok(validUpdate.getModal(), 'Modal returned for valid topic');
    assert.strictEqual(validUpdate.getModal().data.title, 'Update: some-valid-topic');

    // Settings keys refused on update
    const settingsUpdate = createMockInteraction({ subcommand: 'update', guildId: GUILD_ID, options: { topic: 'controlRole' } });
    await handleKnowledge(settingsUpdate);
    assert.strictEqual(settingsUpdate.getReply().ephemeral, true);
    assert.ok(settingsUpdate.getReply().content.includes('reserved bot setting'));

    // Settings keys refused on delete
    const settingsDelete = createMockInteraction({ subcommand: 'delete', guildId: GUILD_ID, options: { topic: 'controlRole' } });
    await handleKnowledge(settingsDelete);
    assert.strictEqual(settingsDelete.getReply().ephemeral, true);
    assert.ok(settingsDelete.getReply().content.includes('reserved bot setting'));

    // Valid topic delete returns message
    const validDelete = createMockInteraction({ subcommand: 'delete', guildId: GUILD_ID, options: { topic: 'some-valid-topic' } });
    await handleKnowledge(validDelete);
    assert.ok(validDelete.getReply().content.includes('not found'));
});
