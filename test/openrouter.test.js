// Regression test for OpenRouter endpoint export
// Run: node --test test/openrouter.test.js
const assert = require('node:assert');
const openrouter = require('../services/ai/openrouter');

assert.strictEqual(
    typeof openrouter.OPENROUTER_ENDPOINT,
    'string',
    'OPENROUTER_ENDPOINT must be exported as a string'
);

assert.doesNotThrow(
    () => new URL(openrouter.OPENROUTER_ENDPOINT),
    'OPENROUTER_ENDPOINT must be a valid parseable URL'
);

console.log('openrouter tests passed');
