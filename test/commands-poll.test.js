// Unit tests for /admin poll command handler
// Run: node --test test/commands-poll.test.js
const assert = require('node:assert');
const { handlePoll } = require('../commands/admin/poll.js');
const stateManager = require('../state/manager.js');
const dbOperations = require('../database/operations.js');

const GUILD_ID = 'guild-test-poll';
const state = stateManager.getServerState(GUILD_ID);

function createMockInteraction(subcommand, options = {}, channel = {}) {
    let replyPayload = null;
    let deferred = false;
    return {
        guild: { id: GUILD_ID },
        channel,
        user: { id: 'admin-user-id', username: 'TestAdmin' },
        options: {
            getSubcommand: () => subcommand,
            getString: (name) => options[name] ?? null,
            getInteger: (name) => options[name] ?? null,
        },
        deferReply: async (opts) => { deferred = true; return opts; },
        reply: async (payload) => { replyPayload = payload; return payload; },
        getReply: () => replyPayload,
        isDeferred: () => deferred
    };
}

async function runTests() {
    const originalDeleteState = dbOperations.deleteStateFromDB;
    const deleteCalls = [];
    dbOperations.deleteStateFromDB = async (guildId, key) => {
        deleteCalls.push({ guildId, key });
        state[key] = null;
        return true;
    };

    try {
        // 1. Resolve on-demand with no active poll
        {
            state.activeOnDemandPoll = null;
            const interaction = createMockInteraction('resolve', { poll: 'on-demand' });
            await handlePoll(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true);
            assert.ok(reply.content.includes('no active on-demand poll'));
        }

        // 2. Resolve on-demand with an active poll
        {
            state.activeOnDemandPoll = {
                question: 'What is deep learning?',
                options: ['Cooking recipe', 'Subset of machine learning', 'Rock band'],
                correctAnswerIndex: 1,
                explanation: 'Deep learning is neural network based ML.'
            };
            const interaction = createMockInteraction('resolve', { poll: 'on-demand' });
            await handlePoll(interaction);
            assert.strictEqual(state.activeOnDemandPoll, null, 'active poll cleared from state');
            assert.strictEqual(deleteCalls[deleteCalls.length - 1].key, 'activeOnDemandPoll');
            const reply = interaction.getReply();
            assert.ok(reply.embeds && reply.embeds.length === 1, 'replied with embed');
            const embed = reply.embeds[0].data;
            assert.strictEqual(embed.title, 'Answer & Explanation');
            assert.ok(embed.description.includes('What is deep learning?'));
            assert.strictEqual(embed.fields[0].name, 'Correct Answer');
            assert.ok(embed.fields[0].value.includes('B: Subset of machine learning'));
        }

        // 3. Resolve daily with no poll in memory
        {
            state.lastPollData = null;
            const interaction = createMockInteraction('resolve', { poll: 'daily' });
            await handlePoll(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true);
            assert.ok(reply.content.includes('no poll in memory'));
        }

        // 4. Resolve with invalid poll mode
        {
            const interaction = createMockInteraction('resolve', { poll: 'invalid-mode' });
            await handlePoll(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true);
            assert.ok(reply.content.includes('Invalid resolve poll type'));
        }

        // 5. Ask when on-demand poll already active
        {
            state.activeOnDemandPoll = { question: 'Existing poll' };
            const interaction = createMockInteraction('ask');
            await handlePoll(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true);
            assert.ok(reply.content.includes('already an active on-demand poll'));
        }

        // 6. Unknown subcommand
        {
            const interaction = createMockInteraction('unknown-subcommand');
            await handlePoll(interaction);
            const reply = interaction.getReply();
            assert.strictEqual(reply.ephemeral, true);
            assert.ok(reply.content.includes('Unknown subcommand'));
        }

        console.log('commands-poll tests passed');
    } finally {
        dbOperations.deleteStateFromDB = originalDeleteState;
    }
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});
