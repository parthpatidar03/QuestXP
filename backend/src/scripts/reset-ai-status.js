const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Course = require('../models/Course');
const EmbeddingStatus = require('../models/EmbeddingStatus');

async function resetFailedAIStatus() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI missing in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find({});
        console.log(`Checking ${courses.length} courses...`);
        
        let totalReset = 0;
        for (const course of courses) {
            let modified = false;
            course.sections.forEach(section => {
                section.lectures.forEach(lecture => {
                    const statuses = lecture.aiStatus || {};
                    const anyFailed = Object.values(statuses).some(s => s === 'failed');
                    
                    if (anyFailed) {
                        console.log(`Resetting status for lecture: ${lecture.title}`);
                        lecture.aiStatus = {
                            transcription: 'pending',
                            notes: 'pending',
                            quiz: 'pending',
                            topics: 'pending',
                            embedding: 'pending',
                            errorReason: null
                        };
                        modified = true;
                        totalReset++;
                    }
                });
            });
            if (modified) {
                await course.save();
            }
        }

        const embedRes = await EmbeddingStatus.updateMany(
            { status: 'failed' },
            { $set: { status: 'pending', errorReason: null } }
        );
        
        console.log(`Reset ${totalReset} lectures in Courses.`);
        console.log(`Reset ${embedRes.modifiedCount} documents in EmbeddingStatus.`);
        console.log('AI status reset complete.');
        process.exit(0);
    } catch (err) {
        console.error('Reset failed:', err);
        process.exit(1);
    }
}

resetFailedAIStatus();
