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

module.exports = { triviaPollSchema };
