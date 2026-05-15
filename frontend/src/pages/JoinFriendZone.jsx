import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users, KeyRound, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { peekZone, joinZone } from '../services/friendZonesApi';

const OTP_LENGTH = 6;

const JoinFriendZone = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuthStore();

    const [zone, setZone] = useState(null);
    const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef([]);

    // Force login first; preserve the join link so we can resume after auth.
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            localStorage.setItem('redirectAfterLogin', `/join/${inviteCode}`);
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, inviteCode, navigate]);

    useEffect(() => {
        if (!isAuthenticated) return;
        let alive = true;
        peekZone(inviteCode)
            .then(z => { if (alive) setZone(z); })
            .catch(err => {
                if (!alive) return;
                setError(err.response?.data?.error || 'This invite is invalid or has expired.');
            })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [inviteCode, isAuthenticated]);

    // ─── OTP input handlers (auto-advance, paste, backspace) ────────────────
    const setDigitAt = (idx, val) => {
        const next = [...digits];
        next[idx] = val;
        setDigits(next);
    };

    const handleDigitChange = (idx, raw) => {
        const v = raw.replace(/\D/g, '');
        if (!v) { setDigitAt(idx, ''); return; }
        if (v.length === 1) {
            setDigitAt(idx, v);
            if (idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
            return;
        }
        // Paste of multiple digits — distribute starting from this index.
        const arr = v.slice(0, OTP_LENGTH - idx).split('');
        const next = [...digits];
        arr.forEach((c, i) => { next[idx + i] = c; });
        setDigits(next);
        const lastFilled = Math.min(idx + arr.length, OTP_LENGTH - 1);
        inputRefs.current[lastFilled]?.focus();
    };

    const handleDigitKeyDown = (idx, e) => {
        if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const otp = digits.join('');

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError('');

        const usePassword = zone?.hasPassword && password.trim();
        const useOtp = otp.length === OTP_LENGTH;
        if (!useOtp && !usePassword) {
            return setError(zone?.hasPassword
                ? 'Enter the 6-digit code, or the zone password.'
                : 'Enter the 6-digit join code.');
        }

        setSubmitting(true);
        try {
            const payload = { inviteCode };
            if (useOtp) payload.otp = otp;
            if (usePassword) payload.password = password.trim();
            const res = await joinZone(payload);
            navigate(`/friendzones/${res.zone._id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not join. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg text-text-primary flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                </button>

                <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Join a Friend Zone</h1>
                            <p className="text-xs text-text-muted">Enter the 6-digit code the owner sent you.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : !zone ? (
                        <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm">
                            {error || 'This invite is invalid or has expired.'}
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-5">
                            <div className="rounded-xl border border-border bg-surface-2 p-4">
                                <div className="text-[10px] uppercase tracking-widest text-text-muted">You're joining</div>
                                <div className="font-bold text-text-primary mt-1">{zone.name}</div>
                                {zone.description && (
                                    <div className="text-xs text-text-secondary mt-1">{zone.description}</div>
                                )}
                                <div className="text-[11px] text-text-muted mt-2">
                                    {zone.memberCount} / {zone.maxMembers} members
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">
                                    <KeyRound className="w-3 h-3 inline-block mr-1" /> 6-digit join code
                                </label>
                                <div className="flex justify-between gap-2">
                                    {digits.map((d, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => { inputRefs.current[i] = el; }}
                                            value={d}
                                            onChange={(e) => handleDigitChange(i, e.target.value)}
                                            onKeyDown={(e) => handleDigitKeyDown(i, e)}
                                            onFocus={(e) => e.target.select()}
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={OTP_LENGTH}
                                            className="w-11 h-12 text-center rounded-lg border border-border bg-surface-2 text-lg font-display font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40"
                                        />
                                    ))}
                                </div>
                                <p className="text-[10px] text-text-muted mt-1.5">
                                    Ask the zone owner to press <em>Generate Code</em> and share the 6 digits.
                                </p>
                            </div>

                            {zone.hasPassword && (
                                <details className="rounded-lg border border-border bg-surface-2 p-3">
                                    <summary className="text-xs text-text-muted cursor-pointer">
                                        This is a legacy zone — use password instead
                                    </summary>
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        maxLength={64}
                                        placeholder="Zone password"
                                        className="mt-2 w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                                    />
                                </details>
                            )}

                            {error && <p className="text-sm text-danger">{error}</p>}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-primary text-bg font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Join Zone
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinFriendZone;
