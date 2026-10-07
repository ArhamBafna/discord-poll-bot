// Tests for the restart catch-up pass (services/polls/scheduling.js):
// - generation is LAZY: a restart where every channel already posted today must cost zero AI calls
// - a poll is generated once and reused for every needy channel
// - a generation failure is contained: logged, no post attempted, process stays up
// - before 6 AM NY nothing happens at all
//
// Run: node --test test/catch-up.test.js
const assert = require('node:assert');

// Must be set before config/scheduling are required

const stateManager = require('../state/manager');
const dbOperations = require('../database/operations');
const posting = require('../services/polls/posting');
const { checkForMissedPolls } = require('../services/polls/scheduling');

// 2026-09-27T14:00:00Z is 10:00 in New York, i.e. after the 6 AM gate.
const AFTER_GATE_ISO = '2026-09-27T14:00:00.000Z';
// 2026-09-27T03:00:00Z is 23:00 on 09-26 in New York, i.e. before the 6 AM gate.
const BEFORE_GATE_ISO = '2026-09-27T03:00:00.000Z';
const YESTERDAY_ISO = '2026-09-26T14:00:00.000Z';

const RealDate = Date;
function withFakeClock(iso, fn) {
    class FakeDate extends RealDate {
        constructor(...args) {
            if (args.length === 0) { super(iso); } else { super(...args); }
        }
        static now() { return new RealDate(iso).getTime(); }
    }
    globalThis.Date = FakeDate;
    return Promise.resolve().then(fn).finally(() => { globalThis.Date = RealDate; });
}

const fakeChannel = (channelId) => ({
    id: channelId,
    name: `channel-${channelId}`,
    guild: { id: `guild-${channelId}` },
    send: async () => ({ id: 'posted-1' }),
    messages: { fetch: async () => { throw new Error('no prior poll to resolve'); } }
});

const fakeClient = {
    channels: { fetch: async (id) => fakeChannel(id) },
    guilds: {
        cache: new Map([
            ['guild-111', { id: 'guild-111' }],
            ['guild-222', { id: 'guild-222' }]
        ])
    }
};

// Counting stub for generation, swapped in per scenario.
let generationCalls = 0;
let generationImpl = null;

const originalLoadState = dbOperations.loadStateForGuild;
const originalGetState = stateManager.getServerState;
const originalGenerate = posting.getOrGenerateDailyPoll;
const originalGetServer = stateManager.serverStateCache;

dbOperations.loadStateForGuild = async () => {};
posting.getOrGenerateDailyPoll = async (...args) => {
    generationCalls++;
    return generationImpl(...args);
};

function statesByGuild(map) {
    stateManager.getServerState = (guildId) => map[guildId];
    stateManager.serverStateCache = map;
}

// 1. Every channel already posted today -> zero generation calls, zero posts.
(async () => {
    generationCalls = 0;
    generationImpl = async () => { throw new Error('should never be called'); };
    statesByGuild({
        'guild-111': { pollChannel: '111', lastPollData: { createdAt: AFTER_GATE_ISO } },
        'guild-222': { pollChannel: '222', lastPollData: { createdAt: AFTER_GATE_ISO } }
    });

    await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
    assert.strictEqual(generationCalls, 0, 'no AI generation when every channel is already current');
    console.log('ok - no generation when all channels current');
})()

// 2. Both channels behind -> generated exactly once and shared.
.then(async () => {
    generationCalls = 0;
    generationImpl = async () => ({ question: 'Q?', options: ['a', 'b'], type: 'trivia', kind: 'AI' });
    statesByGuild({
        'guild-111': { pollChannel: '111', lastPollData: { createdAt: YESTERDAY_ISO } },
        'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
    });

    await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
    assert.strictEqual(generationCalls, 1, 'poll generated once and reused across needy channels');
    console.log('ok - single generation reused across channels');
})

// 3. One channel current, one behind -> still only one generation (the current one is skipped).
.then(async () => {
    generationCalls = 0;
    generationImpl = async () => ({ question: 'Q?', options: ['a', 'b'], type: 'trivia', kind: 'AI' });
    statesByGuild({
        'guild-111': { pollChannel: '111', lastPollData: { createdAt: AFTER_GATE_ISO } },
        'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
    });

    await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
    assert.strictEqual(generationCalls, 1, 'only the channel behind triggers generation');
    console.log('ok - current channel skipped, behind channel generated once');
})

// 4. Generation throws -> contained, no rejection escapes, loop still finishes.
.then(async () => {
    generationCalls = 0;
    generationImpl = async () => { throw new Error('AI provider exploded'); };
    statesByGuild({
        'guild-111': { pollChannel: '111', lastPollData: { createdAt: YESTERDAY_ISO } },
        'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
    });

    await withFakeClock(AFTER_GATE_ISO, () => checkForMissedPolls(fakeClient));
    assert.strictEqual(generationCalls, 1, 'failed generation is not retried within the same run');
    console.log('ok - generation failure contained, no crash');
})

// 5. Restart before 6 AM NY -> no generation at all.
.then(async () => {
    generationCalls = 0;
    generationImpl = async () => { throw new Error('should never be called'); };
    statesByGuild({
        'guild-111': { pollChannel: '111', lastPollData: { createdAt: YESTERDAY_ISO } },
        'guild-222': { pollChannel: '222', lastPollData: { createdAt: YESTERDAY_ISO } }
    });

    await withFakeClock(BEFORE_GATE_ISO, () => checkForMissedPolls(fakeClient));
    assert.strictEqual(generationCalls, 0, 'before 6 AM NY nothing is generated');
    console.log('ok - before 6 AM gate respected');
})

.then(() => {
    dbOperations.loadStateForGuild = originalLoadState;
    stateManager.getServerState = originalGetState;
    stateManager.serverStateCache = originalGetServer;
    posting.getOrGenerateDailyPoll = originalGenerate;
    console.log('catch-up tests passed');
})
.catch((err) => {
    dbOperations.loadStateForGuild = originalLoadState;
    stateManager.getServerState = originalGetState;
    stateManager.serverStateCache = originalGetServer;
    posting.getOrGenerateDailyPoll = originalGenerate;
    console.error(err);
    process.exit(1);
});
