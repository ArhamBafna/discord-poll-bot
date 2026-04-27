// --- Gemini API Schemas (Stateless) ---
const { Type } = require('@google/genai');

const triviaPollSchema = {
    type: Type.OBJECT,
    properties: {
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
        correctAnswerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING }
    },
    required: ["question", "options", "correctAnswerIndex", "explanation"]
};

const triviaPollJsonSchema = {
    type: 'object',
    properties: {
        question: {
            type: 'string',
            description: 'The trivia question to ask in the poll.'
        },
        options: {
            type: 'array',
            items: { type: 'string' },
            minItems: 4,
            maxItems: 4,
            description: 'Exactly four answer choices.'
        },
        correctAnswerIndex: {
            type: 'integer',
            minimum: 0,
            maximum: 3,
            description: 'The zero-based index of the correct answer.'
        },
        explanation: {
            type: 'string',
            description: 'A short explanation of why the answer is correct.'
        }
    },
    required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
    additionalProperties: false
};

module.exports = { triviaPollSchema, triviaPollJsonSchema };
