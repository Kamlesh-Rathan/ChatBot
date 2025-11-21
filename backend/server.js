import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
app.use(express.json());

// Allowed models
const ALLOWED_MODELS = [
  'z-ai/glm-4.5-air:free',
  'tngtech/deepseek-r1t2-chimera:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen3-coder:free'
];

// Parse API keys from environment - supports both single and multiple keys
const API_KEYS = process.env.OPENROUTER_API_KEYS
  ? process.env.OPENROUTER_API_KEYS.split(',').map(k => k.trim())
  : [process.env.OPENROUTER_API_KEY];

let currentKeyIndex = 0;

function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex];
  const keyPreview = key ? `...${key.slice(-4)}` : 'none';
  console.log(`Using API key: ${keyPreview}`);
  return key;
}

function advanceToNextKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`Advanced to key index: ${currentKeyIndex}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages } = req.body;

    // Log the received model for debugging
    console.log(`Received request for model: ${model}`);

    // Validate request
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing required fields: model and messages array are required' });
    }

    // Validate model
    if (!ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({ error: 'Invalid model selected' });
    }

    if (API_KEYS.length === 0) {
      return res.status(500).json({ error: 'No API keys configured in backend' });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let attempt = 0;
    const maxAttempts = API_KEYS.length;
    let streamStarted = false;
    let lastError = null;

    while (attempt < maxAttempts) {
      try {
        const apiKey = getNextApiKey();

        if (!apiKey) {
          throw new Error('API key is missing or empty');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        console.log(`Making API request to OpenRouter with model: ${model}`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'Chatbot App'
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle rate limit - try next key
        if (response.status === 429) {
          console.log(`Rate limited on attempt ${attempt + 1}, trying next key...`);
          advanceToNextKey();
          attempt++;
          lastError = 'Rate limited';
          continue;
        }

        // Handle 401 Unauthorized (Invalid Key) - try next key but log it
        if (response.status === 401) {
          console.error(`Invalid API key on attempt ${attempt + 1}, trying next key...`);
          advanceToNextKey();
          attempt++;
          lastError = 'Invalid API Key';
          continue;
        }

        // Handle other errors
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
        }

        // Stream the response with robust chunk handling
        streamStarted = true;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
              res.end();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                  res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
                  res.end();
                  return;
                }

                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';

                    if (content) {
                      res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
                    }
                  } catch (e) {
                    // Silently skip invalid JSON - it's incomplete chunks
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          if (!res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`);
            res.end();
          }
          return;
        }

        // If we get here, streaming completed successfully
        return;

      } catch (error) {
        console.error('API request error:', error);
        if (error.name === 'AbortError') {
          console.log('Request timed out');
          lastError = 'Request timed out';
        } else {
          lastError = error.message || 'Unknown error';
        }
        advanceToNextKey();
        attempt++;

        if (attempt >= maxAttempts) {
          const errorMessage = streamStarted
            ? 'Stream interrupted'
            : (lastError === 'Rate limited'
              ? 'All API keys are currently rate limited. Please try again in a few minutes.'
              : `Unable to reach AI service. Please check your connection. (Error: ${lastError})`);

          console.log(`All ${maxAttempts} API keys exhausted. Last error: ${lastError}`);
          res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
          res.end();
          return;
        }
      }
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    // If we haven't started streaming yet, start an SSE stream with an error
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    try {
      res.write(`data: ${JSON.stringify({ error: 'Internal server error on chat endpoint' })}\n\n`);
    } catch (e) {
      console.error('Failed to write SSE error to client:', e);
    }

    if (!res.writableEnded) {
      res.end();
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Loaded ${API_KEYS.length} API key(s)`);
});
