import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi there! I am the IdeaSpace Assistant. What would you like to know about the project?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        const history = messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`).join('\n');
        const prompt = `System: You are a helpful AI assistant for a web platform called 'IdeaSpace', which is a Startup Idea Validator dashboard built using React and an Express/SQLite backend. Users can submit, view, upvote, favorite, edit, and discuss startup ideas. Keep your answers brief, friendly, and helpful. Do not use Markdown, use plain text.\n\nConversation so far:\n${history}\nUser: ${userMsg}\nAssistant:`;

        try {
            const apiKey = "AIzaSyCUN6qDKguvNpQMJugH4f3Z5riBLIgP45Q";
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!res.ok) {
                throw new Error("API responded with an error");
            }

            const data = await res.json();
            const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I got confused!';

            setMessages(prev => [...prev, { role: 'model', text: aiReply }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I could not connect to my brain right now. Try again later!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {isOpen && (
                <div style={{
                    width: '320px',
                    height: '450px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '1rem',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: '600'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageCircle size={20} />
                            IdeaSpace Assistant
                        </div>
                        <button
                            onClick={toggleOpen}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-base)',
                                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '12px',
                                maxWidth: '85%',
                                lineHeight: '1.4',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', background: 'var(--bg-base)', color: 'var(--text-secondary)', padding: '0.6rem 0.8rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                Typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} style={{
                        display: 'flex',
                        padding: '0.8rem',
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--bg-surface)',
                        gap: '0.5rem'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            style={{
                                flex: 1,
                                padding: '0.6rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-base)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            style={{
                                background: 'var(--accent-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                                opacity: (isLoading || !input.trim()) ? 0.6 : 1
                            }}
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            <button
                onClick={toggleOpen}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    boxShadow: 'var(--shadow-lg)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                    transform: isOpen ? 'scale(0.9)' : 'scale(1)'
                }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
}

export default ChatBot;
