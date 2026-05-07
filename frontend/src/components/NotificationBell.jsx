import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Trophy, Zap, Flame, Star, Sparkles, BookOpen, PartyPopper } from 'lucide-react';

const STORAGE_KEY = 'questxp_notifications';
const SEEN_KEY = 'questxp_notifs_seen';
const WELCOME_KEY = 'questxp_welcome_sent';

// Generate notifications based on user state
function generateNotifications(profile, user) {
    const notifs = [];
    const now = new Date();
    const ts = () => now.toISOString();

    // Welcome notification (first time only)
    const welcomed = localStorage.getItem(WELCOME_KEY);
    if (!welcomed) {
        notifs.push({
            id: 'welcome',
            icon: 'party',
            title: 'Welcome to QuestXP!',
            body: `Hey ${user?.name?.split(' ')[0] || 'Explorer'}! Your learning journey begins now. Add a course and start earning XP!`,
            time: ts(),
            type: 'welcome'
        });
        localStorage.setItem(WELCOME_KEY, 'true');
    }

    const xp = profile.totalXP || 0;
    const level = profile.level || 1;
    const streak = profile.streak?.current || 0;
    const badges = profile.badges || [];

    // XP milestones
    const xpMilestones = [100, 250, 500, 1000, 2500, 5000];
    const achieved = JSON.parse(localStorage.getItem('questxp_xp_milestones') || '[]');
    for (const m of xpMilestones) {
        if (xp >= m && !achieved.includes(m)) {
            notifs.push({
                id: `xp-${m}`,
                icon: 'zap',
                title: `${m} XP Reached!`,
                body: `You've earned ${m} XP total. Keep crushing those quizzes!`,
                time: ts(),
                type: 'milestone'
            });
            achieved.push(m);
        }
    }
    localStorage.setItem('questxp_xp_milestones', JSON.stringify(achieved));

    // Level milestones
    const levelAchieved = JSON.parse(localStorage.getItem('questxp_level_milestones') || '[]');
    if (level >= 2 && !levelAchieved.includes(level)) {
        notifs.push({
            id: `level-${level}`,
            icon: 'trophy',
            title: `Level ${level} Unlocked!`,
            body: `You're now Level ${level} — ${profile.levelTitle || 'Rising Star'}. New challenges await.`,
            time: ts(),
            type: 'level'
        });
        levelAchieved.push(level);
        localStorage.setItem('questxp_level_milestones', JSON.stringify(levelAchieved));
    }

    // Streak milestones
    const streakAchieved = JSON.parse(localStorage.getItem('questxp_streak_milestones') || '[]');
    const streakMilestones = [3, 7, 14, 30];
    for (const s of streakMilestones) {
        if (streak >= s && !streakAchieved.includes(s)) {
            notifs.push({
                id: `streak-${s}`,
                icon: 'flame',
                title: `${s}-Day Streak!`,
                body: `${s} days of consistent learning. You're on fire!`,
                time: ts(),
                type: 'streak'
            });
            streakAchieved.push(s);
        }
    }
    localStorage.setItem('questxp_streak_milestones', JSON.stringify(streakAchieved));

    // New badge notifications
    const seenBadges = JSON.parse(localStorage.getItem('questxp_seen_badges') || '[]');
    for (const b of badges) {
        if (b.earned && !seenBadges.includes(b.id)) {
            notifs.push({
                id: `badge-${b.id}`,
                icon: 'star',
                title: 'Badge Earned!',
                body: `You unlocked "${b.name}". Check your profile to see all badges.`,
                time: ts(),
                type: 'badge'
            });
            seenBadges.push(b.id);
        }
    }
    localStorage.setItem('questxp_seen_badges', JSON.stringify(seenBadges));

    return notifs;
}

const ICON_MAP = {
    party: <PartyPopper className="w-4 h-4 text-primary" />,
    zap: <Zap className="w-4 h-4 text-gold" />,
    trophy: <Trophy className="w-4 h-4 text-gold" />,
    flame: <Flame className="w-4 h-4 text-warning" />,
    star: <Star className="w-4 h-4 text-gold" />,
    sparkles: <Sparkles className="w-4 h-4 text-primary" />,
    book: <BookOpen className="w-4 h-4 text-primary" />,
};

function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export default function NotificationBell({ profile, user }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [seenIds, setSeenIds] = useState(new Set());
    const panelRef = useRef(null);

    // Load persisted notifications + generate new ones
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'));
        setSeenIds(seen);

        if (profile && user) {
            const newNotifs = generateNotifications(profile, user);
            if (newNotifs.length > 0) {
                const merged = [...newNotifs, ...stored];
                // Dedupe by id, keep max 20
                const unique = [];
                const ids = new Set();
                for (const n of merged) {
                    if (!ids.has(n.id)) {
                        ids.add(n.id);
                        unique.push(n);
                    }
                }
                const trimmed = unique.slice(0, 20);
                setNotifications(trimmed);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
            } else {
                setNotifications(stored);
            }
        } else {
            setNotifications(stored);
        }
    }, [profile, user]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Mark all as seen when panel opens
    useEffect(() => {
        if (open && notifications.length > 0) {
            const allIds = notifications.map(n => n.id);
            setSeenIds(new Set(allIds));
            localStorage.setItem(SEEN_KEY, JSON.stringify(allIds));
        }
    }, [open, notifications]);

    const unseen = notifications.filter(n => !seenIds.has(n.id)).length;

    const clearAll = () => {
        setNotifications([]);
        localStorage.setItem(STORAGE_KEY, '[]');
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
                title="Notifications"
                aria-label={`Notifications${unseen > 0 ? `, ${unseen} new` : ''}`}
            >
                <Bell className="w-5 h-5" />
                {unseen > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface animate-pulse" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-2xl z-[70] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2/50">
                        <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-[10px] font-semibold text-text-muted hover:text-danger transition-colors uppercase tracking-wider"
                                >
                                    Clear all
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-primary transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4">
                                <Bell className="w-8 h-8 text-text-muted mb-3 opacity-30" />
                                <p className="text-sm text-text-muted">No notifications yet</p>
                                <p className="text-xs text-text-muted mt-1">Complete quizzes and earn XP to see updates here</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`flex gap-3 px-4 py-3 border-b border-border/50 transition-colors ${!seenIds.has(n.id) ? 'bg-primary/5' : 'hover:bg-surface-2/30'}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0 mt-0.5">
                                        {ICON_MAP[n.icon] || ICON_MAP.sparkles}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-text-primary leading-tight">{n.title}</p>
                                        <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">{n.body}</p>
                                        <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.time)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
