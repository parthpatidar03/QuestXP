import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, MessageSquare, Minimize2 } from 'lucide-react';
import api from '../../services/api';

/**
 * Renders markdown-like text: **bold**, *italic*, `code`, bullet/numbered lists, line breaks.
 * No extra library needed.
 */
function MarkdownText({ text }) {
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                // Render inline formatting: **bold**, *italic*, `code`
                const renderInline = (str) => {
                    // Split on bold, italic, code
                    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
                    return parts.map((part, j) => {
                        if (/^\*\*[^*]+\*\*$/.test(part)) {
                            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        if (/^\*[^*]+\*$/.test(part)) {
                            return <em key={j} className="italic">{part.slice(1, -1)}</em>;
                        }
                        if (/^`[^`]+`$/.test(part)) {
                            return <code key={j} className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(0,180,255,0.12)', color: '#00e5ff' }}>{part.slice(1, -1)}</code>;
                        }
                        return part;
                    });
                };
                // Bullet list
                if (/^[-•]\s/.test(line)) {
                    return <div key={i} className="flex gap-2 items-start"><span style={{ color: '#00b4ff' }}>•</span><span>{renderInline(line.replace(/^[-•]\s/, ''))}</span></div>;
                }
                // Numbered list
                if (/^\d+\.\s/.test(line)) {
                    const [num, ...rest] = line.split(/\.\s/);
                    return <div key={i} className="flex gap-2 items-start"><span style={{ color: '#00b4ff', minWidth: '1rem' }} className="font-bold">{num}.</span><span>{renderInline(rest.join('. '))}</span></div>;
                }
                // Heading (## or ###)
                if (/^#{2,3}\s/.test(line)) {
                    return <p key={i} className="font-bold text-white mt-2">{renderInline(line.replace(/^#{2,3}\s/, ''))}</p>;
                }
                return <p key={i}>{renderInline(line)}</p>;
            })}
        </div>
    );
}

/**
 * Simple LLM Chatbot — no RAG, uses GPT-4o-mini with course/lecture context.
 * Props:
 *   lectureId  — MongoDB ID of the current lecture
 *   courseTitle — name of the course (for system prompt context)
 *   lectureTitle — name of the current lecture
 */
const DoubtChatbot = ({ lectureId, courseTitle = '', lectureTitle = '' }) => {
    const [open, setOpen] = useState(false);
    // messages: { role: 'user' | 'bot', text: string }
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    // Reset conversation when lecture changes
    useEffect(() => {
        setMessages([]);
        setInput('');
    }, [lectureId]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const question = input.trim();
        setInput('');
        const userMsg = { role: 'user', text: question };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            // Build history in OpenAI format for multi-turn
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text
            }));

            const res = await api.post(`/doubts/${lectureId}/simple`, {
                questionText: question,
                courseTitle,
                lectureTitle,
                history
            });

            setMessages(prev => [...prev, { role: 'bot', text: res.data.answer || 'No response.' }]);
        } catch (err) {
            const msg = err.response?.status === 429
                ? '⚠️ Too many requests — wait a moment before trying again.'
                : '⚠️ Failed to get a response. Please try again.';
            setMessages(prev => [...prev, { role: 'bot', text: msg }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                    background: 'linear-gradient(135deg, #00e5ff, #00b4ff)',
                    boxShadow: open ? '0 0 16px rgba(0,229,255,0.5)' : '0 0 24px rgba(0,229,255,0.7)',
                    animation: open ? 'none' : 'glow-pulse 2.5s ease-in-out infinite'
                }}
                title="Ask Doubt Bot"
            >
                {open
                    ? <Minimize2 className="w-5 h-5 text-[#0d0f1a]" />
                    : <Bot className="w-6 h-6 text-[#0d0f1a]" />
                }
            </button>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 28, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 28, scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="fixed bottom-24 right-6 z-40 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            width: 'min(380px, calc(100vw - 2rem))',
                            maxHeight: '72vh',
                            border: '1px solid rgba(0,229,255,0.28)',
                            background: 'rgba(13,15,26,0.97)',
                            backdropFilter: 'blur(20px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: '#1a1e35', background: 'rgba(0,229,255,0.05)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.35)' }}>
                                <Bot className="w-4 h-4 text-[#00e5ff]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white">Doubt Bot</p>
                                <p className="text-xs truncate" style={{ color: '#8b9cc8' }}>
                                    {lectureTitle ? `📺 ${lectureTitle}` : 'Ask anything about this lecture'}
                                </p>
                            </div>
                            {messages.length > 0 && (
                                <button
                                    onClick={() => setMessages([])}
                                    className="text-xs px-2 py-1 rounded-lg transition-colors"
                                    style={{ color: '#4a5480', background: 'rgba(255,255,255,0.05)' }}
                                    title="Clear chat"
                                >
                                    Clear
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-[#4a5480] hover:text-white transition-colors ml-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {messages.length === 0 && !loading && (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <MessageSquare className="w-8 h-8 mb-3" style={{ color: '#2a2f52' }} />
                                    <p className="text-sm font-semibold text-white mb-1">Ask Anything</p>
                                    <p className="text-xs" style={{ color: '#4a5480' }}>
                                        I'm your AI tutor for this lecture. Ask me to explain concepts, solve problems, or clarify doubts.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'bot' && (
                                        <div className="w-6 h-6 rounded-full shrink-0 mt-1 flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.25)' }}>
                                            <Bot className="w-3.5 h-3.5 text-[#00e5ff]" />
                                        </div>
                                    )}
                                    <div
                                        className="max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed"
                                        style={msg.role === 'user'
                                            ? { background: 'rgba(0,180,255,0.18)', border: '1px solid rgba(0,180,255,0.3)', color: '#eef2ff', borderBottomRightRadius: 4 }
                                            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', borderBottomLeftRadius: 4 }
                                        }
                                    >
                                        {msg.role === 'bot'
                                            ? <MarkdownText text={msg.text} />
                                            : msg.text
                                        }
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-2 items-center">
                                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.15)' }}>
                                        <Bot className="w-3.5 h-3.5 text-[#00e5ff]" />
                                    </div>
                                    <div className="flex gap-1.5 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        {[0, 150, 300].map(d => (
                                            <span key={d} className="w-2 h-2 bg-[#00e5ff] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 pb-4 pt-2 flex gap-2 shrink-0 border-t" style={{ borderColor: '#1a1e35' }}>
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a doubt…"
                                rows={1}
                                disabled={loading}
                                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(42,47,82,0.8)',
                                    color: '#eef2ff',
                                    maxHeight: 80,
                                    fontFamily: "'Space Grotesk', sans-serif"
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 self-end"
                                style={{
                                    background: 'linear-gradient(135deg, #00b4ff, #0055ff)',
                                    boxShadow: (!input.trim() || loading) ? 'none' : '0 0 12px rgba(0,180,255,0.45)',
                                    opacity: (!input.trim() || loading) ? 0.35 : 1
                                }}
                            >
                                {loading
                                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    : <Send className="w-4 h-4 text-white" />
                                }
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default DoubtChatbot;
