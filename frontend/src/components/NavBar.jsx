import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Bell, Search, Shield } from 'lucide-react';
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
        <header className="sticky top-0 z-50 w-full border-b border-[#2a2f52] bg-[#0d0f1a]/90 backdrop-blur-xl">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 flex items-center h-16 gap-4">

                {/* Logo */}
                <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 mr-4">
                    <div className="relative">
                        <Shield className="w-7 h-7 text-[#00b4ff] drop-shadow-[0_0_8px_rgba(0,180,255,0.8)]" />
                        <Zap className="w-3 h-3 text-[#f5a524] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em' }}>
                        QUEST<span className="text-[#00b4ff]">XP</span>
                    </span>
                </Link>

                {/* Search */}
                <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-[#12152a] border border-[#2a2f52] rounded-lg px-3 py-2 text-sm text-[#8b9cc8] hover:border-[#00b4ff]/40 transition-colors">
                    <Search className="w-4 h-4 shrink-0" />
                    <span>Search courses…</span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Nav Links */}
                <nav className="hidden md:flex items-center gap-1 mr-2">
                    <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium text-[#8b9cc8] hover:text-white hover:bg-[#12152a] rounded-lg transition-colors">
                        Dashboard
                    </Link>
                    <Link to="/dashboard" className="px-3 py-1.5 text-sm font-medium text-[#8b9cc8] hover:text-white hover:bg-[#12152a] rounded-lg transition-colors">
                        My Courses
                    </Link>
                </nav>

                {/* Notifications */}
                <button className="relative p-2 text-[#8b9cc8] hover:text-white hover:bg-[#12152a] rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00b4ff] rounded-full ring-2 ring-[#0d0f1a]" />
                </button>

                {/* XP Display */}
                <div className="hidden sm:flex items-center gap-1.5 bg-[#12152a] border border-[#2a2f52] rounded-lg px-3 py-1.5">
                    <Zap className="w-4 h-4 text-[#f5a524]" />
                    <span className="text-sm font-bold text-[#f5a524]">{(totalXP || user?.totalXP || 0).toLocaleString()} XP</span>
                </div>

                {/* User Avatar + Level */}
                <Link to="/profile" className="relative flex items-center gap-2 group">
                    <div className="relative">
                        {/* Level ring */}
                        <div className="w-9 h-9 rounded-full border-2 border-[#00b4ff] p-0.5 shadow-[0_0_12px_rgba(0,180,255,0.5)]">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#00b4ff] to-[#0055ff] flex items-center justify-center text-white font-bold text-xs">
                                {user?.name?.charAt(0)?.toUpperCase() ?? 'Q'}
                            </div>
                        </div>
                        {/* Level badge */}
                        <div className="absolute -bottom-1 -right-1 bg-[#f5a524] text-[#0d0f1a] text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[#0d0f1a]">
                            {level || user?.level || 1}
                        </div>
                    </div>
                    <span className="hidden lg:block text-sm font-semibold text-white group-hover:text-[#00b4ff] transition-colors truncate max-w-[100px]">
                        {user?.name?.split(' ')[0] ?? 'Player'}
                    </span>
                </Link>

            </div>
        </header>
    );
};

export default NavBar;
