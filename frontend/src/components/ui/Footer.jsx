import React from 'react';
import { Github, Linkedin, Heart } from 'lucide-react';

const Footer = ({ onOpenFeedback }) => {
    return (
        <footer className="w-full py-8 px-6 border-t border-border/50 bg-surface/30 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Branding / Copy */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black uppercase tracking-tighter text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>QuestXP</span>
                        <div className="w-1 h-1 rounded-full bg-primary/40" />
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Mastery Platform</span>
                    </div>
                    <p className="text-[10px] text-text-muted font-medium flex items-center gap-1.5 mt-1">
                        Designed with <Heart className="w-2.5 h-2.5 text-danger fill-danger" /> by <span className="text-text-primary font-bold">Parth Patidar</span>
                        {onOpenFeedback && (
                            <>
                                <span className="opacity-20 px-1">•</span>
                                <button onClick={onOpenFeedback} className="hover:text-primary transition-colors">Send Feedback</button>
                            </>
                        )}
                    </p>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4">
                    <a 
                        href="https://github.com/parthpatidar03" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary/50 hover:bg-surface-3 transition-all group"
                        title="GitHub Profile"
                    >
                        <Github className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" />
                    </a>
                    <a 
                        href="https://www.linkedin.com/in/patidar-parth/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-primary/50 hover:bg-surface-3 transition-all group"
                        title="LinkedIn Profile"
                    >
                        <Linkedin className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                    </a>
                    <a 
                        href="mailto:contact@parthpatidar.com" // Placeholder or user email
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
