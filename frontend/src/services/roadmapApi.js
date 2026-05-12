import api from './api';

export const generateRoadmap = async (config) => {
    const response = await api.post('/roadmap/generate', config);
    return response.data;
};

export const getCurrentRoadmap = async (courseId = null, roadmapId = null) => {
    const response = await api.get('/roadmap/current', { params: { courseId, roadmapId } });
    return response.data;
};

export const adjustRoadmap = async (roadmapId, daysToShift) => {
    const response = await api.patch('/roadmap/adjust', { roadmapId, daysToShift });
    return response.data;
};

export const partialShiftRoadmap = async (roadmapId, fromDayIndex, shiftAmount) => {
    const response = await api.patch('/roadmap/shift-partial', { roadmapId, fromDayIndex, shiftAmount });
    return response.data;
};
export const toggleVideoCompletion = async (roadmapId, videoId, completed) => {
    const response = await api.patch(`/roadmap/${roadmapId}/video/${videoId}/complete`, { completed });
    return response.data;
};
export const getAllRoadmaps = async () => {
    const response = await api.get('/roadmap/all');
    return response.data;
};
export const updateRoadmapTitle = async (roadmapId, title) => {
    const response = await api.patch(`/roadmap/${roadmapId}/title`, { title });
    return response.data;
};
export const deleteRoadmap = async (roadmapId) => {
    const response = await api.delete(`/roadmap/${roadmapId}`);
    return response.data;
};
