// --- Gemini API Generation Functions ---
const ai = require('./client');
const { triviaPollSchema } = require('./schemas');
const serviceHelpers = require('../../lib/serviceHelpers');

async function generateTextWithRetries(prompt, serviceKey = 'gemini') {
    const result = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }),
        { serviceKey, maxAttempts: 2, timeoutMs: 10000 }
    );
    if (result.status === 'success') {
        return result.data.text.trim();
    }
    console.error(`[GEMINI] Failed to generate text for service ${serviceKey}.`);
    return null;
}

async function generatePollWithRetries(prompt, schema, temperature, serviceKey = 'gemini_poll') {
    const result = await serviceHelpers.callWithRetries(
        () => ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema, temperature: temperature } }),
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
    return result;
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
        if (pollResult.status !== 'success') return pollResult; // Propagate failure up

        const pollData = pollResult.data;
        const normalizedNewQuestion = pollData.question.toLowerCase().trim();
        if (!normalizedHistory.has(normalizedNewQuestion)) {
            return { status: 'success', data: pollData }; // Found a unique question
        }

        console.warn(`[GEMINI][UNIQUE] Generated a duplicate trivia question on attempt ${attempt}/${MAX_UNIQUE_ATTEMPTS}. Retrying for a unique one...`);
    }

    console.error(`[GEMINI] CRITICAL: Failed to generate a unique trivia poll after ${MAX_UNIQUE_ATTEMPTS} attempts.`);
    return { status: 'error', permanent: false, error: new Error('Failed to generate unique question') };
}

async function buildConversationHistory(message, discordClient) {
    const history = [];
    let currentReference = message.reference;
    for (let i = 0; i < 10 && currentReference && currentReference.messageId; i++) {
        try {
            const referencedMessage = await message.channel.messages.fetch(currentReference.messageId);
            if (referencedMessage.author.id === message.author.id || referencedMessage.author.id === discordClient.user.id) {
                history.unshift({ role: referencedMessage.author.id === discordClient.user.id ? 'model' : 'user', parts: [{ text: referencedMessage.content }] });
            } else { break; }
            currentReference = referencedMessage.reference;
        } catch { break; }
    }
    return history;
}

module.exports = {
    generateTextWithRetries,
    generatePollWithRetries,
    generateTriviaPoll,
    buildConversationHistory
};
