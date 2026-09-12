// Tests verify the startup module's public contract:
// - startBot is a function
// - loginWithTimeout is a function
// - startBot calls validateConfig which throws on missing env (tested in config.test.js)
//
// Run: node --test test/startup.test.js
const assert = require('node:assert');
const { startBot, loginWithTimeout } = require('../utils/startup.js');

// startBot is a function
assert.strictEqual(typeof startBot, 'function', 'startBot is exported');

// loginWithTimeout is a function
assert.strictEqual(typeof loginWithTimeout, 'function', 'loginWithTimeout is exported');

// testDiscordGateway is a function
const { testDiscordGateway } = require('../utils/startup.js');
assert.strictEqual(typeof testDiscordGateway, 'function', 'testDiscordGateway is exported');

console.log('startup tests passed');
