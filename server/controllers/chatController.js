import { GoogleGenerativeAI } from '@google/generative-ai';

const WELCOME =
  "Hey! I'm your QuickShow AI assistant. Ask me anything about movies, showtimes, or what to watch tonight!";

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];
const RETRY_DELAYS_MS = [700, 1400];

const isQuotaError = (message = '') =>
  message.includes('429') ||
  message.toLowerCase().includes('quota') ||
  message.toLowerCase().includes('too many requests');

const getErrorStatus = (error) =>
  error?.status ||
  error?.response?.status ||
  error?.errorDetails?.status;

const isTemporaryAiError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  const status = getErrorStatus(error);

  return (
    RETRYABLE_STATUS_CODES.includes(Number(status)) ||
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('high demand') ||
    message.includes('try again later') ||
    message.includes('temporarily unavailable')
  );
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendMessageWithRetry = async (chat, message) => {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await chat.sendMessage(message);
    } catch (error) {
      lastError = error;

      if (!isTemporaryAiError(error) || attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }

      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
};

const fallbackReply = (userMessage, movieContext) => {
  const movieLines = (movieContext || '')
    .split('\n')
    .filter((line) => line.trim().startsWith('- '))
    .slice(0, 5);

  if (movieLines.length > 0) {
    return `QuickShow AI is busy right now, but I can still help from QuickShow data. Currently showing:\n${movieLines.join('\n')}\n\nClick a movie to view showtimes and book seats.`;
  }

  return `QuickShow AI is temporarily busy, but the QuickShow server is working. Please try again in a moment.`;
};

export const chatWithAI = async (req, res) => {
  try {
    const { messages, movieContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Invalid messages format.' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

    if (!geminiApiKey) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API key not configured. Add GEMINI_API_KEY to server/.env.',
      });
    }

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage?.content || lastMessage.role !== 'user') {
      return res.status(400).json({
        success: false,
        message: 'Last message must be a user message with content.',
      });
    }

    const systemPrompt = `You are QuickShow's friendly AI movie assistant. You help users discover movies, understand plots, get recommendations, and learn about showtimes on the QuickShow platform.

${movieContext || 'No current movie data available.'}

Guidelines:
- Be enthusiastic, warm, and concise (2-4 sentences max unless listing movies)
- When recommending movies from the list above, mention the title and rating
- If asked about booking, direct users to click on a movie to see showtimes
- Use occasional movie-related words for personality
- Never make up movie details - only use what is provided above`;

    const history = messages
      .filter((message) => !(message.role === 'assistant' && message.content === WELCOME))
      .slice(0, -1)
      .filter((message) => message?.content && ['assistant', 'user'].includes(message.role))
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history });
    const result = await sendMessageWithRetry(chat, lastMessage.content);
    const reply = result.response.text();

    res.json({ success: true, reply });
  } catch (error) {
    const errMsg = error?.message || 'AI service error.';
    console.error('Gemini Chat Error:', errMsg);

    if (isQuotaError(errMsg) || isTemporaryAiError(error)) {
      return res.json({
        success: true,
        reply: fallbackReply(req.body?.messages?.at(-1)?.content, req.body?.movieContext),
      });
    }

    res.json({ success: false, message: errMsg });
  }
};
