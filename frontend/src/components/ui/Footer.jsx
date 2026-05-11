import React from 'react';
import { Heart, MessageSquare } from 'lucide-react';

const Footer = ({ onOpenFeedback }) => {
    return (
        <footer className="w-full py-8 px-6 border-t border-border/50 bg-surface/30 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Branding / Copy */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2">
                        <img src="/favicon.png" alt="" className="w-5 h-5 object-contain" />
                        <span className="text-sm font-black uppercase tracking-tighter text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>QuestXP</span>
                        <div className="w-1 h-1 rounded-full bg-primary/40" />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Mastery Platform</span>
                    </div>
                    <p className="text-[10px] text-text-muted font-medium flex items-center gap-1.5 mt-1">
                        Designed with <Heart className="w-2.5 h-2.5 text-danger fill-danger" /> by <span className="text-text-primary font-bold">Parth Patidar</span>
                    </p>
                </div>

                {/* Social Links + Feedback */}
                <div className="flex items-center gap-3">
                    {onOpenFeedback && (
                        <button
                            onClick={onOpenFeedback}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold hover:bg-primary/20 hover:border-primary/50 transition-all"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Send Feedback
                        </button>
                    )}
                    <a 
                        href="https://github.com/parthpatidar03" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary/50 hover:bg-surface-3 transition-all group flex items-center justify-center"
                        title="GitHub Profile"
                    >
                        <img src="/github-icon.png" alt="GitHub" className="w-5 h-5 object-contain group-hover:brightness-110 transition-all" />
                    </a>
                    <a 
                        href="https://www.linkedin.com/in/patidar-parth/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary/50 hover:bg-surface-3 transition-all group flex items-center justify-center"
                        title="LinkedIn Profile"
                    >
                        <img src="/linkden-icon.png" alt="LinkedIn" className="w-5 h-5 object-contain group-hover:brightness-110 transition-all" />
                    </a>
                    <a 
                        href="mailto:u1892911@gmail.com" 
                        className="px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/20 transition-all"
                    >
                        Contact Me
                    </a>
                </div>

                {/* Legal / Mini */}
                <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] opacity-40">
                    © 2026 QUESTXP
                </div>
            </div>
        </footer>
    );
};

export default Footer;
