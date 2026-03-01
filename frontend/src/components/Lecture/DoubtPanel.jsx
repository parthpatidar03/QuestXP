import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api'; // Provided by spec
import DoubtCitation from './DoubtCitation';

// Mock hook per spec 002
const useFeatureGate = (featureKey) => {
    // Return true for testing purposes; in reality would query user level vs CONSTANTS
    return { isLocked: false, requiredLevel: 2 }; 
};

const DoubtPanel = ({ lectureId }) => {
    const { isLocked, requiredLevel } = useFeatureGate('DOUBT_CHATBOT_LIMITED');
    
    const [status, setStatus] = useState('checking'); // checking | ready | indexing | error
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    const scrollRef = useRef(null);

    useEffect(() => {
        const initPanel = async () => {
            if (isLocked) return;

            try {
                // T019 Check Embedding Status
                const statusRes = await api.get(`/api/doubts/${lectureId}/status`);
                if (statusRes.data.embeddingStatus !== 'complete') {
                    setStatus('indexing');
                    return;
                }
                
                setStatus('ready');

                // US4: T026 history fetch
                const historyRes = await api.get(`/api/doubts/${lectureId}/history`);
                if (historyRes.data?.data?.exchanges) {
                    setHistory(historyRes.data.data.exchanges);
                }
            } catch (err) {
                console.error(err);
                if (err.response?.status === 503) setStatus('indexing');
                else setStatus('error');
            }
        };
        initPanel();
    }, [lectureId, isLocked]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, status]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading || status !== 'ready') return;

        const questionText = input.trim();
        setInput('');
        
        // Optimistic UI update
        const tempId = Date.now().toString();
        setHistory(prev => [...prev, { _id: tempId, questionText, pending: true }]);
        setLoading(true);

        try {
            const res = await api.post(`/api/doubts/${lectureId}/query`, { questionText });
            const answerData = res.data.data;

            setHistory(prev => prev.map(msg => 
                msg._id === tempId ? {
                    _id: answerData.queryId,
                    questionText,
                    answer: {
                        answerText: answerData.answerText,
                        citations: answerData.citations,
                        notFound: answerData.notFound,
                        generatedAt: answerData.generatedAt
                    }
                } : msg
            ));
        } catch (err) {
            console.error('Query error:', err);
            // T023 [US3] 500 INTERNAL ERROR handler
            setHistory(prev => prev.map(msg => 
                msg._id === tempId ? {
                    _id: tempId,
                    questionText,
                    answer: {
                        error: true,
                        answerText: "Doubt chatbot temporarily unavailable — please try again."
                    }
                } : msg
            ));
        } finally {
            setLoading(false);
        }
    };

    if (isLocked) {
        return (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
                <p>🔒 Doubt Chatbot requires Level {requiredLevel}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex-shrink-0 w-full max-w-md">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                <h3 className="text-white font-medium">Ask a Doubt</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {status === 'checking' && <div className="text-gray-400 text-sm text-center">Loading...</div>}
                {status === 'indexing' && (
                    <div className="bg-blue-900/30 text-blue-400 text-sm p-3 rounded text-center border border-blue-800">
                        Indexing in progress. Chatbot will be ready shortly...
                    </div>
                )}
                {status === 'error' && (
                    <div className="text-red-400 text-sm text-center p-3">Failed to load chatbot status.</div>
                )}
                
                {status === 'ready' && history.length === 0 && (
                    <div className="text-gray-500 text-sm text-center mt-10">
                        Ask your first doubt about this lecture 👇
                    </div>
                )}

                {history.map((exchange) => (
                    <div key={exchange._id} className="space-y-2">
                        {/* User Question */}
                        <div className="flex justify-end">
                            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg max-w-[85%] text-sm">
                                {exchange.questionText}
                            </div>
                        </div>

                        {/* Bot Answer */}
                        {exchange.pending ? (
                            <div className="flex justify-start">
                                <div className="bg-gray-800 text-gray-300 px-4 py-3 rounded-lg text-sm animate-pulse flex space-x-2">
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                                </div>
                            </div>
                        ) : exchange.answer && (
                            <div className="flex justify-start">
                                <div className={`px-4 py-3 rounded-lg max-w-[95%] text-sm border ${
                                    exchange.answer.error ? 'bg-red-900/20 border-red-800 text-red-300 italic' 
                                    : exchange.answer.notFound ? 'bg-gray-800 border-gray-700 text-gray-400 italic' 
                                    : 'bg-gray-800 border-gray-700 text-gray-200'
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{exchange.answer.answerText}</p>
                                    
                                    {/* Citations */}
                                    {exchange.answer.citations && exchange.answer.citations.length > 0 && !exchange.answer.notFound && (
                                        <div className="mt-3 pt-2 border-t border-gray-700 flex flex-wrap gap-1">
                                            <span className="text-xs text-gray-500 mr-1 self-center">Sources:</span>
                                            {exchange.answer.citations.map((cit, idx) => (
                                                <DoubtCitation key={idx} timestamp={cit.timestamp} label={cit.label} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-3 bg-gray-800 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about this lecture..."
                        disabled={status !== 'ready' || loading}
                        className="flex-1 bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={status !== 'ready' || loading || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DoubtPanel;
