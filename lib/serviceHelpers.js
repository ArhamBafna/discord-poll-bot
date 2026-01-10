// --- Service Resilience & Queueing Helpers ---

// --- Configuration Constants ---
const CIRCUIT_FAILURE_THRESHOLD = 5; // failures
const CIRCUIT_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const CIRCUIT_OPEN_MS = 2 * 60 * 1000; // 2 minutes
const QUEUE_MAX_PER_KEY = 5;
const QUEUE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// --- State Management ---
const circuitBreakers = {}; // e.g., { gemini: { failures: [timestamp1, ...], openUntil: timestamp } }
const convQueue = new Map(); // key: 'channelId-userId', value: [job1, job2, ...]
const metrics = {
    gemini_attempts: 0,
    gemini_retries: 0,
    gemini_circuit_open: 0,
    fallback_served: 0,
    queued_requests: 0,
    queue_drops: 0,
};

let discordClient = null; // To be initialized with the running client instance

/**
 * Checks if an error is transient and thus retryable.
 * @param {Error} error The error object.
 * @returns {boolean} True if the error is retryable.
 */
function isRetryableError(error) {
    if (!error || !error.message) return false;
    const msg = error.message.toLowerCase();
    const retryableMessages = ['timeout', 'overloaded', 'econnreset', 'socket hang up'];
    const retryableStatusCodes = ['429', '500', '502', '503'];

    if (retryableMessages.some(m => msg.includes(m))) return true;
    if (retryableStatusCodes.some(code => msg.includes(code))) return true;

    return false;
}

/**
 * Wraps a promise with a timeout.
 * @param {Promise} promise The promise to wrap.
 * @param {number} timeoutMs The timeout in milliseconds.
 * @returns {Promise<any>}
 */
function promiseWithTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, timeoutMs);

        promise.then(
            (res) => {
                clearTimeout(timeoutId);
                resolve(res);
            },
            (err) => {
                clearTimeout(timeoutId);
                reject(err);
            }
        );
    });
}

/**
 * A robust wrapper for calling an external service function (like Gemini API).
 * Implements exponential backoff, jitter, timeouts, and a circuit breaker.
 * @param {Function} fn The async function to call, which returns a promise.
 * @param {object} opts Options: { maxAttempts, initialDelayMs, maxDelayMs, timeoutMs, serviceKey }
 * @returns {Promise<{status: string, data?: any, error?: Error, permanent?: boolean}>}
 */
async function callWithRetries(fn, opts = {}) {
    const {
        maxAttempts = 4,
        initialDelayMs = 1000,
        maxDelayMs = 15000,
        timeoutMs = 15000,
        serviceKey = 'gemini'
    } = opts;

    // --- Circuit Breaker Check ---
    const breaker = circuitBreakers[serviceKey] || { failures: [], openUntil: 0 };
    circuitBreakers[serviceKey] = breaker;

    if (breaker.openUntil > Date.now()) {
        metrics.gemini_circuit_open++;
        console.log(`[SERVICE][${serviceKey.toUpperCase()}][CIRCUIT_OPEN] Circuit is open. Rejecting request immediately.`);
        return { status: 'circuit_open' };
    }

    metrics.gemini_attempts++;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await promiseWithTimeout(fn(), timeoutMs);
            // On success, reset failure history for the service.
            breaker.failures = [];
            return { status: 'success', data: result };
        } catch (error) {
            if (!isRetryableError(error)) {
                console.error(`[SERVICE][${serviceKey.toUpperCase()}] Non-retryable error encountered:`, error.message);
                return { status: 'error', permanent: true, error };
            }

            if (attempt === maxAttempts) {
                console.error(`[SERVICE][${serviceKey.toUpperCase()}] Final attempt failed. Giving up.`, error);
                return { status: 'error', permanent: false, error };
            }

            metrics.gemini_retries++;
            const delay = Math.min(maxDelayMs, Math.pow(2, attempt - 1) * initialDelayMs);
            const jitter = delay * 0.2 * Math.random();
            console.warn(`[SERVICE][${serviceKey.toUpperCase()}][RETRY] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${Math.round((delay + jitter)/1000)}s...`);
            
            // --- Update Circuit Breaker State ---
            const now = Date.now();
            breaker.failures.push(now);
            // Keep only failures within the time window
            breaker.failures = breaker.failures.filter(ts => now - ts < CIRCUIT_WINDOW_MS);
            if (breaker.failures.length >= CIRCUIT_FAILURE_THRESHOLD) {
                breaker.openUntil = now + CIRCUIT_OPEN_MS;
                console.error(`[SERVICE][${serviceKey.toUpperCase()}][CIRCUIT_OPEN] Threshold of ${CIRCUIT_FAILURE_THRESHOLD} failures reached. Opening circuit for ${CIRCUIT_OPEN_MS / 1000}s.`);
                // Return immediately, don't wait for the delay
                return { status: 'circuit_open' };
            }

            await new Promise(res => setTimeout(res, delay + jitter));
        }
    }
}

/**
 * Adds a conversational request to the queue.
 * @param {import('discord.js').Message} message The user's message object.
 * @param {string} systemInstruction The context/system prompt to use for this request.
 * @returns {number|null} The user's position in the queue, or null if the queue is full.
 */
function enqueueConvRequest(message, systemInstruction) {
    const key = `${message.channel.id}-${message.author.id}`;
    if (!convQueue.has(key)) {
        convQueue.set(key, []);
    }
    const userQueue = convQueue.get(key);

    if (userQueue.length >= QUEUE_MAX_PER_KEY) {
        metrics.queue_drops++;
        console.log(`[CONV_QUEUE][DROP] Queue full for key ${key}. Dropping request.`);
        return null;
    }

    const job = {
        messageId: message.id,
        channelId: message.channel.id,
        guildId: message.guild.id,
        authorId: message.author.id,
        cleanContent: message.content.replace(/<@!?\d+>/g, '').trim(),
        systemInstruction: systemInstruction || "you are a friendly discord bot.",
        timestamp: Date.now(),
        // We pass these along to avoid fetching them again in the worker
        isReplyToBot: message.isReplyToBot, 
        messageReference: message.reference,
    };

    userQueue.push(job);
    metrics.queued_requests++;
    console.log(`[CONV_QUEUE][PUSH] Queued request for key ${key}. New queue length: ${userQueue.length}`);
    return userQueue.length;
}

/**
 * The core logic for the background worker that processes the conversational queue.
 * This is defined separately to be testable.
 */
async function processConvQueue() {
    // Clean up stale jobs first
    const now = Date.now();
    for (const [key, userQueue] of convQueue.entries()) {
        const filteredQueue = userQueue.filter(job => now - job.timestamp < QUEUE_TTL_MS);
        if (filteredQueue.length < userQueue.length) {
            console.log(`[CONV_QUEUE][CLEANUP] Removed ${userQueue.length - filteredQueue.length} stale jobs from key ${key}.`);
        }
        if (filteredQueue.length === 0) {
            convQueue.delete(key);
        } else {
            convQueue.set(key, filteredQueue);
        }
    }
    
    // Find the next job to process (simple FIFO for the first user with a queue)
    const nextJobKey = convQueue.keys().next().value;
    if (!nextJobKey) return; // Queue is empty

    const job = convQueue.get(nextJobKey).shift();
    if (convQueue.get(nextJobKey).length === 0) {
        convQueue.delete(nextJobKey);
    }
    
    if (!job) return;

    console.log(`[CONV_QUEUE][POP] Processing job for key ${nextJobKey}.`);

    try {
        const channel = await discordClient.channels.fetch(job.channelId);
        // Use the system instruction that was captured when the job was queued
        const result = await callWithRetries(() => discordClient.ai.models.generateContent({ model: 'gemini-2.5-flash', contents: job.cleanContent, config: { systemInstruction: job.systemInstruction } }), { serviceKey: 'gemini_chat' });
        
        if (result.status === 'success') {
            await channel.send({ content: result.data.text.trim().toLowerCase(), reply: { messageReference: job.messageId } });
        } else {
            await channel.send({ content: "i tried processing your queued request, but something went wrong and i couldn't get an answer. please try asking again!", reply: { messageReference: job.messageId } });
        }
    } catch (error) {
        console.error(`[CONV_QUEUE][WORKER] Failed to process job and reply:`, error);
    }
}

/**
 * Starts the background worker that processes the conversational queue.
 * @param {import('discord.js').Client} client The active Discord client.
 */
function startConvQueueWorker(client) {
    if (!client) {
        console.error("[SERVICE] CRITICAL: Cannot start queue worker without a Discord client instance.");
        return;
    }
    discordClient = client;
    // We need to attach the AI instance to the client for the worker to use it.
    // This is a bit of a hack but avoids complex dependency injection.
    discordClient.ai = client.ai; 
    
    console.log('[SERVICE] Starting conversational queue worker...');
    setInterval(processConvQueue, 4000); // Process one job every 4 seconds
}

module.exports = {
    isRetryableError,
    promiseWithTimeout,
    callWithRetries,
    enqueueConvRequest,
    startConvQueueWorker,
    metrics // Expose metrics for potential logging
};
