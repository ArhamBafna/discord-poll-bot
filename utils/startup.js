const https = require('https');
const { log } = require('./logger');
const { DISCORD_BOT_TOKEN, applyNetworkDefaults, validateConfig } = require('../config');

function loginWithTimeout(discordClient, token, timeoutMs = 90000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject(new Error('Login timed out')); }, timeoutMs);
        timeout.unref();
        discordClient.login(token).then(r => { clearTimeout(timeout); resolve(r); }).catch(e => { clearTimeout(timeout); reject(e); });
    });
}

function testDiscordGateway() {
    return new Promise(resolve => {
        https.get('https://discord.com/api/v10/gateway', res => {
            log(`Discord gateway status: ${res.statusCode}`, 'NET');
            if (res.statusCode === 429) {
                log('Discord Gateway returned 429 (Too Many Requests). IP is likely rate-limited.', 'WARN');
            }
            resolve();
        }).on('error', err => {
            log(`Discord gateway unreachable: ${err.message}`, 'NET-ERROR');
            resolve();
        });
    });
}

async function startBot(discordClient) {
    applyNetworkDefaults();
    validateConfig();

    const MAX_RETRIES = 5;
    let attempt = 0;

    log('Starting bot initialization sequence...', 'STARTUP');
    await testDiscordGateway();

    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            log(`Attempting to log in (Attempt ${attempt}/${MAX_RETRIES})...`, 'DISCORD');
            const loginStartTime = Date.now();
            await loginWithTimeout(discordClient, DISCORD_BOT_TOKEN, 90000);
            const loginDuration = Date.now() - loginStartTime;
            log(`Login successful! Took ${loginDuration}ms.`, 'DISCORD');
            return;
        } catch (error) {
            log(`Login attempt ${attempt} failed: ${error.message}`, 'DISCORD-ERROR');

            const msg = error.message.toLowerCase();
            if (msg.includes('token') || msg.includes('intent') || msg.includes('disallowed')) {
                log('Discord login failed permanently. Reason: Invalid Token or Configuration.', 'FATAL');
                throw error;
            }

            if (attempt >= MAX_RETRIES) {
                log('Discord login failed permanently. Reason: Maximum retries reached. Network or Discord Gateway issues.', 'FATAL');
                log(`Last Error: ${error.message}`, 'FATAL');
                throw error;
            }

            const delays = [10000, 30000, 60000, 120000, 300000];
            const delay = delays[attempt - 1] || 300000;

            log(`Retrying in ${Math.round(delay / 1000)} seconds...`, 'DISCORD');
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = { startBot, loginWithTimeout, testDiscordGateway };
