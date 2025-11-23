import ChatListItem from './ChatListItem';
import './ChatHistorySidebar.css';

export default function ChatHistorySidebar({
    chats,
    currentChatId,
    onSelectChat,
    onNewChat,
    onDeleteChat,
    onRenameChat,
    visible,
    onClose
}) {
    return (
        <>
            {/* Mobile overlay backdrop */}
            {visible && (
                <div className="sidebar-overlay" onClick={onClose}></div>
            )}

            <div className={`chat-sidebar ${visible ? 'visible' : ''}`}>
                <div className="sidebar-header">
                    <h2>Chat History</h2>
                    <button className="close-sidebar-btn" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <button className="new-chat-btn" onClick={onNewChat}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New Chat
                </button>

                <div className="chat-list">
                    {chats.length === 0 ? (
                        <div className="empty-state">
                            <p>No chats yet</p>
                            <p className="empty-state-hint">Click "New Chat" to start</p>
                        </div>
                    ) : (
                        chats
                            .sort((a, b) => b.updatedAt - a.updatedAt)
                            .map(chat => (
                                <ChatListItem
                                    key={chat.id}
                                    chat={chat}
                                    isActive={chat.id === currentChatId}
                                    onSelect={onSelectChat}
                                    onRename={onRenameChat}
                                    onDelete={onDeleteChat}
                                />
                            ))
                    )}
                </div>
            </div>
        </>
    );
}
