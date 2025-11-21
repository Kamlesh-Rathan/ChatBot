import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h4>About</h4>
                    <p>AI Chatbot is a powerful tool that connects you with multiple AI models through a simple, intuitive interface.</p>
                </div>

                <div className="footer-section">
                    <h4>Features</h4>
                    <ul>
                        <li><a href="#features">Real-time Streaming</a></li>
                        <li><a href="#features">Multiple Models</a></li>
                        <li><a href="#features">API Key Rotation</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">OpenRouter</a></li>
                        <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                        <li><a href="#faq">FAQ</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Connect</h4>
                    <ul>
                        <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                        <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                        <li><a href="mailto:support@example.com">Email</a></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; 2025 AI Chatbot. All rights reserved.</p>
            </div>
        </footer>
    );
}
