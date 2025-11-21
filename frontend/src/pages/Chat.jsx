import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import '../App.css';

const MODELS = [
  { id: 'z-ai/glm-4.5-air:free', name: 'Z.AI: GLM 4.5 Air' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat V3' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder' }
];

export default function Chat() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [modelSwitched, setModelSwitched] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [messageVersions, setMessageVersions] = useState({}); // {messageIndex: [versions]}
  const [currentVersionIndex, setCurrentVersionIndex] = useState({}); // {messageIndex: versionIndex}
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Show brief indicator when model is switched
  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
    setModelSwitched(true);
    setTimeout(() => setModelSwitched(false), 2000);
  };

  const scrollToBottom = () => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const jumpToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsUserScrolling(false);
  };

  // Detect if user is manually scrolling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
      setIsUserScrolling(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isUserScrolling]);

  useEffect(() => {
    // Apply theme to document element
    if (isDarkMode) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const startEditingMessage = (index, content) => {
    setEditingMessageIndex(index);
    setEditingContent(content);
  };

  const cancelEditing = () => {
    setEditingMessageIndex(null);
    setEditingContent('');
  };

  const saveEditedMessage = async () => {
    if (!editingContent.trim() || editingMessageIndex === null) return;

    const versions = messageVersions[editingMessageIndex] || [messages[editingMessageIndex].content];

    // Check if already at max versions (5 edits = 6 total versions)
    if (versions.length >= 6) {
      setError('Maximum 5 edits allowed per message');
      return;
    }

    // Add new version
    const newVersions = [...versions, editingContent];
    const newVersionIndex = newVersions.length - 1;

    // Update message with new content
    const updatedMessages = [...messages];
    updatedMessages[editingMessageIndex] = {
      ...updatedMessages[editingMessageIndex],
      content: editingContent
    };

    // Remove all messages after the edited one (to regenerate responses)
    const messagesToKeep = updatedMessages.slice(0, editingMessageIndex + 1);

    setMessages(messagesToKeep);
    setMessageVersions({
      ...messageVersions,
      [editingMessageIndex]: newVersions
    });
    setCurrentVersionIndex({
      ...currentVersionIndex,
      [editingMessageIndex]: newVersionIndex
    });
    setEditingMessageIndex(null);
    setEditingContent('');
    setIsLoading(true);
    setError(null);

    // Regenerate AI response
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesToKeep.map(({ role, content }) => ({ role, content }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };

      setMessages(prev => [...prev, { ...assistantMessage }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                setError(parsed.error);
                setIsLoading(false);
                return;
              }

              if (parsed.done) {
                setIsLoading(false);
                return;
              }

              if (parsed.content) {
                assistantMessage.content += parsed.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
      setIsLoading(false);
    } finally {
      document.querySelector('.input-container textarea')?.focus();
    }
  };

  const switchToVersion = (messageIndex, versionIndex) => {
    const versions = messageVersions[messageIndex];
    if (!versions || versionIndex < 0 || versionIndex >= versions.length) return;

    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: versions[versionIndex]
    };

    setMessages(updatedMessages);
    setCurrentVersionIndex({
      ...currentVersionIndex,
      [messageIndex]: versionIndex
    });
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage = { role: 'user', content: inputValue };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    // Reset textarea height
    const textarea = document.querySelector('.input-container textarea');
    if (textarea) textarea.style.height = 'auto';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: updatedMessages.map(({ role, content }) => ({ role, content }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { ...assistantMessage }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                setError(parsed.error);
                setIsLoading(false);
                return;
              }

              if (parsed.done) {
                setIsLoading(false);
                return;
              }

              if (parsed.content) {
                assistantMessage.content += parsed.content;
                // Update the last message (assistant) with accumulated content
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
      setIsLoading(false);
    } finally {
      // Refocus input for next message
      document.querySelector('.input-container input')?.focus();
    }
  };

  return (
    <div className="app">

      <header className="header">
        <h1>AI Chatbot</h1>
        <div className="header-controls">
          <div className="model-selector">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isLoading}
              className={`glass-select ${modelSwitched ? 'model-switched' : ''}`}
            >
              {MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          <button className="theme-toggle-inline" onClick={toggleTheme}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {error && (
        <div className={`error-banner ${error.includes('rate limit') ? 'rate-limit' : ''}`}>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.role === 'user' && editingMessageIndex === index ? (
              // Editing mode
              <div className="edit-message-container">
                <textarea
                  value={editingContent}
                  onChange={(e) => {
                    setEditingContent(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                  autoFocus
                  className="edit-message-textarea"
                  rows={1}
                  style={{
                    minHeight: '48px',
                    maxHeight: '200px',
                    resize: 'none',
                    overflow: 'auto'
                  }}
                />
                <div className="edit-message-actions">
                  <button onClick={cancelEditing} className="edit-cancel-btn">
                    Cancel
                  </button>
                  <button onClick={saveEditedMessage} className="edit-send-btn">
                    Send
                  </button>
                </div>
              </div>
            ) : (
              // Display mode
              <div className="message-content">
                {message.role === 'user' ? (
                  <>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="code-block">
                              <div className="code-header">
                                <span className="code-language">{match[1]}</span>
                                <button
                                  className="copy-button"
                                  onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                >
                                  Copy
                                </button>
                              </div>
                              <pre className={className}>
                                <code {...props}>{children}</code>
                              </pre>
                            </div>
                          ) : (
                            <code className={className} {...props}>{children}</code>
                          )
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </>
                ) : (
                  <>
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex, rehypeHighlight]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="code-block">
                              <div className="code-header">
                                <span className="code-language">{match[1]}</span>
                                <button
                                  className="copy-button"
                                  onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                                >
                                  Copy
                                </button>
                              </div>
                              <pre className={className}>
                                <code {...props}>{children}</code>
                              </pre>
                            </div>
                          ) : (
                            <code className={className} {...props}>{children}</code>
                          )
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    <button
                      className="copy-response-button"
                      onClick={() => {
                        navigator.clipboard.writeText(message.content);
                      }}
                      title="Copy response"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {isUserScrolling && (
        <button
          className="scroll-to-bottom-button"
          onClick={jumpToBottom}
          title="Scroll to bottom"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      )}

      <div className="input-container">
        <textarea
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            // Auto-grow textarea
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isLoading && inputValue.trim()) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={isLoading}
          rows={1}
          style={{
            minHeight: '48px',
            maxHeight: '200px',
            resize: 'none',
            overflow: 'auto'
          }}
        />
        <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
