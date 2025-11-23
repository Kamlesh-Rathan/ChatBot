import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import ChatHistorySidebar from '../components/ChatHistorySidebar';
import {
  initializeChatStorage,
  getAllChats,
  createNewChat,
  updateChat,
  deleteChat,
  getChatById,
  setActiveChat
} from '../utils/chatManager';
import '../App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const MODELS = [
  { id: 'z-ai/glm-4.5-air:free', name: 'Z.AI: GLM 4.5 Air' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat V3' },
  { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder' }
];

export default function Chat() {
  const navigate = useNavigate();

  // Chat history states
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Original states
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState([{
    role: 'system',
    content: 'You are a helpful AI assistant. Always respond in English with a professional tone.'
  }]);
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

  // Initialize chat history on mount
  useEffect(() => {
    const initialChat = initializeChatStorage();
    setChats(getAllChats());
    setCurrentChatId(initialChat.id);

    // Load the active chat's data
    setMessages(initialChat.messages);
    setSelectedModel(initialChat.model);
    setMessageVersions(initialChat.messageVersions || {});
    setCurrentVersionIndex(initialChat.currentVersionIndex || {});
  }, []);

  // Auto-save current chat when messages or model change
  useEffect(() => {
    if (!currentChatId) return;

    updateChat(currentChatId, {
      messages,
      model: selectedModel,
      messageVersions,
      currentVersionIndex
    });
  }, [messages, selectedModel, messageVersions, currentVersionIndex, currentChatId]);

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

  // Chat history management functions
  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats(getAllChats());
    setCurrentChatId(newChat.id);
    setMessages(newChat.messages);
    setSelectedModel(newChat.model);
    setMessageVersions({});
    setCurrentVersionIndex({});
    setSidebarVisible(false); // Close sidebar on mobile
  };

  const handleChatSelect = (chatId) => {
    if (chatId === currentChatId) {
      setSidebarVisible(false);
      return;
    }

    const chat = getChatById(chatId);
    if (!chat) return;

    setCurrentChatId(chatId);
    setMessages(chat.messages);
    setSelectedModel(chat.model);
    setMessageVersions(chat.messageVersions || {});
    setCurrentVersionIndex(chat.currentVersionIndex || {});
    setActiveChat(chatId);
    setSidebarVisible(false); // Close sidebar on mobile
  };

  const handleChatRename = (chatId, newName) => {
    updateChat(chatId, { name: newName });
    setChats(getAllChats());
  };

  const handleChatDelete = (chatId) => {
    const remainingChats = deleteChat(chatId);
    setChats(remainingChats);

    // If we deleted the current chat, switch to another or create new
    if (chatId === currentChatId) {
      if (remainingChats.length > 0) {
        const nextChat = remainingChats.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        handleChatSelect(nextChat.id);
      } else {
        handleNewChat();
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
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

    // Capture the current chat ID at the start of this request
    const requestChatId = currentChatId;

    // Keep messages up to the one being edited
    const messagesToKeep = messages.slice(0, editingMessageIndex + 1);
    messagesToKeep[editingMessageIndex] = {
      ...messagesToKeep[editingMessageIndex],
      content: editingContent
    };

    // Save the previous version if not already saved
    if (!messageVersions[editingMessageIndex]) {
      setMessageVersions({
        ...messageVersions,
        [editingMessageIndex]: [messages[editingMessageIndex].content, editingContent]
      });
      setCurrentVersionIndex({
        ...currentVersionIndex,
        [editingMessageIndex]: 1
      });
    } else if (!messageVersions[editingMessageIndex].includes(editingContent)) {
      const updatedVersions = [...messageVersions[editingMessageIndex], editingContent];
      setMessageVersions({
        ...messageVersions,
        [editingMessageIndex]: updatedVersions
      });
      setCurrentVersionIndex({
        ...currentVersionIndex,
        [editingMessageIndex]: updatedVersions.length - 1
      });
    }

    setMessages(messagesToKeep);
    setEditingMessageIndex(null);
    setEditingContent('');
    setIsLoading(true);
    setError(null);

    // Regenerate AI response
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
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
                fullContent += parsed.content;

                // CRITICAL: Only update if we're still on the same chat
                setMessages(prev => {
                  // Check if current chat is still the one that started this request
                  if (currentChatId !== requestChatId) {
                    // User switched chats, save to original chat
                    const originalChat = getChatById(requestChatId);
                    if (originalChat) {
                      const updatedChatMessages = [
                        ...messagesToKeep,
                        { role: 'assistant', content: fullContent }
                      ];
                      updateChat(requestChatId, { messages: updatedChatMessages });
                    }
                    return prev; // Don't update current view
                  }

                  // We're still on the same chat, update normally
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: fullContent
                  };
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
      console.error('Error regenerating response:', error);
      setError(`Failed to regenerate response: ${error.message}`);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
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

    // Capture the current chat ID at the start of this request
    const requestChatId = currentChatId;

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
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // Create initial assistant message
      const assistantMessage = { role: 'assistant', content: '' };

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
                fullContent += parsed.content;

                // CRITICAL: Only update if we're still on the same chat
                setMessages(prev => {
                  // Check if current chat is still the one that started this request
                  if (currentChatId !== requestChatId) {
                    // User switched chats, don't update current view
                    // But we should save to the original chat's messages
                    const originalChat = getChatById(requestChatId);
                    if (originalChat) {
                      const updatedChatMessages = [
                        ...originalChat.messages,
                        userMessage,
                        { role: 'assistant', content: fullContent }
                      ];
                      updateChat(requestChatId, { messages: updatedChatMessages });
                    }
                    return prev; // Don't update current view
                  }

                  // We're still on the same chat, update normally
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    ...newMessages[newMessages.length - 1],
                    content: fullContent
                  };
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
      setIsLoading(false);
      document.querySelector('.input-container textarea')?.focus();
    }
  };

  return (
    <div className="chat-container">
      <ChatHistorySidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleChatSelect}
        onRenameChat={handleChatRename}
        onDeleteChat={handleChatDelete}
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      <div className="chat-main">
        <header className="header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>
          <h1>AI Chat</h1>
          <div className="header-controls">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isLoading}
              className={modelSwitched ? 'model-switched' : ''}
            >
              {MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
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
          {messages.filter(message => message.role !== 'system').map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {message.role === 'user' && editingMessageIndex === index ? (
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
                <div className="message-content">
                  {message.role === 'user' ? (
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
                  ) : (
                    <div className="assistant-message-container">
                      <div className="assistant-message-content">
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
                      </div>
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
                    </div>
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
              resize: 'none'
            }}
          />
          <button onClick={sendMessage} disabled={isLoading || !inputValue.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}