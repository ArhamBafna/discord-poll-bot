// --- Bot Startup & Login Logic ---
const https = require('https');
const { log } = require('./logger');
const { DISCORD_BOT_TOKEN } = require('../config');

function loginWithTimeout(discordClient, token, timeoutMs = 90000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => { reject(new Error('Login timed out')); }, timeoutMs);
        discordClient.login(token).then(r => { clearTimeout(timeout); resolve(r); }).catch(e => { clearTimeout(timeout); reject(e); });
    });
}

function testDiscordGateway() {
    return new Promise(resolve => {
        https.get('https://discord.com/api/v10/gateway', res => {
            log(`Discord gateway status: ${res.statusCode}`, 'NET');
            if (res.statusCode === 429) {
                log('WARNING: Discord Gateway returned 429 (Too Many Requests). Your IP is likely rate-limited.', 'WARN');
            }
            resolve();
        }).on('error', err => {
            log(`Discord gateway unreachable: ${err.message}`, 'NET-ERROR');
            resolve();
        });
    });
}

// --- Start Health Check & Login ---
async function startBot(discordClient, keepAlive) {
    keepAlive();

    // Reduced retries to 5, with steeper backoff
    const MAX_RETRIES = 5;
    let attempt = 0;

    log('Starting bot initialization sequence...', 'STARTUP');
    await testDiscordGateway(); // Test connectivity before starting

    while (attempt < MAX_RETRIES) {
        try {
            attempt++;
            log(`Attempting to log in (Attempt ${attempt}/${MAX_RETRIES})...`, 'DISCORD');
            const loginStartTime = Date.now();
            await loginWithTimeout(discordClient, DISCORD_BOT_TOKEN, 90000); // 90s timeout
            const loginDuration = Date.now() - loginStartTime;
            log(`Login successful! Took ${loginDuration}ms.`, 'DISCORD');
            return; // Exit function on success
        } catch (error) {
            log(`Login attempt ${attempt} failed: ${error.message}`, 'DISCORD-ERROR');

            // Check for unrecoverable errors
            const msg = error.message.toLowerCase();
            if (msg.includes('token') || msg.includes('intent') || msg.includes('disallowed')) {
                log('--- !!! DISCORD LOGIN FAILED PERMANENTLY !!! ---', 'FATAL');
                log('REASON: Invalid Token or Configuration.', 'FATAL');
                console.error(error);
                process.exit(1);
            }

            if (attempt >= MAX_RETRIES) {
                log('--- !!! DISCORD LOGIN FAILED PERMANENTLY !!! ---', 'FATAL');
                log('REASON: Maximum retries reached. Network or Discord Gateway issues.', 'FATAL');
                log(`Last Error: ${error.message}`, 'FATAL');
                console.error(error); // Full trace
                process.exit(1);
            }

            // Custom Backoff Schedule: 10s, 30s, 60s, 120s, 300s
            const delays = [10000, 30000, 60000, 120000, 300000];
            const delay = delays[attempt - 1] || 300000; // Default to 300s if out of bounds

            log(`Retrying in ${Math.round(delay / 1000)} seconds...`, 'DISCORD');
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

module.exports = { startBot, loginWithTimeout, testDiscordGateway };
