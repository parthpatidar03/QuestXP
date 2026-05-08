const Course = require('../models/Course');
const courseQueue = require('../queues/courseQueue');

const createCourse = async (ownerId, data) => {
    const course = new Course({
        owner: ownerId,
        title: data.title,
        sections: data.sections.map(s => ({
            title: s.title,
            playlistUrl: s.playlistUrl,
            order: s.order,
            lectures: []
        })),
        status: 'processing'
    });

    await course.save();

    await courseQueue.add('process-course', {
        courseId: course._id,
        sections: data.sections
    });

    return course;
};

const addSection = async (courseId, sectionData) => {
    // sectionData: { title, playlistUrl }
    await courseQueue.add('process-course', {
        courseId,
        sections: [sectionData],
        isAppend: true
    });
};

module.exports = { createCourse, addSection };
