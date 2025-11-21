# AI Chatbot Application

A production-ready chatbot web application that proxies requests to OpenRouter API with automatic API key rotation for handling rate limits.

## Features

✨ **5 AI Models** - Z.AI GLM 4.5 Air, DeepSeek variants, and Qwen3 Coder
🔄 **API Key Rotation** - Automatic failover when rate limits are hit
⚡ **Real-time Streaming** - See responses as they're generated
🎨 **Clean UI** - Modern, responsive design
🔧 **Zero Config** - Simple setup, no authentication needed

## Quick Start

### Prerequisites

- Node.js 18 or higher
- OpenRouter API key(s) - Get them at https://openrouter.ai

### Installation

1. **Clone or download this project**

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Create `.env` file in backend folder:**
   ```env
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3
   PORT=3001
   ```
   
   💡 Tip: You can use a single key or multiple comma-separated keys

4. **Verify backend setup:**
   ```bash
   npm run check
   ```

5. **Start backend server:**
   ```bash
   npm start
   ```
   
   Should see: `Server running on port 3001`

6. **Frontend Setup** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
   Should see: `Local: http://localhost:5173`

7. **Open browser** to http://localhost:5173 🎉

## Usage

1. **Select Model** - Choose from 5 AI models in the dropdown
2. **Type Message** - Enter your question or prompt
3. **Press Enter** or click **Send**
4. **Watch Response** - AI response streams in real-time

## Architecture

```
Frontend (React + Vite)
    ↓ HTTP POST
Backend (Express)
    ↓ Streaming
OpenRouter API
    ↓ Response
Back to Frontend
```

### API Key Rotation

When one API key hits a rate limit (429 error):
1. Backend automatically tries the next key
2. Continues until a working key is found
3. If all keys are rate limited, user sees a friendly error message

This happens transparently - users never see interruptions.

## Project Structure

```
chatbot-app/
├── backend/
│   ├── server.js           # Express server with streaming
│   ├── check-setup.js      # Setup verification script
│   ├── package.json
│   ├── .env               # Your API keys (not in git)
│   └── .env.example       # Template
└── frontend/
    ├── src/
    │   ├── App.jsx        # Main React component
    │   ├── App.css        # Styling
    │   ├── main.jsx       # Entry point
    │   └── index.css      # Global styles
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Environment Variables

### Backend (.env)

```env
# Multiple API keys (recommended)
OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3

# Or single API key
# OPENROUTER_API_KEY=sk-or-v1-single-key

# Port (optional)
PORT=3001
```

## API Endpoints

### POST /api/chat

Send a message and receive streaming response.

**Request:**
```json
{
  "model": "z-ai/glm-4.5-air:free",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ]
}
```

**Response:** Server-Sent Events (SSE) stream
```
data: {"content":"Hello","done":false}
data: {"content":"!","done":false}
data: {"content":"","done":true}
```

### GET /health

Health check endpoint.

**Response:**
```json
{"status":"ok"}
```

## Troubleshooting

### Backend won't start

**Error: `Cannot find module 'express'`**
```bash
cd backend && npm install
```

**Error: `OPENROUTER_API_KEY not found`**
- Create `.env` file in backend folder
- Add your API keys

**Port already in use:**
- Change PORT in `.env` to a different number

### Frontend issues

**Blank page:**
- Check browser console for errors
- Verify backend is running on port 3001

**CORS errors:**
- Backend must be running
- Check backend has `cors` middleware enabled

**Messages not streaming:**
- Open DevTools → Network tab
- Check `/api/chat` request
- Look for SSE data

### API errors

**429 Rate Limit:**
- Add more API keys to `.env`
- Wait for rate limit to reset
- Check OpenRouter dashboard for limits

**401 Unauthorized:**
- Verify API keys are valid
- Check for typos in `.env`

**502 Bad Gateway:**
- OpenRouter API may be down
- Check https://status.openrouter.ai

## Development

### Backend Development

```bash
cd backend
npm run dev  # Auto-restart on file changes
```

### Frontend Development

```bash
cd frontend
npm run dev  # Hot reload enabled
```

### Testing

Manual testing checklist:

- [ ] All 5 models work
- [ ] Responses stream word-by-word
- [ ] Can send multiple messages
- [ ] Model switching works mid-conversation
- [ ] Loading indicator appears
- [ ] Auto-scroll to new messages
- [ ] Error messages display correctly
- [ ] Input disabled while loading
- [ ] Enter key sends message
- [ ] API key rotation works (test with invalid key first)

## Production Deployment

### Backend

1. Set environment variables on your hosting platform
2. Ensure Node.js 18+ is available
3. Run `npm install --production`
4. Start with `npm start`
5. Set `PORT` as required by your host

### Frontend

1. Update API URL in `App.jsx` to your backend URL
2. Run `npm run build`
3. Deploy `dist` folder to static hosting (Vercel, Netlify, etc.)
4. Configure CORS on backend to allow your frontend domain

## Security Notes

🔒 **Never commit `.env` files**
🔒 **Never expose API keys in frontend code**
🔒 **Use environment variables only**
🔒 **Backend validates all requests**
🔒 **Consider adding rate limiting in production**

## Tech Stack

**Backend:**
- Node.js 18+
- Express.js
- OpenRouter API

**Frontend:**
- React 18
- Vite 5
- Native Fetch API

## Supported Models

| Model | Provider | Free? |
|-------|----------|-------|
| Z.AI GLM 4.5 Air | Z.AI | Yes |
| DeepSeek R1T2 Chimera | DeepSeek | Yes |
| DeepSeek Chat V3 | DeepSeek | Yes |
| Qwen3 Coder | Qwen | Yes |

## License

MIT

## Support

For issues with:
- **OpenRouter API** - https://openrouter.ai/docs
- **This app** - Check troubleshooting section above

---

Made with ❤️ using React, Express, and OpenRouter
