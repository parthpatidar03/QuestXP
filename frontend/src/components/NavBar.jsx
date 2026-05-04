import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Bell, Search, BookOpenCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useGamificationStore from '../store/useGamificationStore';
import { getGamificationProfile } from '../services/gamificationApi';

const NavBar = () => {
    const { user, logout } = useAuthStore();
    const { totalXP, level, setProfile } = useGamificationStore();
    const navigate = useNavigate();

    useEffect(() => {
        getGamificationProfile()
            .then(data => setProfile(data))
            .catch(() => {});
    }, [setProfile]);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center h-16 gap-4">

                <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-4">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                        <BookOpenCheck className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-text-primary">
                        QuestXP
                    </span>
                </Link>

                <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-muted hover:border-text-muted transition-colors">
                    <Search className="w-4 h-4 shrink-0" />
                    <span>Search courses…</span>
                </div>

                <div className="flex-1" />

                <nav className="hidden md:flex items-center gap-1 mr-2">
                    <Link to="/" className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        Home
                    </Link>
                    <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                        My Courses
                    </Link>
                </nav>

                <button className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface" />
                </button>

                <div className="hidden sm:flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
                    <Zap className="w-4 h-4 text-gold" />
                    <span className="text-sm font-semibold text-text-primary">{(totalXP || user?.totalXP || 0).toLocaleString()} XP</span>
                </div>

                <Link to="/profile" className="relative flex items-center gap-2 group">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full border border-border p-0.5 bg-surface">
                            <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs">
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'Q'}
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-gold text-text-primary text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-surface">
                            {level || user?.level || 1}
                        </div>
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate max-w-[100px]">
                        {user?.name?.split(' ')[0] ?? 'Player'}
                    </span>
                </Link>

            </div>
        </header>
    );
};

export default NavBar;
