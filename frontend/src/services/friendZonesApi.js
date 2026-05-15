import api from './api';

export const listMyZones = async () => {
    const { data } = await api.get('/friendzones');
    return data.zones || [];
};

export const createZone = async ({ name, description }) => {
    // Password is no longer required at creation. OTP-only zones from now on.
    const { data } = await api.post('/friendzones', { name, description });
    return data.zone;
};

export const getZone = async (zoneId) => {
    const { data } = await api.get(`/friendzones/${zoneId}`);
    return data; // { zone, leaderboard }
};

export const getZoneFeed = async (zoneId, limit = 30) => {
    const { data } = await api.get(`/friendzones/${zoneId}/feed`, { params: { limit } });
    return data.events || [];
};

export const generateJoinOtp = async (zoneId) => {
    const { data } = await api.post(`/friendzones/${zoneId}/generate-otp`);
    return data; // { code, expiresAt, ttlMs }
};

export const peekZone = async (inviteCode) => {
    const { data } = await api.post('/friendzones/peek', { inviteCode });
    return data.zone;
};

export const joinZone = async ({ inviteCode, otp, password }) => {
    const body = { inviteCode };
    if (otp) body.otp = otp;
    if (password) body.password = password;
    const { data } = await api.post('/friendzones/join', body);
    return data;
};

export const leaveZone = async (zoneId) => {
    const { data } = await api.post(`/friendzones/${zoneId}/leave`);
    return data;
};

export const kickMember = async (zoneId, userId) => {
    const { data } = await api.post(`/friendzones/${zoneId}/kick/${userId}`);
    return data;
};

export const deleteZone = async (zoneId) => {
    const { data } = await api.delete(`/friendzones/${zoneId}`);
    return data;
};

export const regenerateInvite = async (zoneId) => {
    const { data } = await api.post(`/friendzones/${zoneId}/regenerate-invite`);
    return data.zone;
};

export const buildInviteUrl = (inviteCode) => {
    if (typeof window === 'undefined') return `/join/${inviteCode}`;
    return `${window.location.origin}/join/${inviteCode}`;
};
