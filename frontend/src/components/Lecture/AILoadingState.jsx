import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

/**
 * Premium AI Loading State Component
 * @param {number} progress - 0 to 100
 * @param {string} status - Current status message
 * @param {string} title - Main title (e.g. "AI Smart Summary")
 * @param {React.ReactNode} icon - Icon to display
 */
const AILoadingState = ({ progress, status, title, icon }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center animate-in fade-in duration-700">
            {/* Animated Icon Container */}
            <div className="relative mb-8">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="w-20 h-20 rounded-[2rem] flex items-center justify-center relative z-10"
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(0,180,255,0.2) 0%, rgba(0,255,128,0.1) 100%)',
                        border: '1px solid rgba(0,180,255,0.3)',
                        boxShadow: '0 0 40px rgba(0,180,255,0.15)'
                    }}
                >
                    {icon || <Bot className="w-10 h-10 text-[#00b4ff]" />}
                </motion.div>
                
                {/* Orbital Rings */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-10px] border border-dashed border-primary/20 rounded-full"
                />
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-20px] border border-dotted border-primary/10 rounded-full"
                />
            </div>

            {/* Title & Status */}
            <div className="space-y-2 mb-10">
                <h3 className="text-xl font-display font-black text-white tracking-tight flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    {title}
                </h3>
                <p className="text-sm font-medium text-text-muted uppercase tracking-[0.2em]">
                    {status}
                </p>
            </div>

            {/* Progress Visualizer */}
            <div className="w-full max-w-[340px] relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Neural Processing</span>
                    </div>
                    <span className="text-xs font-black text-primary font-mono">{Math.round(progress)}%</span>
                </div>

                <div className="h-4 bg-surface-3 rounded-full p-1 border border-white/5 shadow-inner overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary-hover relative"
                        style={{ boxShadow: '0 0 20px rgba(0,255,128,0.4)' }}
                    >
                        {/* Shimmer Effect */}
                        <motion.div 
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                    </motion.div>
                </div>

                {/* Cyberpunk Decor */}
                <div className="mt-4 flex justify-between px-1">
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-1 h-1 rounded-full ${progress > i * 30 ? 'bg-primary' : 'bg-surface-3'}`} />
                        ))}
                    </div>
                    <p className="text-[9px] font-bold text-text-muted/50 uppercase tracking-tighter">
                        Encrypted Connection • Verified AI Model
                    </p>
                </div>
            </div>

            {/* Motivational Footer */}
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mt-12 text-[10px] font-bold text-text-muted uppercase tracking-widest"
            >
                Stand by. Excellence takes a moment.
            </motion.p>
        </div>
    );
};

export default AILoadingState;
