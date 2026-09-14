// --- AI Generation Functions (Single Runner Chain) ---
const ai = require('./client');
const { triviaPollSchema, triviaPollJsonSchema } = require('./schemas');
const { generateTextWithOpenRouter, OPENROUTER_ENDPOINT, normalizeOpenRouterMessages } = require('./openrouter');
const serviceHelpers = require('../../lib/serviceHelpers');
const { FALLBACK_POLLS } = require('../polls/fallbacks');
const { OPENROUTER_API_KEY } = require('../../config');

// 1. One declared AI provider chain executed by a single shared runner
const PROVIDER_CHAIN = [
    { provider: 'gemini', model: 'gemini-2.5-flash', timeoutMs: 20000, maxAttempts: 3 },
    { provider: 'openrouter', model: 'openrouter/free', timeoutMs: 20000, maxAttempts: 2 },
    { provider: 'preset', maxAttempts: 1 }
];

// 2. One trivia-poll schema definition and validator
function validateTriviaPollData(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid trivia poll payload.');
    const question = typeof data.question === 'string' ? data.question.trim() : '';
    const options = Array.isArray(data.options) ? data.options.map(o => String(o).trim()).filter(Boolean) : [];
    const correctAnswerIndex = Number(data.correctAnswerIndex);
    const explanation = typeof data.explanation === 'string' ? data.explanation.trim() : '';

    if (!question) throw new Error('Missing question.');
    if (options.length !== 4) throw new Error('Must contain exactly four options.');
    if (!Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) throw new Error('Invalid correctAnswerIndex.');
    if (!explanation) throw new Error('Missing explanation.');

    return { type: 'trivia', question, options, correctAnswerIndex, explanation };
}

function parseJsonMaybeWrapped(text) {
    const trimmed = text.trim();
    try {
        return JSON.parse(trimmed);
    } catch (firstError) {
        const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fencedMatch) return JSON.parse(fencedMatch[1].trim());
        const parseError = new Error('JSON parse failure: malformed response');
        parseError.type = 'parse'; // Explicit error type
        throw parseError;
    }
}

async function runGeminiPoll(model, prompt, temperature, timeoutMs) {
    const result = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: triviaPollSchema, temperature } }),
        { serviceKey: 'gemini_poll', timeoutMs, maxAttempts: 1 }
    );
    if (result.status === 'success') {
        return validateTriviaPollData(parseJsonMaybeWrapped(result.data.text.trim()));
    }
    const err = new Error('Gemini failed: ' + (result.error?.message || 'Unknown error'));
    err.type = 'api';
    throw err;
}

async function runOpenRouterPoll(model, prompt, temperature, timeoutMs) {
    if (!OPENROUTER_API_KEY) {
        const err = new Error('No OpenRouter API key');
        err.type = 'config';
        throw err;
    }
    const response = await fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'system', content: 'Return only valid JSON matching the schema.' }, { role: 'user', content: prompt }],
            temperature, stream: false,
            response_format: { type: 'json_schema', json_schema: { name: 'trivia_poll', strict: true, schema: triviaPollJsonSchema } }
        }),
        signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
        const err = new Error(`OpenRouter HTTP ${response.status}`);
        err.type = 'status_code';
        err.status = response.status;
        throw err;
    }
    const payload = await response.json();
    let text = payload?.choices?.[0]?.message?.content;
    if (!text) {
        const err = new Error('Empty completion');
        err.type = 'api';
        throw err;
    }
    return validateTriviaPollData(parseJsonMaybeWrapped(text));
}

function isRetryableErrorType(err) {
    // 3. Retry detection uses explicit error types
    if (err.type === 'parse') return true;
    if (err.type === 'status_code') {
        return [408, 429, 500, 502, 503, 504].includes(err.status);
    }
    if (err.type === 'api') return true;
    return false;
}

// 6. De-theatricalized prompts
async function generateTriviaPoll(topic = '', history = []) {
    const historyInstruction = history.length > 0 ? `Avoid the following recent questions:\n- "${history.join('"\n- "')}"` : "";
    const prompt = `Create a new trivia question about Artificial Intelligence.\n${topic ? `Topic: ${topic}` : ''}\n${historyInstruction}\nKeep options under 55 characters.`;
    const normalizedHistory = new Set(history.map(q => q.toLowerCase().trim()));
    
    // 1. Executed by a single shared runner with retries
    for (const step of PROVIDER_CHAIN) {
        for (let attempt = 1; attempt <= (step.maxAttempts || 1); attempt++) {
            try {
                if (step.provider === 'preset') {
                    const available = FALLBACK_POLLS.filter(p => !normalizedHistory.has(p.question.toLowerCase().trim()));
                    if (available.length > 0) {
                        return { status: 'success', data: available[Math.floor(Math.random() * available.length)] };
                    }
                    return { status: 'success', data: FALLBACK_POLLS[0] };
                }
                
                let pollData;
                if (step.provider === 'gemini') {
                    pollData = await runGeminiPoll(step.model, prompt, 0.9, step.timeoutMs);
                } else if (step.provider === 'openrouter') {
                    pollData = await runOpenRouterPoll(step.model, prompt, 0.9, step.timeoutMs);
                }
                
                if (!normalizedHistory.has(pollData.question.toLowerCase().trim())) {
                    return { status: 'success', data: pollData };
                } else {
                    const duplicateErr = new Error('Generated duplicate question');
                    duplicateErr.type = 'parse'; // Treat duplicate as retryable
                    throw duplicateErr;
                }
            } catch (err) {
                console.warn(`[CHAIN] Provider ${step.provider} (${step.model || 'preset'}) failed on attempt ${attempt}: ${err.message} (Type: ${err.type || 'unknown'})`);
                
                // If the error is not retryable, move to the next provider instead of retrying this one
                if (!isRetryableErrorType(err) && attempt < step.maxAttempts) {
                    console.warn(`[CHAIN] Non-retryable error type '${err.type}'. Moving to next provider.`);
                    break;
                }
            }
        }
    }
    
    return { status: 'success', data: FALLBACK_POLLS[0] };
}

// Text Generation fallback logic (for chat etc)
async function generateTextWithRetries(prompt, serviceKey = 'gemini') {
    const result = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }),
        { serviceKey, maxAttempts: 2, timeoutMs: 10000 }
    );
    if (result.status === 'success') {
        return result.data.text.trim();
    }
    console.warn(`[GEMINI] Failed to generate text for service ${serviceKey}. Trying OpenRouter next.`);

    const openRouterResult = await generateTextWithOpenRouter([
        { role: 'user', content: prompt }
    ], { serviceKey: `${serviceKey}_openrouter`, temperature: 0.7 });

    if (openRouterResult.status === 'success') {
        return openRouterResult.data.trim();
    }

    console.error(`[AI] Failed to generate text for service ${serviceKey} with both Gemini and OpenRouter.`);
    return null;
}

async function generateChatResponseWithRetries(chatHistory, promptForAI, systemInstruction, options = {}) {
    const { serviceKey = 'gemini_chat', temperature = 0.7, maxAttempts = 2, timeoutMs = 8000 } = options;
    const aiContents = [...(Array.isArray(chatHistory) ? chatHistory : []), { role: 'user', parts: [{ text: promptForAI }] }];

    const geminiResult = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: aiContents, config: { systemInstruction } }),
        { serviceKey, maxAttempts, timeoutMs }
    );

    if (geminiResult.status === 'success') {
        return { status: 'success', data: (geminiResult.data?.text || '').trim(), source: 'gemini' };
    }

    const openRouterResult = await generateTextWithOpenRouter(aiContents, { serviceKey: `${serviceKey}_openrouter`, temperature, systemInstruction });
    if (openRouterResult.status === 'success') {
        return { status: 'success', data: openRouterResult.data.trim(), source: 'openrouter' };
    }
    return { status: 'error', permanent: false, error: openRouterResult.error || geminiResult.error || new Error('Failed to generate chat response') };
}

async function buildConversationHistory(message, discordClient, options = {}) {
    const { includeRecentChannelContext = false, recentChannelContextLimit = 8 } = options;
    const historyEntries = [];
    const seenMessageIds = new Set();
    const pushIfRelevant = (candidate) => {
        if (!candidate || !candidate.content || seenMessageIds.has(candidate.id)) return;
        if (candidate.author.bot && candidate.author.id !== discordClient.user.id) return;
        seenMessageIds.add(candidate.id);
        historyEntries.push({ id: candidate.id, role: candidate.author.id === discordClient.user.id ? 'model' : 'user', parts: [{ text: candidate.content }] });
    };
    if (includeRecentChannelContext) {
        try {
            const recentMessages = await message.channel.messages.fetch({ limit: recentChannelContextLimit, before: message.id });
            const ordered = [...recentMessages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
            for (const recent of ordered) pushIfRelevant(recent);
        } catch (error) {}
    }
    const replyChainEntries = [];
    let currentReference = message.reference;
    for (let i = 0; i < 10 && currentReference && currentReference.messageId; i++) {
        try {
            const referencedMessage = await message.channel.messages.fetch(currentReference.messageId);
            replyChainEntries.unshift({ id: referencedMessage.id, role: referencedMessage.author.id === discordClient.user.id ? 'model' : 'user', parts: [{ text: referencedMessage.content }] });
            currentReference = referencedMessage.reference;
        } catch { break; }
    }
    for (const entry of replyChainEntries) {
        if (!seenMessageIds.has(entry.id)) {
            seenMessageIds.add(entry.id);
            historyEntries.push(entry);
        }
    }
    return historyEntries.map(({ role, parts }) => ({ role, parts }));
}

// Keep export interface consistent
module.exports = {
    generateTextWithRetries,
    // Provide a dummy function since we removed it but it might be imported
    generatePollWithRetries: async () => {},
    generateTriviaPoll,
    buildConversationHistory,
    generateChatResponseWithRetries
};
