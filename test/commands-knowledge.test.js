const assert = require('node:assert');
const { handleKnowledge } = require('../commands/admin/knowledge.js');
const stateManager = require('../state/manager.js');

const GUILD_ID = 'guild-test-knowledge';

// Initialize the state so we can add dummy topics
const state = stateManager.getServerState(GUILD_ID);

function createMockInteraction(subcommand, options = {}) {
    let replyPayload = null;
    let modalPayload = null;
    return {
        guild: { id: GUILD_ID },
        options: {
            getSubcommand: () => subcommand,
            getString: (name) => options[name] ?? null,
        },
        reply: async (payload) => {
            replyPayload = payload;
            return payload;
        },
        showModal: async (payload) => {
            modalPayload = payload;
            return payload;
        },
        getReply: () => replyPayload,
        getModal: () => modalPayload
    };
}

// 1. Valid topics are allowed to show the update modal
(async function testValidTopicUpdate() {
    const interaction = createMockInteraction('update', { topic: 'some-valid-topic' });
    await handleKnowledge(interaction);
    const modal = interaction.getModal();
    assert.ok(modal, 'Modal should be returned for a valid topic');
    assert.strictEqual(modal.data.title, 'Update: some-valid-topic');
})();

// 2. Settings keys are refused on update
(async function testSettingsKeyUpdateRefused() {
    const interaction = createMockInteraction('update', { topic: 'controlRole' });
    await handleKnowledge(interaction);
    const reply = interaction.getReply();
    assert.ok(reply, 'Reply should be returned');
    assert.strictEqual(reply.ephemeral, true, 'Refusal should be ephemeral');
    assert.ok(reply.content.includes('reserved bot setting'), 'Reply should mention reserved bot setting');
})();

// 3. Settings keys are refused on delete
(async function testSettingsKeyDeleteRefused() {
    const interaction = createMockInteraction('delete', { topic: 'controlRole' });
    await handleKnowledge(interaction);
    const reply = interaction.getReply();
    assert.ok(reply, 'Reply should be returned');
    assert.strictEqual(reply.ephemeral, true, 'Refusal should be ephemeral');
    assert.ok(reply.content.includes('reserved bot setting'), 'Reply should mention reserved bot setting');
})();

// 4. Valid topics can be deleted (or at least return "not found" if not created)
(async function testValidTopicDelete() {
    const interaction = createMockInteraction('delete', { topic: 'some-valid-topic' });
    await handleKnowledge(interaction);
    const reply = interaction.getReply();
    assert.ok(reply, 'Reply should be returned');
    assert.strictEqual(reply.ephemeral, undefined, 'Ordinary missing topic reply is not ephemeral');
    assert.ok(reply.content.includes('not found'), 'Should say topic not found');
})();

console.log('commands-knowledge tests passed');
