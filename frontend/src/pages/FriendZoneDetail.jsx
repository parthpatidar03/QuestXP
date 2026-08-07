import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, Crown, Loader2, Trophy, Flame, Zap, Users, Copy, Check,
    UserMinus, RefreshCw, Trash2, LogOut, X, KeyRound,
} from 'lucide-react';
import {
    getZone, getZoneFeed, leaveZone, kickMember, deleteZone, regenerateInvite,
    generateJoinOtp, buildInviteUrl,
} from '../services/friendZonesApi';

// Tailwind's JIT compiler can't see classes built from template literals like
// `bg-${color}/10`, so those styles never get emitted in production. Use a
// static map that the compiler can scan.
const PILL_COLORS = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    danger:  'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
};

const Pill = ({ children, color = 'primary' }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${PILL_COLORS[color] || PILL_COLORS.primary}`}>
        {children}
    </span>
);

const fmtMMSS = (ms) => {
    if (ms <= 0) return '0:00';
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const FriendZoneDetail = () => {
    const { zoneId } = useParams();
    const navigate = useNavigate();

    const [zone, setZone] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const [otpCopied, setOtpCopied] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // OTP state — only meaningful for the owner. The plaintext code is
    // returned by the backend once and never persisted; we keep it locally
    // until it expires or the page is reloaded.
    const [otp, setOtp] = useState(null);        // { code, expiresAt }
    const [otpRemain, setOtpRemain] = useState(null);

    const refresh = useCallback(async () => {
        try {
            const [det, ev] = await Promise.all([
                getZone(zoneId),
                getZoneFeed(zoneId, 30).catch(() => []),
            ]);
            setZone(det.zone);
            setLeaderboard(det.leaderboard);
            setFeed(ev);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load this zone.');
        } finally {
            setLoading(false);
        }
    }, [zoneId]);

    useEffect(() => { refresh(); }, [refresh]);

    // Poll the feed every 30s so members see fresh activity.
    useEffect(() => {
        const id = setInterval(() => {
            getZoneFeed(zoneId, 30).then(setFeed).catch(() => {});
        }, 30000);
        return () => clearInterval(id);
    }, [zoneId]);

    // OTP countdown — re-renders every second so the owner sees expiry tick.
    useEffect(() => {
        if (!otp?.expiresAt) { setOtpRemain(null); return; }
        const tick = () => setOtpRemain(new Date(otp.expiresAt).getTime() - Date.now());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [otp]);

    // Auto-clear OTP when it expires so we don't show a stale code.
    useEffect(() => {
        if (otp && otpRemain !== null && otpRemain <= 0) setOtp(null);
    }, [otp, otpRemain]);

    const copyInvite = async () => {
        if (!zone?.inviteCode) return;
        try {
            await navigator.clipboard.writeText(buildInviteUrl(zone.inviteCode));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard not available */ }
    };

    const copyOtp = async () => {
        if (!otp?.code) return;
        try {
            await navigator.clipboard.writeText(otp.code);
            setOtpCopied(true);
            setTimeout(() => setOtpCopied(false), 1500);
        } catch { /* clipboard not available */ }
    };

    const handleGenerateCode = async () => {
        setBusy(true);
        try {
            const data = await generateJoinOtp(zoneId);
            setOtp({ code: data.code, expiresAt: data.expiresAt });
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Could not generate code.');
        } finally {
            setBusy(false);
        }
    };

    const handleLeave = async () => {
        if (!confirm('Leave this zone? You can rejoin only if the owner generates a new code for you.')) return;
        setBusy(true);
        try {
            await leaveZone(zoneId);
            navigate('/friendzones');
        } catch (err) {
            setError(err.response?.data?.error || 'Could not leave the zone.');
            setBusy(false);
        }
    };

    const handleKick = async (userId, name) => {
        if (!confirm(`Remove ${name} from this zone?`)) return;
        setBusy(true);
        try {
            await kickMember(zoneId, userId);
            await refresh();
        } catch (err) {
            setError(err.response?.data?.error || 'Could not remove member.');
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        setBusy(true);
        try {
            await deleteZone(zoneId);
            navigate('/friendzones');
        } catch (err) {
            setError(err.response?.data?.error || 'Could not delete the zone.');
            setBusy(false);
            setConfirmDelete(false);
        }
    };

    const handleRegenerate = async () => {
        if (!confirm('Rotate the invite link? Any in-flight join codes become invalid.')) return;
        setBusy(true);
        try {
            const updated = await regenerateInvite(zoneId);
            setZone(prev => ({ ...prev, inviteCode: updated.inviteCode }));
            setOtp(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not regenerate invite.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !zone) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-bg gap-4 p-6 text-center">
                <p className="text-danger">{error}</p>
                <Link to="/friendzones" className="text-primary text-sm">← Back to your zones</Link>
            </div>
        );
    }

    const isOwner = zone?.isOwner;

    return (
        <div className="min-h-screen bg-bg text-text-primary">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <button
                    onClick={() => navigate('/friendzones')}
                    className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> All zones
                </button>

                <header className="rounded-clay-lg clay p-5 sm:p-6 mb-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight truncate">
                                    {zone.name}
                                </h1>
                                {isOwner && <Pill color="warning"><Crown className="w-3 h-3" /> Owner</Pill>}
                            </div>
                            {zone.description && (
                                <p className="text-sm text-text-secondary">{zone.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
                                <Users className="w-3.5 h-3.5" />
                                <span>{zone.memberCount} / {zone.maxMembers} members</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {!isOwner && (
                                <button
                                    onClick={handleLeave}
                                    disabled={busy}
                                    className="px-3 py-2 rounded-clay-sm text-xs font-semibold clay-sm hover:bg-surface-2 inline-flex items-center gap-1.5 disabled:opacity-60"
                                >
                                    <LogOut className="w-3.5 h-3.5" /> Leave
                                </button>
                            )}
                            {isOwner && (
                                <>
                                    <button
                                        onClick={handleRegenerate}
                                        disabled={busy}
                                        className="px-3 py-2 rounded-clay-sm text-xs font-semibold clay-sm hover:bg-surface-2 inline-flex items-center gap-1.5 disabled:opacity-60"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> Rotate link
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(true)}
                                        disabled={busy}
                                        className="px-3 py-2 rounded-clay-sm text-xs font-semibold border border-danger/30 text-danger hover:bg-danger/10 inline-flex items-center gap-1.5 disabled:opacity-60"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {isOwner && zone.inviteCode && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Invite link */}
                            <div className="rounded-clay clay-sunk p-3">
                                <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Step 1 — Invite Link</div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 truncate text-xs text-text-primary">
                                        {buildInviteUrl(zone.inviteCode)}
                                    </code>
                                    <button
                                        onClick={copyInvite}
                                        className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 flex items-center gap-1 shrink-0"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Join code (OTP) */}
                            <div className="rounded-clay clay-sunk p-3">
                                <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1.5">Step 2 — Join Code</div>
                                {otp ? (
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-2xl font-display font-black tracking-[0.3em] text-primary text-center">
                                            {otp.code}
                                        </code>
                                        <button
                                            onClick={copyOtp}
                                            className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 flex items-center gap-1 shrink-0"
                                        >
                                            {otpCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {otpCopied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={busy}
                                        className="w-full py-2 rounded-md bg-primary text-bg text-xs font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                                        Generate Code
                                    </button>
                                )}
                                <p className="text-[10px] text-text-muted mt-1.5">
                                    {otp && otpRemain !== null
                                        ? `Expires in ${fmtMMSS(otpRemain)} · single use`
                                        : '6-digit code · expires in 10 min · single use'}
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-3 p-2 rounded-clay-sm border border-danger/30 bg-danger/10 text-danger text-xs">
                            {error}
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leaderboard */}
                    <section className="lg:col-span-2 rounded-clay-lg clay p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-primary" />
                            <h2 className="font-bold text-text-primary">Leaderboard</h2>
                            <span className="ml-auto text-[10px] uppercase tracking-widest text-text-muted">By Total XP</span>
                        </div>
                        <ol className="space-y-2">
                            {leaderboard.map(m => (
                                <li
                                    key={m.userId}
                                    className={`flex items-center gap-3 p-3 rounded-clay border ${m.isYou ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface-2'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        m.rank === 1 ? 'bg-warning/20 text-warning'
                                        : m.rank === 2 ? 'bg-text-muted/20 text-text-secondary'
                                        : m.rank === 3 ? 'bg-amber-700/20 text-amber-600'
                                        : 'bg-surface-3 text-text-muted'
                                    }`}>
                                        {m.rank}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold truncate">{m.name}</span>
                                            {m.isOwner && <Crown className="w-3.5 h-3.5 text-warning shrink-0" />}
                                            {m.isYou && <Pill color="primary">You</Pill>}
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-text-muted mt-0.5">
                                            <span>Lvl {m.level}</span>
                                            <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{m.streak}d</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-display font-bold text-primary">{m.totalXP.toLocaleString()}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-text-muted">XP</div>
                                    </div>
                                    {isOwner && !m.isOwner && !m.isYou && (
                                        <button
                                            onClick={() => handleKick(m.userId, m.name)}
                                            disabled={busy}
                                            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-60"
                                            title="Remove from zone"
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Activity Feed */}
                    <section className="rounded-clay-lg clay p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-primary" />
                            <h2 className="font-bold text-text-primary">Activity</h2>
                        </div>
                        {feed.length === 0 ? (
                            <p className="text-xs text-text-muted">No activity yet. Complete a lecture or quiz to start the feed.</p>
                        ) : (
                            <ul className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                                {feed.map(ev => (
                                    <li key={ev._id} className="flex items-start gap-2 text-xs">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p>
                                                <span className="font-semibold text-text-primary">{ev.name}</span>
                                                <span className="text-text-secondary"> earned </span>
                                                <span className="font-semibold text-primary">+{ev.xp} XP</span>
                                                <span className="text-text-secondary"> for </span>
                                                <span className="text-text-secondary lowercase">
                                                    {String(ev.actionType).replaceAll('_', ' ')}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-text-muted mt-0.5">
                                                {new Date(ev.at).toLocaleString()}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>

            {confirmDelete && (
                <div
                    className="fixed inset-0 z-[60] bg-bg/70 backdrop-blur-sm flex items-center justify-center px-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(false); }}
                >
                    <div className="w-full max-w-sm rounded-clay-lg clay p-5 ">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-danger" />
                                <h3 className="font-bold">Delete this zone?</h3>
                            </div>
                            <button onClick={() => setConfirmDelete(false)} className="text-text-muted hover:text-text-primary">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">
                            This permanently removes the zone for all members. This cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="px-4 py-2 rounded-clay-sm text-sm text-text-secondary hover:text-text-primary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={busy}
                                className="px-4 py-2 rounded-clay-sm bg-danger text-white text-sm font-semibold disabled:opacity-60"
                            >
                                Delete forever
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FriendZoneDetail;
