import { useState } from 'react';
import './Navbar.css';

export default function Navbar({ onThemeToggle, isDarkMode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">AI Chatbot</span>
                </div>

                <button
                    className="hamburger"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    ☰
                </button>

                <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                    <li><a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a></li>
                    <li><a href="#models" onClick={() => setIsMenuOpen(false)}>Models</a></li>
                    <li><a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a></li>
                    {onThemeToggle && (
                        <li>
                            <button className="theme-toggle-nav" onClick={onThemeToggle}>
                                {isDarkMode ? '☀️' : '🌙'}
                            </button>
                        </li>
                    )}
                    <li><a href="/chat" className="nav-menu">Start Chatting</a></li>
                </ul>
            </div>
        </nav>
    );
}
