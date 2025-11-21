# Chatbot Web Application - Complete Context

## Project Overview

A minimal chatbot web application that acts as a broker between users and the OpenRouter API. Users select an AI model from a dropdown menu and chat with it in real-time. The application streams responses for a smooth user experience.

**Key Characteristics:**
- No authentication, login, or user management
- Direct proxy to OpenRouter API
- Real-time streaming responses
- Model switching on-the-fly
- Single-page application architecture

---

## Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **HTTP Client:** node-fetch or axios
- **CORS:** cors middleware
- **Environment:** dotenv for config

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Plain CSS or Tailwind CSS
- **HTTP Client:** Fetch API (native)

---

## Supported Models

The application supports exactly 5 models via OpenRouter:

1. `minimax/minimax-m2`
2. `meta-llama/llama-4-scout:free`
3. `tngtech/deepseek-r1t2-chimera:free`
4. `deepseek/deepseek-chat-v3-0324:free`
5. `qwen/qwen3-coder:free`

These model IDs must match OpenRouter's exact naming convention.

---

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │   Backend   │ ──────> │  OpenRouter │
│   (React)   │ <────── │  (Express)  │ <────── │     API     │
└─────────────┘         └─────────────┘         └─────────────┘
     Vite                   Node.js              openrouter.ai
```

**Flow:**
1. User selects model and types message
2. Frontend sends POST to `/api/chat`
3. Backend validates and forwards to OpenRouter
4. OpenRouter streams response
5. Backend streams response to frontend
6. Frontend updates UI in real-time

---

## Backend Specification

### Project Structure
```
backend/
├── server.js           # Main Express application
├── .env                # Environment variables (not in git)
├── .env.example        # Example environment file
├── package.json
└── .gitignore
```

### Environment Variables
```
OPENROUTER_API_KEY=your_api_key_here
PORT=3001
```

### API Route: POST /api/chat

**Endpoint:** `POST /api/chat`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "model": "minimax/minimax-m2",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream

**Response Format:**
```
data: {"content": "Hello", "done": false}

data: {"content": "!", "done": false}

data: {"content": "", "done": true}
```

### OpenRouter Integration

**Base URL:** `https://openrouter.ai/api/v1/chat/completions`

**Request to OpenRouter:**
```javascript
{
  model: "minimax/minimax-m2",
  messages: [
    { role: "user", content: "Hello" }
  ],
  stream: true
}
```

**Headers:**
```javascript
{
  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'http://localhost:5173', // Your app URL
  'X-Title': 'Chatbot App'
}
```

### Backend Implementation Requirements

1. **Model Validation**
   - Verify the model is in the allowed list
   - Return 400 error if invalid model

2. **Error Handling**
   - Handle network errors
   - Handle OpenRouter API errors
   - Return appropriate HTTP status codes
   - Send error messages to frontend

3. **Streaming**
   - Set proper SSE headers
   - Parse OpenRouter's SSE stream
   - Extract delta content from each chunk
   - Forward chunks to frontend
   - Close connection properly

4. **CORS Configuration**
   - Allow requests from frontend origin
   - Enable credentials if needed

### Example Backend Code Structure

```javascript
// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ALLOWED_MODELS = [
  'minimax/minimax-m2',
  'meta-llama/llama-4-scout:free',
  'tngtech/deepseek-r1t2-chimera:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'qwen/qwen3-coder:free'
];

app.post('/api/chat', async (req, res) => {
  // 1. Validate model
  // 2. Set SSE headers
  // 3. Call OpenRouter API with streaming
  // 4. Parse and forward stream
  // 5. Handle errors
});

app.listen(process.env.PORT || 3001);
```

---

## Frontend Specification

### Project Structure
```
frontend/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.js
└── .gitignore
```

### State Management

**Component State:**
```javascript
const [selectedModel, setSelectedModel] = useState('minimax/minimax-m2');
const [messages, setMessages] = useState([]);
const [inputValue, setInputValue] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
```

**Message Object Structure:**
```javascript
{
  role: 'user' | 'assistant',
  content: 'message text'
}
```

### UI Components

#### 1. Model Selector
- Dropdown/select element
- Lists all 5 supported models
- Shows model name (formatted for readability)
- Updates selectedModel state on change
- Disabled during message sending

#### 2. Chat Display Area
- Scrollable container
- Displays messages in chronological order
- User messages aligned right
- Assistant messages aligned left
- Auto-scrolls to bottom on new messages

#### 3. Message Bubbles
- User messages: Blue/purple background
- Assistant messages: Gray background
- Proper padding and border radius
- Markdown support (optional for MVP)

#### 4. Input Area
- Text input field
- Send button
- Disabled during loading
- Clear input after sending
- Handle Enter key to send

#### 5. Loading Indicator
- Show during API call
- Typing animation dots
- Disable input during loading

#### 6. Error Display
- Show error messages
- Dismissible alert
- Red/warning styling

### Frontend Implementation Requirements

1. **Model Selection**
   - Dropdown with all 5 models
   - Default to first model
   - Display user-friendly names

2. **Message Sending**
   - Validate input not empty
   - Add user message to state immediately
   - Call backend API
   - Handle streaming response

3. **Streaming Response Handling**
   ```javascript
   const response = await fetch('http://localhost:3001/api/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ model: selectedModel, messages })
   });

   const reader = response.body.getReader();
   const decoder = new TextDecoder();

   // Read stream and update UI incrementally
   ```

4. **Error Handling**
   - Network errors
   - API errors
   - Invalid responses
   - Display user-friendly messages

5. **UI/UX**
   - Responsive design
   - Clean, minimal interface
   - Smooth animations
   - Auto-scroll to latest message
   - Focus input after sending

### Example Frontend Code Structure

```jsx
// App.jsx
import { useState } from 'react';

const MODELS = [
  { id: 'minimax/minimax-m2', name: 'MiniMax M2' },
  { id: 'meta-llama/llama-4-scout:free', name: 'Llama 4 Scout (Free)' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera (Free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat V3 (Free)' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (Free)' }
];

function App() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    // Implementation
  };

  return (
    <div className="app">
      <header>
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
          {MODELS.map(model => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
      </header>
      
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>Send</button>
      </div>
    </div>
  );
}

export default App;
```

---

## Error Handling

### Backend Errors

**Invalid Model:**
```json
{
  "error": "Invalid model selected"
}
```
Status: 400

**Missing API Key:**
```json
{
  "error": "OpenRouter API key not configured"
}
```
Status: 500

**OpenRouter API Error:**
```json
{
  "error": "Failed to get response from AI model"
}
```
Status: 502

**Network Timeout:**
```json
{
  "error": "Request timeout"
}
```
Status: 504

### Frontend Error Display

- Show error in red alert box
- Allow user to retry
- Clear error on new message
- Log errors to console for debugging

---

## Styling Guidelines

### Design Principles
- Clean, minimal interface
- Focus on chat experience
- Responsive (mobile-friendly)
- Good contrast for readability
- Smooth transitions

### Color Scheme (Suggested)
- Background: `#f5f5f5` or `#1a1a1a` (light/dark)
- User messages: `#007bff` (blue)
- Assistant messages: `#e9ecef` (gray)
- Text: `#333` or `#fff`
- Borders: `#ddd` or `#444`

### Layout
- Header: Fixed top, model selector
- Chat area: Flex-grow, scrollable
- Input area: Fixed bottom, full width

---

## Development Workflow

### Setup Steps

1. **Backend Setup**
   ```bash
   cd backend
   npm init -y
   npm install express cors dotenv node-fetch
   # Create .env with OPENROUTER_API_KEY
   node server.js
   ```

2. **Frontend Setup**
   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install
   npm run dev
   ```

### Environment Configuration

**Backend .env:**
```
OPENROUTER_API_KEY=sk-or-v1-xxxxx
PORT=3001
```

**Frontend (if needed):**
```
VITE_API_URL=http://localhost:3001
```

### Running the Application

1. Start backend: `node server.js` (from backend folder)
2. Start frontend: `npm run dev` (from frontend folder)
3. Open browser to `http://localhost:5173`

---

## Testing Checklist

- [ ] Model selector shows all 5 models
- [ ] Can send message with each model
- [ ] Response streams in real-time
- [ ] User messages appear immediately
- [ ] Assistant messages update incrementally
- [ ] Switching models works between messages
- [ ] Error handling for network failures
- [ ] Error handling for invalid API key
- [ ] Input clears after sending
- [ ] Chat scrolls to bottom automatically
- [ ] Loading state disables input
- [ ] Can send multiple messages in succession
- [ ] UI is responsive on mobile
- [ ] No console errors

---

## Deployment Notes

### Backend Deployment
- Set `OPENROUTER_API_KEY` in environment
- Set `PORT` if required by hosting platform
- Enable CORS for frontend origin
- Use production Node.js version

### Frontend Deployment
- Update API URL to production backend
- Build with `npm run build`
- Serve `dist` folder
- Configure CORS on backend

### Environment Variables
- Never commit `.env` files
- Use platform-specific secret management
- Keep API keys secure

---

## API Reference Summary

### OpenRouter Chat Completions API

**Endpoint:** `POST https://openrouter.ai/api/v1/chat/completions`

**Authentication:** Bearer token in Authorization header

**Request Body:**
```json
{
  "model": "minimax/minimax-m2",
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "stream": true
}
```

**Response:** SSE stream with chunks:
```
data: {"id":"gen-xxx","choices":[{"delta":{"content":"Hello"}}]}

data: [DONE]
```

**Documentation:** https://openrouter.ai/docs

---

## Constraints & Limitations

1. **No Authentication:** Anyone can use the app
2. **No Persistence:** Messages lost on refresh
3. **No History:** Each session is independent
4. **No User Profiles:** Single anonymous user
5. **No Rate Limiting:** Relies on OpenRouter limits
6. **No Message Editing:** Cannot edit sent messages
7. **No File Uploads:** Text only
8. **No Multi-user Chat:** Single conversation thread

---

## MVP Scope

**In Scope:**
- 5 model dropdown
- Send text messages
- Receive streaming responses
- Basic error handling
- Simple, clean UI

**Out of Scope:**
- User authentication
- Message persistence
- Chat history
- Multiple conversations
- File uploads
- Image generation
- Voice input
- Mobile app
- Advanced markdown rendering
- Message reactions
- Typing indicators (from user)
- Read receipts

---

## Performance Considerations

1. **Streaming:** Use SSE for real-time response updates
2. **State Updates:** Batch updates for smooth rendering
3. **Scroll Performance:** Use auto-scroll only when needed
4. **Memory:** Clear old messages if conversation is very long (optional)
5. **Network:** Handle slow connections gracefully

---

## Security Notes

1. **API Key:** Never expose in frontend code
2. **CORS:** Restrict to known origins in production
3. **Input Validation:** Sanitize user input
4. **Rate Limiting:** Consider adding rate limits
5. **Error Messages:** Don't expose sensitive information

---

## Future Enhancements (Post-MVP)

- Message persistence (localStorage or database)
- Multiple conversation threads
- Export chat history
- Markdown rendering with syntax highlighting
- Dark/light theme toggle
- System prompts
- Temperature and token controls
- Message regeneration
- Copy message button
- Model comparison mode

---

## File Checklist

### Backend Files
- [ ] `server.js` - Express server with SSE streaming
- [ ] `package.json` - Dependencies and scripts
- [ ] `.env.example` - Example environment variables
- [ ] `.gitignore` - Ignore node_modules and .env

### Frontend Files
- [ ] `src/App.jsx` - Main React component
- [ ] `src/App.css` - Component styles
- [ ] `src/main.jsx` - React entry point
- [ ] `src/index.css` - Global styles
- [ ] `package.json` - Dependencies and scripts
- [ ] `vite.config.js` - Vite configuration
- [ ] `.gitignore` - Ignore node_modules and dist

### Documentation
- [ ] `README.md` - Setup and usage instructions
- [ ] `context.md` - This file

---

## Dependencies

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

---

## Success Criteria

The MVP is complete when:
1. User can select any of the 5 models
2. User can type and send messages
3. Assistant responses stream in real-time
4. Switching models between messages works
5. Basic error handling is implemented
6. UI is clean and functional
7. No authentication is required
8. Code is organized and readable