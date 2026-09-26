// Unit tests for /help command handler and embed formatting:
// - Verifies embed contains all registered commands
// - Verifies consolidated commands (/config and /poll) display their subcommands hierarchy
// - Verifies admin tags and non-subcommand options
// - Verifies handleHelp replies with embed
//
// Run: node --test test/commands-help.test.js
const assert = require('node:assert');
const { registry } = require('../commands/registry.js');
const { buildHelpEmbed, formatCommandHelp, handleHelp } = require('../commands/user/help.js');

// 1. Build embed and check structure
const embed = buildHelpEmbed(registry);
assert.strictEqual(embed.data.title, 'Bot Commands');
assert.strictEqual(embed.data.description, 'Here are the available commands:');
assert.strictEqual(embed.data.fields.length, registry.length);

// Map fields by command name
const fieldMap = new Map();
for (const field of embed.data.fields) {
    fieldMap.set(field.name, field.value);
}

// 2. Verify non-admin commands
assert.ok(fieldMap.has('/leaderboard'), 'has /leaderboard field');
assert.ok(fieldMap.has('/rank'), 'has /rank field');
assert.ok(fieldMap.has('/help'), 'has /help field');

// /rank should display its parameter usage
const rankValue = fieldMap.get('/rank');
assert.ok(rankValue.includes('Usage: **/rank [user]**'), 'rank displays option usage');

// 3. Verify admin commands have (Admin) suffix
assert.ok(fieldMap.has('/config (Admin)'), 'has /config (Admin) field');
assert.ok(fieldMap.has('/poll (Admin)'), 'has /poll (Admin) field');
assert.ok(fieldMap.has('/points (Admin)'), 'has /points (Admin) field');
assert.ok(fieldMap.has('/knowledge (Admin)'), 'has /knowledge (Admin) field');
assert.ok(fieldMap.has('/milestones (Admin)'), 'has /milestones (Admin) field');

// 4. Verify /config subcommands in embed value
const configValue = fieldMap.get('/config (Admin)');
assert.ok(configValue.includes('/config view'), 'config has /config view');
assert.ok(configValue.includes('/config welcome <template>'), 'config has /config welcome <template>');
assert.ok(configValue.includes('/config cc <user>'), 'config has /config cc <user>');
assert.ok(configValue.includes('/config role <role>'), 'config has /config role <role>');
assert.ok(configValue.includes('/config invite-points <points>'), 'config has /config invite-points <points>');

// 5. Verify /poll subcommands in embed value
const pollValue = fieldMap.get('/poll (Admin)');
assert.ok(pollValue.includes('/poll ask [topic]'), 'poll has /poll ask [topic]');
assert.ok(pollValue.includes('/poll resolve <poll>'), 'poll has /poll resolve <poll>');
assert.ok(pollValue.includes('/poll relink <message_id> <correct_option>'), 'poll has /poll relink <message_id> <correct_option>');

// 6. Verify deprecated command names are NOT present in any fields
const deprecatedCommands = ['asknow', 'relinkpoll', 'settings', 'setwelcome', 'setcc', 'setcontrolrole', 'invitepoints'];
for (const field of embed.data.fields) {
    for (const dep of deprecatedCommands) {
        assert.ok(!field.name.includes(dep), `field name ${field.name} must not contain deprecated command ${dep}`);
        assert.ok(!field.value.includes(`/${dep}`), `field value must not contain /${dep}`);
    }
}

// 7. Verify handleHelp executes interaction.reply
let repliedWith = null;
const mockInteraction = {
    reply: async (payload) => {
        repliedWith = payload;
    }
};

handleHelp(mockInteraction).then(() => {
    assert.ok(repliedWith, 'handleHelp called reply');
    assert.ok(repliedWith.embeds && repliedWith.embeds.length === 1, 'replied with 1 embed');
    assert.strictEqual(repliedWith.embeds[0].data.title, 'Bot Commands');
    console.log('commands-help tests passed');
});
