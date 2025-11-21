import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Landing.css';

export default function Landing() {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(true); // Change true or false to switch between dark and light mode
    const handleGetStarted = () => {
        navigate('/chat');
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
    };

    return (
        <div className="landing" data-theme={isDarkMode ? 'dark' : 'light'}>
            <Navbar onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Talk to Multiple AI Models</h1>
                    <p>Experience cutting-edge AI conversations with real-time streaming, multiple models, and intelligent API key rotation.</p>
                    <button className="cta-button" onClick={handleGetStarted}>
                        Start Chatting Now →
                    </button>
                </div>
                <div className="hero-image">
                    <div className="floating-card">
                        <span className="card-icon">⚡</span>
                        <p>Lightning Fast</p>
                    </div>
                    <div className="floating-card">
                        <span className="card-icon">🤖</span>
                        <p>AI Powered</p>
                    </div>
                    <div className="floating-card">
                        <span className="card-icon">🔄</span>
                        <p>Auto Rotation</p>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <h2>Why Choose Our Chatbot?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Real-time Streaming</h3>
                        <p>Watch responses appear word-by-word as they're generated, creating a natural conversation experience.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔄</div>
                        <h3>API Key Rotation</h3>
                        <p>Automatic failover to backup API keys when rate limits are hit. Never get interrupted again.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>Multiple AI Models</h3>
                        <p>Switch between 4 powerful AI models instantly. Find the perfect AI for your task.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎨</div>
                        <h3>Beautiful Interface</h3>
                        <p>Clean, intuitive design that makes chatting effortless. Works great on desktop and mobile.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Privacy Focused</h3>
                        <p>No authentication required. Your conversations stay private. No tracking or data collection.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">⚙️</div>
                        <h3>Easy Setup</h3>
                        <p>Get started in minutes. Start chatting with advanced AI instantly.</p>
                    </div>
                </div>
            </section>

            {/* Models Section */}
            <section id="models" className="models">
                <h2>Supported AI Models</h2>
                <div className="models-grid">
                    <div className="model-card">
                        <h4>Z.AI GLM 4.5 Air</h4>
                        <p className="model-provider">by Z.AI</p>
                        <p className="model-description">Fast and efficient for general conversations</p>
                        <span className="model-badge free">Free</span>
                    </div>

                    <div className="model-card">
                        <h4>DeepSeek R1T2 Chimera</h4>
                        <p className="model-provider">by DeepSeek</p>
                        <p className="model-description">Specialized deep learning model</p>
                        <span className="model-badge free">Free</span>
                    </div>

                    <div className="model-card">
                        <h4>DeepSeek Chat V3</h4>
                        <p className="model-provider">by DeepSeek</p>
                        <p className="model-description">Latest version with enhanced conversations</p>
                        <span className="model-badge free">Free</span>
                    </div>

                    <div className="model-card">
                        <h4>Qwen3 Coder</h4>
                        <p className="model-provider">by Alibaba</p>
                        <p className="model-description">Perfect for coding and technical tasks</p>
                        <span className="model-badge free">Free</span>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <h2>How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Select Your Model</h3>
                        <p>Choose from 4 powerful AI models that suit your needs</p>
                    </div>

                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Start Chatting</h3>
                        <p>Type your message and watch the AI respond in real-time</p>
                    </div>

                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Automatic Failover</h3>
                        <p>If one key hits a rate limit, we automatically switch to the next one</p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="faq">
                <h2>Frequently Asked Questions</h2>
                <div className="faq-grid">
                    <div className="faq-item">
                        <h4>Do I need to create an account?</h4>
                        <p>No! Our chatbot is completely free to use without any registration. Just start chatting!</p>
                    </div>

                    <div className="faq-item">
                        <h4>How does API key rotation work?</h4>
                        <p>When one API key hits a rate limit, our system automatically switches to the next available key. This ensures uninterrupted conversations.</p>
                    </div>

                    <div className="faq-item">
                        <h4>Which model should I choose?</h4>
                        <p>Try different models to see which works best for you. GLM 4.5 Air is great for general tasks, while Qwen3 is perfect for coding.</p>
                    </div>

                    <div className="faq-item">
                        <h4>Is my data private?</h4>
                        <p>Yes! We don't store your conversations. All data goes directly to OpenRouter, and we don't track or collect any information.</p>
                    </div>

                    <div className="faq-item">
                        <h4>Can I use multiple API keys?</h4>
                        <p>Absolutely! You can add multiple API keys separated by commas. Great for managing rate limits across different keys.</p>
                    </div>

                    <div className="faq-item">
                        <h4>How much does it cost?</h4>
                        <p>The chatbot itself is free! You only pay for API calls through OpenRouter. Most models we support are completely free to use.</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
