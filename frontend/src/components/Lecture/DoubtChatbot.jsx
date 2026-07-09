import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2, MessageSquare, Minimize2, Lock, Zap } from 'lucide-react';
import { useFeatureGate } from '../../hooks/useFeatureGate';
import api from '../../services/api';
import { MAINTENANCE_CONFIG } from '../../constants/maintenance';
import AiBadge from '../ui/AiBadge';

/**
 * Renders markdown-like text: **bold**, *italic*, `code`, bullet/numbered lists, line breaks.
 */
function MarkdownText({ text }) {
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                const renderInline = (str) => {
                    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
                    return parts.map((part, j) => {
                        if (/^\*\*[^*]+\*\*$/.test(part)) {
                            return <strong key={j} className="text-text-primary font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        if (/^\*[^*]+\*$/.test(part)) {
                            return <em key={j} className="italic">{part.slice(1, -1)}</em>;
                        }
                        if (/^`[^`]+`$/.test(part)) {
                            return <code key={j} className="px-1 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary">{part.slice(1, -1)}</code>;
                        }
                        return part;
                    });
                };
                if (/^[-•]\s/.test(line)) {
                    return <div key={i} className="flex gap-2 items-start"><span className="text-primary">•</span><span>{renderInline(line.replace(/^[-•]\s/, ''))}</span></div>;
                }
                if (/^\d+\.\s/.test(line)) {
                    const [num, ...rest] = line.split(/\.\s/);
                    return <div key={i} className="flex gap-2 items-start"><span className="text-primary min-w-[1rem] font-bold">{num}.</span><span>{renderInline(rest.join('. '))}</span></div>;
                }
                if (/^#{2,3}\s/.test(line)) {
                    return <p key={i} className="font-bold text-text-primary mt-2">{renderInline(line.replace(/^#{2,3}\s/, ''))}</p>;
                }
                return <p key={i}>{renderInline(line)}</p>;
            })}
        </div>
    );
}

const DoubtChatbot = ({ lectureId, courseTitle = '', lectureTitle = '', isSidebarMode = false }) => {
    const { locked, requiredLevel, xpToUnlock } = useFeatureGate('DOUBT_CHATBOT_LIMITED');
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const constraintsRef = useRef(null);

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
        if (!input.trim() || loading || locked) return;
        const question = input.trim();
        setInput('');
        
        const userMsg = { role: 'user', text: question };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
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
        } catch (_) {
            const msg = _.response?.status === 429
                ? `⚠️ ${_.response.data.message || 'Rate limit reached — wait a moment before trying again.'}`
                : '⚠️ Failed to get a response. Please try again.';
            setMessages(prev => [...prev, { role: 'bot', text: msg }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (isSidebarMode) {
        return (
            <div className="flex flex-col w-full h-full bg-surface-2/30">
                {/* Header (without X button) */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5 shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 border border-primary/30">
                        <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary">Doubt Bot</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs truncate text-text-secondary">
                                {lectureTitle ? `📺 ${lectureTitle}` : 'Ask anything about this lecture'}
                            </p>
                            <AiBadge label="AI-powered" />
                        </div>
                    </div>
                </div>

                {/* Messages / Locked State */}
                <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3 relative min-h-0">
                    {locked ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-surface-2/50 backdrop-blur-[2px]">
                            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Feature Locked</h3>
                            <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                                Doubt Bot unlocks at <span className="text-primary font-bold">Level {requiredLevel}</span>. 
                                You need <span className="text-primary font-bold">{xpToUnlock} XP</span> more.
                            </p>
                            
                            <div className="w-full space-y-3 bg-primary/5 border border-primary/10 rounded-xl p-4">
                                <p className="text-xs font-bold text-primary uppercase tracking-widest">How to Unlock</p>
                                <div className="flex items-start gap-3 text-left">
                                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-xs text-text-secondary">Watch lectures to earn <span className="text-text-primary font-semibold">50 XP</span> each.</p>
                                </div>
                                <div className="flex items-start gap-3 text-left">
                                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-xs text-text-secondary">Complete quizzes to earn up to <span className="text-text-primary font-semibold">100 XP</span>.</p>
                                </div>
                            </div>
                        </div>
                    ) : MAINTENANCE_CONFIG.AI_FEATURES_DOWN ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <Bot className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-sm font-bold text-text-primary mb-2">Service Maintenance</p>
                            <p className="text-xs text-text-secondary leading-relaxed">{MAINTENANCE_CONFIG.MESSAGE}</p>
                        </div>
                    ) : (
                        <>
                            {messages.length === 0 && !loading && (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <MessageSquare className="w-8 h-8 mb-3 text-text-muted" />
                                    <p className="text-sm font-semibold text-text-primary mb-1">Ask Anything</p>
                                    <p className="text-xs text-text-secondary">I'm your AI tutor for this lecture. Ask me anything!</p>
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'bot' && (
                                        <div className="w-6 h-6 rounded-full shrink-0 mt-1 flex items-center justify-center bg-primary/10 border border-primary/20">
                                            <Bot className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                    <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20 text-text-primary rounded-br-sm' : 'bg-surface border border-border text-text-secondary rounded-bl-sm'}`}>
                                        {msg.role === 'bot' ? <MarkdownText text={msg.text} /> : msg.text}
                                    </div>
                                </div>
                            ))}
                            {loading && <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-primary/10"><Bot className="w-3.5 h-3.5 text-primary" /></div><div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-surface border border-border">{[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>}
                        </>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                {!locked && (
                    <div className="px-4 pb-4 pt-2 flex gap-2 shrink-0 border-t border-border bg-surface-2/95">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={MAINTENANCE_CONFIG.AI_FEATURES_DOWN ? "Service offline…" : "Ask a doubt…"}
                            rows={1}
                            disabled={loading || MAINTENANCE_CONFIG.AI_FEATURES_DOWN}
                            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-primary/50 disabled:opacity-50"
                            style={{ maxHeight: 80, fontFamily: "'Space Grotesk', sans-serif" }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading || MAINTENANCE_CONFIG.AI_FEATURES_DOWN}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 self-end ${(!input.trim() || loading || MAINTENANCE_CONFIG.AI_FEATURES_DOWN) ? 'bg-surface border border-border text-text-muted opacity-50' : 'bg-primary text-white shadow-sm hover:scale-105'}`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-50">
            {/* FAB Button */}
            <motion.button
                drag
                dragConstraints={constraintsRef}
                dragMomentum={false}
                dragElastic={0.1}
                whileDrag={{ scale: 1.1, zIndex: 60 }}
                onClick={() => setOpen(o => !o)}
                className="pointer-events-auto fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center bg-primary text-white shadow-[0_0_16px_rgba(var(--color-primary),0.5)] transition-shadow hover:shadow-[0_0_24px_rgba(var(--color-primary),0.6)] z-50"
                style={{
                    animation: open ? 'none' : 'glow-pulse 2.5s ease-in-out infinite'
                }}
            >
                {open ? <Minimize2 className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        drag
                        dragConstraints={constraintsRef}
                        dragMomentum={false}
                        dragElastic={0.1}
                        initial={{ opacity: 0, y: 28, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 28, scale: 0.94 }}
                        className="pointer-events-auto fixed bottom-40 right-6 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-surface-2/95 backdrop-blur-md z-40"
                        style={{
                            width: 'min(380px, calc(100vw - 2rem))',
                            maxHeight: '65vh',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5 shrink-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 border border-primary/30">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-primary">Doubt Bot</p>
                                <p className="text-xs truncate text-text-secondary">
                                    {lectureTitle ? `📺 ${lectureTitle}` : 'Ask anything about this lecture'}
                                </p>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors ml-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages / Locked State */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative min-h-[300px]">
                            {locked ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-surface-2/50 backdrop-blur-[2px]">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary mb-2">Feature Locked</h3>
                                    <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                                        Doubt Bot unlocks at <span className="text-primary font-bold">Level {requiredLevel}</span>. 
                                        You need <span className="text-primary font-bold">{xpToUnlock} XP</span> more.
                                    </p>
                                    
                                    <div className="w-full space-y-3 bg-primary/5 border border-primary/10 rounded-xl p-4">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">How to Unlock</p>
                                        <div className="flex items-start gap-3 text-left">
                                            <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <p className="text-xs text-text-secondary">Watch lectures to earn <span className="text-text-primary font-semibold">50 XP</span> each.</p>
                                        </div>
                                        <div className="flex items-start gap-3 text-left">
                                            <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <p className="text-xs text-text-secondary">Complete quizzes to earn up to <span className="text-text-primary font-semibold">100 XP</span>.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : MAINTENANCE_CONFIG.AI_FEATURES_DOWN ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                        <Bot className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <p className="text-sm font-bold text-text-primary mb-2">Service Maintenance</p>
                                    <p className="text-xs text-text-secondary leading-relaxed">{MAINTENANCE_CONFIG.MESSAGE}</p>
                                </div>
                            ) : (
                                <>
                                    {messages.length === 0 && !loading && (
                                        <div className="flex flex-col items-center justify-center py-10 text-center">
                                            <MessageSquare className="w-8 h-8 mb-3 text-text-muted" />
                                            <p className="text-sm font-semibold text-text-primary mb-1">Ask Anything</p>
                                            <p className="text-xs text-text-secondary">I'm your AI tutor for this lecture. Ask me anything!</p>
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'bot' && (
                                                <div className="w-6 h-6 rounded-full shrink-0 mt-1 flex items-center justify-center bg-primary/10 border border-primary/20">
                                                    <Bot className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                            )}
                                            <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20 text-text-primary rounded-br-sm' : 'bg-surface border border-border text-text-secondary rounded-bl-sm'}`}>
                                                {msg.role === 'bot' ? <MarkdownText text={msg.text} /> : msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && <div className="flex gap-2 items-center"><div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-primary/10"><Bot className="w-3.5 h-3.5 text-primary" /></div><div className="flex gap-1.5 px-4 py-3 rounded-2xl bg-surface border border-border">{[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>}
                                </>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        {!locked && (
                            <div className="px-4 pb-4 pt-2 flex gap-2 shrink-0 border-t border-border bg-surface-2/95">
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={MAINTENANCE_CONFIG.AI_FEATURES_DOWN ? "Service offline…" : "Ask a doubt…"}
                                    rows={1}
                                    disabled={loading || MAINTENANCE_CONFIG.AI_FEATURES_DOWN}
                                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors bg-surface border border-border text-text-primary placeholder:text-text-muted focus:border-primary/50 disabled:opacity-50"
                                    style={{ maxHeight: 80, fontFamily: "'Space Grotesk', sans-serif" }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || loading || MAINTENANCE_CONFIG.AI_FEATURES_DOWN}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 self-end ${(!input.trim() || loading || MAINTENANCE_CONFIG.AI_FEATURES_DOWN) ? 'bg-surface border border-border text-text-muted opacity-50' : 'bg-primary text-white shadow-sm hover:scale-105'}`}
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DoubtChatbot;
