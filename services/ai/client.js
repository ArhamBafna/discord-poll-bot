const { GoogleGenAI } = require('@google/genai');
const { GEMINI_API_KEY } = require('../../config');
const { log } = require('../../utils/logger');

let ai;
try {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    log('Gemini API client initialized successfully.', 'GEMINI');
} catch (error) {
    log('Failed to initialize the Gemini API client. Check the error details below.', 'ERROR');
    throw error;
}

module.exports = ai;
