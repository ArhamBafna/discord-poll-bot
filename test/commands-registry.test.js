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
    ['cc', 'invite-points', 'role', 'view', 'welcome'].sort(),
    'config has correct subcommands'
);

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

console.log('commands-registry tests passed');
