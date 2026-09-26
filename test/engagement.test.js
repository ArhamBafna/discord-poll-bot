// Unit tests for engagement service:
// - Verifies USER_COMMANDS and ADMIN_COMMANDS match active registry commands
// - Verifies no deprecated command names exist in command lists or descriptions
// - Verifies COMMAND_DESCRIPTIONS contains entries for all active commands
//
// Run: node --test test/engagement.test.js
const assert = require('node:assert');
const { USER_COMMANDS, ADMIN_COMMANDS, COMMAND_DESCRIPTIONS } = require('../services/engagement.js');
const { registry } = require('../commands/registry.js');

// 1. Verify commands match registry
const allRegistered = registry.map(c => c.builder.name);
const allEngagementCommands = [...USER_COMMANDS, ...ADMIN_COMMANDS];

for (const cmd of allEngagementCommands) {
    assert.ok(allRegistered.includes(cmd), `Engagement command '${cmd}' must exist in command registry`);
}

// 2. Verify consolidated commands are present
assert.ok(ADMIN_COMMANDS.includes('config'), 'ADMIN_COMMANDS includes config');
assert.ok(ADMIN_COMMANDS.includes('poll'), 'ADMIN_COMMANDS includes poll');

// 3. Verify deprecated command names are not present anywhere in engagement service
const deprecatedCommands = [
    'asknow',
    'resolve',
    'relinkpoll',
    'settings',
    'setwelcome',
    'setcc',
    'setcontrolrole',
    'invitepoints'
];

for (const dep of deprecatedCommands) {
    assert.ok(!USER_COMMANDS.includes(dep), `USER_COMMANDS must not include deprecated '${dep}'`);
    assert.ok(!ADMIN_COMMANDS.includes(dep), `ADMIN_COMMANDS must not include deprecated '${dep}'`);
    assert.strictEqual(COMMAND_DESCRIPTIONS[dep], undefined, `COMMAND_DESCRIPTIONS must not have deprecated '${dep}'`);
}

// 4. Verify all engagement commands have descriptions
for (const cmd of allEngagementCommands) {
    assert.ok(COMMAND_DESCRIPTIONS[cmd], `COMMAND_DESCRIPTIONS must have description for '${cmd}'`);
    assert.ok(COMMAND_DESCRIPTIONS[cmd].length > 0, `description for '${cmd}' is non-empty`);
}

console.log('engagement tests passed');
