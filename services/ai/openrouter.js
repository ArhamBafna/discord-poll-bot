// --- OpenRouter Trivia Poll Generation ---
const { OPENROUTER_API_KEY } = require('../../config');
const { triviaPollJsonSchema } = require('./schemas');

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openrouter/free';
const OPENROUTER_TIMEOUT_MS = 20000;
const OPENROUTER_MAX_ATTEMPTS = 2;
const OPENROUTER_INITIAL_DELAY_MS = 1000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function extractContentText(content) {
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
        return content
            .map(part => {
                if (typeof part === 'string') return part;
                if (part && typeof part.text === 'string') return part.text;
                if (part && typeof part.content === 'string') return part.content;
                return '';
            })
            .join('')
            .trim();
    }
    if (content && typeof content === 'object') {
        if (typeof content.text === 'string') return content.text.trim();
        if (typeof content.content === 'string') return content.content.trim();
        return JSON.stringify(content).trim();
    }
    return '';
}

function normalizeOpenRouterMessages(messages = [], systemInstruction = '') {
    const normalized = [];

    if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
        normalized.push({ role: 'system', content: systemInstruction.trim() });
    }

    for (const message of messages) {
        if (!message) continue;

        const role = message.role === 'model' ? 'assistant' : message.role;
        if (!['user', 'assistant', 'system'].includes(role)) continue;

        let content = '';
        if (typeof message.content === 'string') {
            content = message.content.trim();
        } else if (typeof message.parts !== 'undefined') {
            const parts = Array.isArray(message.parts) ? message.parts : [];
            content = parts
                .map(part => {
                    if (typeof part === 'string') return part;
                    if (part && typeof part.text === 'string') return part.text;
                    if (part && typeof part.content === 'string') return part.content;
                    return '';
                })
                .join('')
                .trim();
        }

        if (!content) continue;
        normalized.push({ role, content });
    }

    return normalized;
}

function parseJsonMaybeWrapped(text) {
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch (firstError) {
        const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fencedMatch) {
            return JSON.parse(fencedMatch[1].trim());
        }
        throw firstError;
    }
}

function validateTriviaPollData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('OpenRouter returned an invalid trivia poll payload.');
    }

    const question = typeof data.question === 'string' ? data.question.trim() : '';
    const options = Array.isArray(data.options)
        ? data.options.map(option => String(option).trim()).filter(Boolean)
        : [];
    const correctAnswerIndex = Number(data.correctAnswerIndex);
    const explanation = typeof data.explanation === 'string' ? data.explanation.trim() : '';

    if (!question) throw new Error('OpenRouter trivia poll is missing a question.');
    if (options.length !== 4) throw new Error('OpenRouter trivia poll must contain exactly four options.');
    if (!Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
        throw new Error('OpenRouter trivia poll has an invalid correctAnswerIndex.');
    }
    if (!explanation) throw new Error('OpenRouter trivia poll is missing an explanation.');

    return {
        type: 'trivia',
        question,
        options,
        correctAnswerIndex,
        explanation
    };
}

function isRetryableOpenRouterError(error) {
    if (!error || !error.message) return false;
    const message = error.message.toLowerCase();
    const retryableSignals = [
        'timeout',
        'timed out',
        'request failed (429)',
        'request failed (408)',
        'request failed (500)',
        'request failed (502)',
        'request failed (503)',
        'econnreset',
        'socket hang up',
        'json',
        'parse',
        'malformed',
        'empty completion'
    ];

    return retryableSignals.some(signal => message.includes(signal));
}

async function generateTriviaPollWithOpenRouter(prompt, temperature = 0.9) {
    if (!OPENROUTER_API_KEY) {
        console.warn('[OPENROUTER] API key is not configured. Skipping OpenRouter fallback.');
        return { status: 'error', permanent: false, error: new Error('OpenRouter API key is not configured') };
    }

    let lastError = null;

    for (let attempt = 1; attempt <= OPENROUTER_MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`[OPENROUTER] Trying ${OPENROUTER_MODEL} (attempt ${attempt}/${OPENROUTER_MAX_ATTEMPTS}).`);
            const response = await fetch(OPENROUTER_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: 'You create trivia polls for Discord. Return only valid JSON that matches the provided schema. Do not wrap the response in markdown or add extra text.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature,
                    stream: false,
                    response_format: {
                        type: 'json_schema',
                        json_schema: {
                            name: 'trivia_poll',
                            strict: true,
                            schema: triviaPollJsonSchema
                        }
                    },
                    plugins: [{ id: 'response-healing' }]
                }),
                signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`OpenRouter request failed (${response.status}): ${errorBody.slice(0, 500)}`);
            }

            const payload = await response.json();
            const contentText = extractContentText(payload?.choices?.[0]?.message?.content);
            if (!contentText) {
                throw new Error('OpenRouter returned an empty completion.');
            }

            const parsed = parseJsonMaybeWrapped(contentText);
            const pollData = validateTriviaPollData(parsed);
            return { status: 'success', data: pollData };
        } catch (error) {
            lastError = error;

            if (attempt === OPENROUTER_MAX_ATTEMPTS || !isRetryableOpenRouterError(error)) {
                break;
            }

            const delay = Math.min(15000, Math.pow(2, attempt - 1) * OPENROUTER_INITIAL_DELAY_MS);
            console.warn(`[OPENROUTER][RETRY] Attempt ${attempt}/${OPENROUTER_MAX_ATTEMPTS} failed. Retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
        }
    }

    console.error('[OPENROUTER] Failed to generate a trivia poll.');
    return { status: 'error', permanent: false, error: lastError || new Error('OpenRouter failed') };
}

async function generateTextWithOpenRouter(messages, options = {}) {
    const {
        temperature = 0.7,
        systemInstruction = '',
        serviceKey = 'openrouter_text'
    } = options;

    if (!OPENROUTER_API_KEY) {
        console.warn('[OPENROUTER] API key is not configured. Skipping OpenRouter fallback.');
        return { status: 'error', permanent: false, error: new Error('OpenRouter API key is not configured') };
    }

    const normalizedMessages = normalizeOpenRouterMessages(messages, systemInstruction);
    if (normalizedMessages.length === 0) {
        return { status: 'error', permanent: true, error: new Error('No messages provided for OpenRouter text generation') };
    }

    let lastError = null;

    for (let attempt = 1; attempt <= OPENROUTER_MAX_ATTEMPTS; attempt++) {
        try {
            console.log(`[OPENROUTER] Trying ${OPENROUTER_MODEL} for ${serviceKey} (attempt ${attempt}/${OPENROUTER_MAX_ATTEMPTS}).`);
            const response = await fetch(OPENROUTER_ENDPOINT, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: OPENROUTER_MODEL,
                    messages: normalizedMessages,
                    temperature,
                    stream: false
                }),
                signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`OpenRouter request failed (${response.status}): ${errorBody.slice(0, 500)}`);
            }

            const payload = await response.json();
            const contentText = extractContentText(payload?.choices?.[0]?.message?.content);
            if (!contentText) {
                throw new Error('OpenRouter returned an empty completion.');
            }

            return { status: 'success', data: contentText };
        } catch (error) {
            lastError = error;

            if (attempt === OPENROUTER_MAX_ATTEMPTS || !isRetryableOpenRouterError(error)) {
                break;
            }

            const delay = Math.min(15000, Math.pow(2, attempt - 1) * OPENROUTER_INITIAL_DELAY_MS);
            console.warn(`[OPENROUTER][RETRY] Attempt ${attempt}/${OPENROUTER_MAX_ATTEMPTS} failed for ${serviceKey}. Retrying in ${Math.round(delay / 1000)}s...`);
            await sleep(delay);
        }
    }

    console.error(`[OPENROUTER] Failed to generate text for ${serviceKey}.`);
    return { status: 'error', permanent: false, error: lastError || new Error('OpenRouter failed') };
}

module.exports = {
    generateTriviaPollWithOpenRouter,
    generateTextWithOpenRouter,
    normalizeOpenRouterMessages
};
