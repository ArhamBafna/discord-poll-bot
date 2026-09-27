// Unit tests for slash command registry:
// - Verifies consolidated commands exist and are admin-only
// - Verifies subcommands exist with correct options
// - Verifies deprecated top-level commands have been removed
//
// Run: node --test test/commands-registry.test.js
const assert = require('node:assert');
const { registry } = require('../commands/registry.js');

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

// The mention subcommand must offer exactly the three supported modes, and the role option
// stays optional because Discord cannot make it required for one mode only.
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

// 3. Deprecated top-level commands must not exist
const deprecatedNames = [
    'ask',
    'resolve',
    'relink',
    'config-view',
    'config-welcome',
    'config-cc',
    'config-role',
    'config-invite-points'
];
for (const dep of deprecatedNames) {
    const found = registry.find(c => c.builder.name === dep);
    assert.strictEqual(found, undefined, `deprecated command '${dep}' must not be in registry`);
}

// 4. Exact registry command set matches expectations
const registeredNames = registry.map(c => c.builder.name);
assert.deepStrictEqual(
    registeredNames.sort(),
    ['config', 'help', 'knowledge', 'leaderboard', 'milestones', 'points', 'poll', 'rank'].sort(),
    'registry contains exactly expected 8 commands'
);

console.log('commands-registry tests passed');
