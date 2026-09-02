import api from './api';

export const deleteCourse = async (courseId) => {
    const { data } = await api.delete(`/courses/${courseId}`);
    return data;
};

export const deleteCourseSection = async (courseId, sectionId) => {
    const { data } = await api.delete(`/courses/${courseId}/sections/${sectionId}`);
    return data;
};
