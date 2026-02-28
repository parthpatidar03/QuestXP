const Course = require('../models/Course');
const courseQueue = require('../queues/courseQueue');

const createCourse = async (ownerId, data) => {
    // data contains: title, sections (array of { title, playlistUrl, order })
    const course = new Course({
        owner: ownerId,
        title: data.title,
        sections: data.sections.map(s => ({
            title: s.title,
            playlistUrl: s.playlistUrl,
            order: s.order,
            lectures: [] // Populated by worker
        })),
        status: 'processing'
    });

    await course.save();

    // Enqueue background processing job
    await courseQueue.add('process-course', {
        courseId: course._id,
        sections: data.sections
    });

    return course;
};

module.exports = { createCourse };
