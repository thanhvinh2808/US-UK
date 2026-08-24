import { sendSuccess, sendError } from '../utils/responseHelper.js';

const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const MAX_PROMPT_LENGTH = 4000;

export const aiController = {
  /**
   * POST /api/ai/generate
   * Protected AI Gateway: requires valid JWT authentication & rate limiting
   */
  async generate(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('CRITICAL: GEMINI_API_KEY is missing on server environment');
      return sendError(res, 'AI service configuration is currently unavailable on server', 500, 'AI_CONFIG_ERROR');
    }

    try {
      const { prompt, systemInstruction } = req.body || {};

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return sendError(res, 'Prompt is required and must be a non-empty string', 400, 'INVALID_PROMPT');
      }

      if (prompt.length > MAX_PROMPT_LENGTH) {
        return sendError(
          res,
          `Prompt length exceeds maximum allowed limit of ${MAX_PROMPT_LENGTH} characters`,
          400,
          'PROMPT_TOO_LONG'
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const requestBody = {
        contents: [{ parts: [{ text: prompt.trim() }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7
        }
      };

      if (systemInstruction && typeof systemInstruction === 'string') {
        requestBody.system_instruction = {
          parts: [{ text: systemInstruction.trim() }]
        };
      }

      let response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          }
        );
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        return sendError(res, data.error?.message || 'Gemini API Error', response.status, 'AI_API_ERROR');
      }

      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return sendSuccess(res, { text: textOutput, userId: req.user?.id });
    } catch (err) {
      if (err.name === 'AbortError') {
        return sendError(res, 'AI gateway request timed out after 15 seconds', 504, 'AI_TIMEOUT');
      }
      return sendError(res, err.message || 'Internal AI service error', 500, 'AI_GATEWAY_ERROR');
    }
  }
};

export default aiController;
