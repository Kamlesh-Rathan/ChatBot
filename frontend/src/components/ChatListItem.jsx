import { useState } from 'react';
import './ChatListItem.css';

export default function ChatListItem({ chat, isActive, onSelect, onRename, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(chat.name);

    const handleNameClick = (e) => {
        if (!isActive) return;
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleNameBlur = () => {
        setIsEditing(false);
        if (editedName.trim() && editedName !== chat.name) {
            onRename(chat.id, editedName.trim());
        } else {
            setEditedName(chat.name);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        } else if (e.key === 'Escape') {
            setEditedName(chat.name);
            setIsEditing(false);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${chat.name}"?`)) {
            onDelete(chat.id);
        }
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div
            className={`chat-list-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(chat.id)}
        >
            <div className="chat-item-content">
                {isEditing ? (
                    <input
                        type="text"
                        className="chat-name-input"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={handleNameBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="chat-name" onClick={handleNameClick}>
                        {chat.name}
                    </div>
                )}
                <div className="chat-date">{formatDate(chat.updatedAt)}</div>
            </div>
            <button
                className="chat-delete-btn"
                onClick={handleDelete}
                title="Delete chat"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    );
}
