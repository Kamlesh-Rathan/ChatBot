// chatManager.js - Handles all chat persistence logic using localStorage

const STORAGE_KEY = 'chatbot_chats';
const ACTIVE_CHAT_KEY = 'chatbot_active_chat';

/**
 * Generate a unique ID for a chat
 */
function generateId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate auto chat name based on timestamp or first message
 */
function generateChatName(chatNumber) {
    return `Chat ${chatNumber}`;
}

/**
 * Get all chats from localStorage
 */
export function getAllChats() {
    try {
        const chatsJson = localStorage.getItem(STORAGE_KEY);
        if (!chatsJson) return [];
        return JSON.parse(chatsJson);
    } catch (error) {
        console.error('Error loading chats:', error);
        return [];
    }
}

/**
 * Get a specific chat by ID
 */
export function getChatById(id) {
    const chats = getAllChats();
    return chats.find(chat => chat.id === id) || null;
}

/**
 * Create a new chat with default values
 */
export function createNewChat() {
    const chats = getAllChats();
    const chatNumber = chats.length + 1;

    const newChat = {
        id: generateId(),
        name: generateChatName(chatNumber),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: 'z-ai/glm-4.5-air:free', // Default model
        messages: [{
            role: 'system',
            content: 'You are a helpful AI assistant. Always respond in English with a professional tone.'
        }],
        messageVersions: {},
        currentVersionIndex: {}
    };

    chats.push(newChat);
    saveAllChats(chats);
    setActiveChat(newChat.id);

    return newChat;
}

/**
 * Update an existing chat
 */
export function updateChat(id, data) {
    const chats = getAllChats();
    const chatIndex = chats.findIndex(chat => chat.id === id);

    if (chatIndex === -1) {
        console.error('Chat not found:', id);
        return null;
    }

    // Merge the updates with existing data
    chats[chatIndex] = {
        ...chats[chatIndex],
        ...data,
        updatedAt: Date.now()
    };

    saveAllChats(chats);
    return chats[chatIndex];
}

/**
 * Delete a chat by ID
 */
export function deleteChat(id) {
    const chats = getAllChats();
    const filteredChats = chats.filter(chat => chat.id !== id);
    saveAllChats(filteredChats);

    // If deleted chat was active, clear active chat
    const activeId = getActiveChatId();
    if (activeId === id) {
        localStorage.removeItem(ACTIVE_CHAT_KEY);

        // Set most recent chat as active if any chats remain
        if (filteredChats.length > 0) {
            const mostRecent = filteredChats.sort((a, b) => b.updatedAt - a.updatedAt)[0];
            setActiveChat(mostRecent.id);
        }
    }

    return filteredChats;
}

/**
 * Save all chats to localStorage
 */
function saveAllChats(chats) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
        console.error('Error saving chats:', error);
    }
}

/**
 * Set the active chat ID
 */
export function setActiveChat(id) {
    localStorage.setItem(ACTIVE_CHAT_KEY, id);
}

/**
 * Get the active chat ID
 */
export function getActiveChatId() {
    return localStorage.getItem(ACTIVE_CHAT_KEY);
}

/**
 * Get the active chat object
 */
export function getActiveChat() {
    const activeId = getActiveChatId();
    if (!activeId) return null;
    return getChatById(activeId);
}

/**
 * Initialize chat storage - create first chat if none exist
 */
export function initializeChatStorage() {
    const chats = getAllChats();

    if (chats.length === 0) {
        return createNewChat();
    }

    // Ensure there's an active chat
    const activeId = getActiveChatId();
    if (!activeId || !getChatById(activeId)) {
        // Set most recent chat as active
        const mostRecent = chats.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setActiveChat(mostRecent.id);
        return mostRecent;
    }

    return getActiveChat();
}
