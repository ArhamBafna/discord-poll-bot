// --- AI Client Initialization ---
const { GoogleGenAI } = require('@google/genai');
const { GEMINI_API_KEY } = require('../../config');

let ai;
try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('[GEMINI] Gemini API client initialized successfully.');
} catch (error) {
    console.error('[GEMINI] CRITICAL: Failed to initialize the Gemini API client. This is often due to a library or environment issue. Please check the error details below.');
    console.error(error);
    process.exit(1);
}

module.exports = ai;
