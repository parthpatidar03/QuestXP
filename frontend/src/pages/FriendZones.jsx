import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Plus, Crown, Loader2, ArrowLeft, Copy, Check } from 'lucide-react';
import { listMyZones, createZone, buildInviteUrl } from '../services/friendZonesApi';

const CreateZoneModal = ({ open, onClose, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdZone, setCreatedZone] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open) {
            setName(''); setDescription('');
            setError(''); setCreatedZone(null); setCopied(false);
            setSubmitting(false);
        }
    }, [open]);

    if (!open) return null;

    const submit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setError('');
        if (name.trim().length < 2) return setError('Name must be at least 2 characters.');
        setSubmitting(true);
        try {
            const zone = await createZone({ name: name.trim(), description: description.trim() });
            setCreatedZone(zone);
            onCreated?.(zone);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Could not create zone.');
        } finally {
            setSubmitting(false);
        }
    };

    const copyLink = async () => {
        const url = buildInviteUrl(createdZone.inviteCode);
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* clipboard not available */ }
    };

    return (
        <div
            className="fixed inset-0 z-[60] bg-bg/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
                {createdZone ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-text-primary">Zone created</h2>
                                <p className="text-xs text-text-muted">Share this link with friends.</p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-border bg-surface-2 p-3">
                            <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Invite Link</div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 truncate text-xs text-text-primary">
                                    {buildInviteUrl(createdZone.inviteCode)}
                                </code>
                                <button
                                    onClick={copyLink}
                                    className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 flex items-center gap-1"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-text-secondary">
                            <strong className="text-text-primary">Next:</strong> open the zone, press <em>Generate code</em>, and share the 6-digit code with your friend. They open the invite link, enter the code, and they're in.
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl bg-primary text-bg font-semibold"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold text-text-primary">Create a Friend Zone</h2>
                            <p className="text-xs text-text-muted mt-1">A private squad where only invited friends compete. No password — invite by short code on demand.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Zone name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={60}
                                placeholder="The Grind Squad"
                                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1.5">Description (optional)</label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={200}
                                placeholder="Cracking SDE prep together"
                                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                        {error && <p className="text-sm text-danger">{error}</p>}
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 rounded-lg bg-primary text-bg text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Zone
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

const FriendZones = () => {
    const navigate = useNavigate();
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const refresh = async () => {
        try {
            setLoading(true);
            const list = await listMyZones();
            setZones(list);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load your zones.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refresh(); }, []);

    return (
        <div className="min-h-screen bg-bg text-text-primary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-xs text-text-muted hover:text-text-primary inline-flex items-center gap-1 mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </button>

                <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black font-display tracking-tight">Friend Zones</h1>
                        <p className="text-sm text-text-secondary mt-1">
                            Private squads where you and your friends compete on a shared leaderboard.
                        </p>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-primary text-bg font-semibold inline-flex items-center gap-2 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> New Zone
                    </button>
                </div>

                {loading && (
                    <div className="py-16 flex items-center justify-center text-text-muted">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                )}

                {!loading && error && (
                    <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm">
                        {error}
                    </div>
                )}

                {!loading && !error && zones.length === 0 && (
                    <div className="border border-dashed border-border rounded-2xl p-12 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-text-primary">No zones yet</h2>
                        <p className="text-sm text-text-muted mt-1 mb-5">
                            Create a zone or ask a friend to share their invite link.
                        </p>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-primary text-bg font-semibold inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create your first zone
                        </button>
                    </div>
                )}

                {!loading && !error && zones.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {zones.map(z => (
                            <Link
                                key={z._id}
                                to={`/friendzones/${z._id}`}
                                className="block p-5 rounded-2xl border border-border bg-surface hover:bg-surface-2 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-bold text-text-primary truncate">{z.name}</h3>
                                    {z.isOwner && (
                                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-warning">
                                            <Crown className="w-3 h-3" /> Owner
                                        </span>
                                    )}
                                </div>
                                {z.description && (
                                    <p className="text-xs text-text-muted line-clamp-2 mb-3">{z.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{z.memberCount} / {z.maxMembers} members</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <CreateZoneModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={() => refresh()}
            />
        </div>
    );
};

export default FriendZones;
