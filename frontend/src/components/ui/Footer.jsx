import React from 'react';
import { Heart, MessageSquare, Github, Linkedin, Mail } from 'lucide-react';

const Footer = ({ onOpenFeedback }) => {
    return (
        <footer className="w-full px-3 sm:px-5 pb-5 pt-10 mt-auto relative z-10">
            <div className="max-w-screen-2xl mx-auto clay rounded-clay-lg p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                    {/* Branding / Copy */}
                    <div className="flex flex-col items-center lg:items-start gap-2">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo-mark.webp" alt="" className="w-8 h-8 object-contain" />
                            <span className="text-lg font-display font-bold tracking-tight text-text-primary">QuestXP</span>
                            <span className="clay-sunk-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                Mastery Platform
                            </span>
                        </div>
                        <p className="text-sm text-text-muted font-semibold flex items-center gap-1.5">
                            Designed with <Heart className="w-4 h-4 text-primary fill-primary" /> by
                            <span className="text-text-primary font-bold">Parth Patidar</span>
                        </p>
                    </div>

                    {/* Social Links + Feedback */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {onOpenFeedback && (
                            <button
                                onClick={onOpenFeedback}
                                className="clay-sm clay-interactive flex items-center gap-2 px-4 h-11 rounded-clay text-primary-hover dark:text-primary text-sm font-bold"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Send Feedback
                            </button>
                        )}
                        <a
                            href="https://github.com/parthpatidar03"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="clay-sm clay-interactive flex items-center gap-2 px-4 h-11 rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary"
                            title="GitHub Profile"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </a>
                        <a
                            href="https://www.linkedin.com/in/patidar-parth/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="clay-sm clay-interactive flex items-center gap-2 px-4 h-11 rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary"
                            title="LinkedIn Profile"
                        >
                            <Linkedin className="w-4 h-4" />
                            LinkedIn
                        </a>
                        <a
                            href="mailto:u1892911@gmail.com"
                            className="clay-sm clay-interactive flex items-center gap-2 px-4 h-11 rounded-clay text-sm font-bold text-text-secondary hover:text-text-primary"
                        >
                            <Mail className="w-4 h-4" />
                            Contact
                        </a>
                    </div>

                    {/* Legal / Mini */}
                    <div className="text-xs font-mono text-text-muted tracking-widest">
                        © 2026 QUESTXP
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
