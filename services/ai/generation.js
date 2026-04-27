// --- AI Generation Functions (Gemini primary, OpenRouter fallback) ---
const ai = require('./client');
const { triviaPollSchema } = require('./schemas');
const { generateTriviaPollWithOpenRouter, generateTextWithOpenRouter } = require('./openrouter');
const serviceHelpers = require('../../lib/serviceHelpers');

// Model chain: primary stable → preview frontier → pro fallback
// gemini-3.5-flash and gemini-1.5-flash were removed/never existed — do not use them.
const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-pro'];

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

async function generatePollWithRetries(prompt, schema, temperature, serviceKey = 'gemini_poll') {
    let lastError = null;

    for (const model of MODEL_CHAIN) {
        console.log(`[GEMINI] Trying model: ${model}`);
        const result = await serviceHelpers.callWithRetries(
            () => ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema, temperature } }),
            { serviceKey, timeoutMs: 20000, maxAttempts: 3 }
        );

        if (result.status === 'success') {
            try {
                return { status: 'success', data: JSON.parse(result.data.text.trim()) };
            } catch (parseError) {
                console.error('[GEMINI] Failed to parse JSON response from AI:', parseError);
                return { status: 'error', permanent: true, error: parseError };
            }
        }

        console.warn(`[GEMINI] Model ${model} failed. Trying next model...`);
        lastError = result;
    }

    return lastError || { status: 'error', permanent: false, error: new Error('All models failed') };
}

async function generateTriviaPoll(topic = '', history = []) {
    const historyInstruction = history.length > 0 ? `Here is a list of recent questions to avoid repeating:\n- "${history.join('"\n- "')}"` : "";
    const prompt = `You are an expert AI trivia poll creator. Your primary goal is to generate a NEW and UNIQUE trivia question about Artificial Intelligence for a general audience. The question must be interesting and based on well-known AI facts.

**ABSOLUTE RULE: It is forbidden to generate a question that is the same as or very similar to any question in the history list provided below.** Do not rephrase or slightly modify past questions. Create something entirely new.

${topic ? `The poll must be about: **${topic}**.` : ''}

${historyInstruction}

**CRITICAL REQUIREMENT:** Each poll option MUST be under 55 characters. Generate the poll based on the provided schema.`;

    const normalizedHistory = new Set(history.map(q => q.toLowerCase().trim()));
    const MAX_UNIQUE_ATTEMPTS = 5;

    for (let attempt = 1; attempt <= MAX_UNIQUE_ATTEMPTS; attempt++) {
        const pollResult = await generatePollWithRetries(prompt, triviaPollSchema, 0.9, 'gemini_trivia');
        if (pollResult.status !== 'success') {
            console.warn(`[GEMINI][TRIVIA] Gemini failed while generating a poll. Trying OpenRouter next. Status: ${pollResult.status}`);
            break;
        }

        const pollData = pollResult.data;
        const normalizedNewQuestion = pollData.question.toLowerCase().trim();
        if (!normalizedHistory.has(normalizedNewQuestion)) {
            return { status: 'success', data: pollData }; // Found a unique question
        }

        console.warn(`[GEMINI][UNIQUE] Generated a duplicate trivia question on attempt ${attempt}/${MAX_UNIQUE_ATTEMPTS}. Retrying for a unique one...`);
    }

    console.warn('[GEMINI][TRIVIA] Gemini did not return a usable unique poll. Trying OpenRouter free fallback.');
    const openRouterResult = await generateTriviaPollWithOpenRouter(prompt, 0.9);
    if (openRouterResult.status === 'success') {
        const normalizedNewQuestion = openRouterResult.data.question.toLowerCase().trim();
        if (!normalizedHistory.has(normalizedNewQuestion)) {
            return openRouterResult;
        }
        console.warn('[OPENROUTER][UNIQUE] OpenRouter generated a duplicate trivia question. Falling back to preset polls.');
    }

    console.error('[AI] CRITICAL: Failed to generate a unique trivia poll with both Gemini and OpenRouter.');
    return { status: 'error', permanent: false, error: new Error('Failed to generate unique question with Gemini and OpenRouter') };
}

async function generateChatResponseWithRetries(chatHistory, promptForAI, systemInstruction, options = {}) {
    const {
        serviceKey = 'gemini_chat',
        temperature = 0.7,
        maxAttempts = 2,
        timeoutMs = 8000
    } = options;

    const aiContents = [
        ...(Array.isArray(chatHistory) ? chatHistory : []),
        { role: 'user', parts: [{ text: promptForAI }] }
    ];

    const geminiResult = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: aiContents, config: { systemInstruction } }),
        { serviceKey, maxAttempts, timeoutMs }
    );

    if (geminiResult.status === 'success') {
        return { status: 'success', data: (geminiResult.data?.text || '').trim(), source: 'gemini' };
    }

    console.warn(`[GEMINI] Chat generation failed for ${serviceKey}. Trying OpenRouter next.`);
    const openRouterResult = await generateTextWithOpenRouter(
        aiContents,
        { serviceKey: `${serviceKey}_openrouter`, temperature, systemInstruction }
    );

    if (openRouterResult.status === 'success') {
        return { status: 'success', data: openRouterResult.data.trim(), source: 'openrouter' };
    }

    return { status: 'error', permanent: false, error: openRouterResult.error || geminiResult.error || new Error('Failed to generate chat response') };
}

async function buildConversationHistory(message, discordClient, options = {}) {
    const {
        includeRecentChannelContext = false,
        recentChannelContextLimit = 8
    } = options;

    const historyEntries = [];
    const seenMessageIds = new Set();

    const pushIfRelevant = (candidate) => {
        if (!candidate || !candidate.content || seenMessageIds.has(candidate.id)) return;
        if (candidate.author.bot && candidate.author.id !== discordClient.user.id) return;

        const isFromBot = candidate.author.id === discordClient.user.id;

        seenMessageIds.add(candidate.id);
        historyEntries.push({
            id: candidate.id,
            role: isFromBot ? 'model' : 'user',
            parts: [{ text: candidate.content }]
        });
    };

    if (includeRecentChannelContext) {
        try {
            const recentMessages = await message.channel.messages.fetch({ limit: recentChannelContextLimit, before: message.id });
            const ordered = [...recentMessages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
            for (const recent of ordered) pushIfRelevant(recent);
        } catch (error) {
            console.warn('[CONTEXT] Failed to fetch recent channel context:', error?.message || error);
        }
    }

    const replyChainEntries = [];
    let currentReference = message.reference;
    for (let i = 0; i < 10 && currentReference && currentReference.messageId; i++) {
        try {
            const referencedMessage = await message.channel.messages.fetch(currentReference.messageId);
            const isFromBot = referencedMessage.author.id === discordClient.user.id;

            replyChainEntries.unshift({
                id: referencedMessage.id,
                role: isFromBot ? 'model' : 'user',
                parts: [{ text: referencedMessage.content }]
            });
            currentReference = referencedMessage.reference;
        } catch {
            break;
        }
    }

    for (const entry of replyChainEntries) {
        if (!seenMessageIds.has(entry.id)) {
            seenMessageIds.add(entry.id);
            historyEntries.push(entry);
        }
    }

    return historyEntries.map(({ role, parts }) => ({ role, parts }));
}
module.exports = {
    generateTextWithRetries,
    generatePollWithRetries,
    generateTriviaPoll,
    buildConversationHistory,
    generateChatResponseWithRetries
};


