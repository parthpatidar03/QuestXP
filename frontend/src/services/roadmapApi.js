import api from './api';

export const generateRoadmap = async (config) => {
    const response = await api.post('/roadmap/generate', config);
    return response.data;
};

export const getCurrentRoadmap = async () => {
    const response = await api.get('/roadmap/current');
    return response.data;
};

export const updateRoadmapDays = async (daysToAdd) => {
    const response = await api.patch('/roadmap/adjust', { daysToAdd });
    return response.data;
};
