const { test, describe } = require('node:test');
const assert = require('node:assert');

const {
    recalcCourseTotals,
    pruneRoadmapVideos,
    countRoadmapVideos,
    renumberSections,
    completionPct,
} = require('../src/services/courseCleanup');

describe('recalcCourseTotals', () => {
    test('recounts lectures and duration from the remaining sections', () => {
        const course = {
            totalLectures: 99,
            totalDuration: 99999,
            sections: [
                { lectures: [{ duration: 600 }, { duration: 300 }] },
                { lectures: [{ duration: 900 }] },
            ],
        };

        recalcCourseTotals(course);

        assert.strictEqual(course.totalLectures, 3);
        assert.strictEqual(course.totalDuration, 1800);
    });

    test('handles a section with no lectures yet', () => {
        const course = { sections: [{ lectures: [{ duration: 60 }] }, {}] };

        recalcCourseTotals(course);

        assert.strictEqual(course.totalLectures, 1);
        assert.strictEqual(course.totalDuration, 60);
    });

    test('zeroes out an empty course rather than leaving stale totals', () => {
        const course = { totalLectures: 5, totalDuration: 3000, sections: [] };

        recalcCourseTotals(course);

        assert.strictEqual(course.totalLectures, 0);
        assert.strictEqual(course.totalDuration, 0);
    });

    test('treats a missing duration as zero instead of NaN', () => {
        const course = { sections: [{ lectures: [{ duration: 600 }, {}] }] };

        recalcCourseTotals(course);

        assert.strictEqual(course.totalDuration, 600);
    });
});

describe('pruneRoadmapVideos', () => {
    const roadmap = () => ({
        days: [
            {
                totalMinutes: 30,
                plannedVideos: [
                    { videoId: 'a', duration: 600 },
                    { videoId: 'b', duration: 1200 },
                ],
            },
            {
                totalMinutes: 10,
                plannedVideos: [{ videoId: 'c', duration: 600 }],
            },
        ],
    });

    test('drops matching videos and rewrites the day total in minutes', () => {
        const rm = roadmap();

        pruneRoadmapVideos(rm, v => v.videoId === 'b');

        assert.deepStrictEqual(rm.days[0].plannedVideos.map(v => v.videoId), ['a']);
        // plannedVideos hold seconds, totalMinutes holds minutes: 600s -> 10min.
        assert.strictEqual(rm.days[0].totalMinutes, 10);
    });

    test('leaves untouched days exactly as they were', () => {
        const rm = roadmap();

        pruneRoadmapVideos(rm, v => v.videoId === 'b');

        assert.strictEqual(rm.days[1].plannedVideos.length, 1);
        assert.strictEqual(rm.days[1].totalMinutes, 10);
    });

    test('can empty a day completely', () => {
        const rm = roadmap();

        pruneRoadmapVideos(rm, v => v.videoId === 'c');

        assert.deepStrictEqual(rm.days[1].plannedVideos, []);
        assert.strictEqual(rm.days[1].totalMinutes, 0);
    });

    test('removes every video belonging to one course', () => {
        const rm = {
            days: [{
                totalMinutes: 30,
                plannedVideos: [
                    { videoId: 'a', playlistId: 'course-1', duration: 600 },
                    { videoId: 'b', playlistId: 'course-2', duration: 1200 },
                ],
            }],
        };

        pruneRoadmapVideos(rm, v => v.playlistId === 'course-1');

        assert.deepStrictEqual(rm.days[0].plannedVideos.map(v => v.videoId), ['b']);
        assert.strictEqual(rm.days[0].totalMinutes, 20);
    });
});

describe('countRoadmapVideos', () => {
    test('sums planned videos across every day', () => {
        const rm = {
            days: [
                { plannedVideos: [{}, {}] },
                { plannedVideos: [] },
                { plannedVideos: [{}] },
            ],
        };

        assert.strictEqual(countRoadmapVideos(rm), 3);
    });

    test('reports zero for a plan with nothing left, so callers can delete it', () => {
        const rm = { days: [{ plannedVideos: [] }, { plannedVideos: [] }] };

        assert.strictEqual(countRoadmapVideos(rm), 0);
    });

    test('reports zero for a plan with no days', () => {
        assert.strictEqual(countRoadmapVideos({ days: [] }), 0);
    });
});

describe('renumberSections', () => {
    test('closes the gap left by a removed section', () => {
        // Section with order 1 was removed.
        const sections = [
            { title: 'first', order: 0 },
            { title: 'third', order: 2 },
        ];

        renumberSections(sections);

        assert.deepStrictEqual(sections.map(s => s.order), [0, 1]);
    });

    test('numbers by existing order, not array position', () => {
        const sections = [
            { title: 'second', order: 5 },
            { title: 'first', order: 1 },
        ];

        renumberSections(sections);

        assert.strictEqual(sections.find(s => s.title === 'first').order, 0);
        assert.strictEqual(sections.find(s => s.title === 'second').order, 1);
    });

    test('does not reorder the array itself', () => {
        const sections = [{ title: 'b', order: 5 }, { title: 'a', order: 1 }];

        renumberSections(sections);

        assert.deepStrictEqual(sections.map(s => s.title), ['b', 'a']);
    });

    test('leaves an already-correct list alone', () => {
        const sections = [{ order: 0 }, { order: 1 }, { order: 2 }];

        renumberSections(sections);

        assert.deepStrictEqual(sections.map(s => s.order), [0, 1, 2]);
    });
});

describe('completionPct', () => {
    test('rebuilds the percentage against the smaller course', () => {
        // Was 2 of 4 (50%). One completed lecture was removed with its section,
        // leaving 1 of 3.
        assert.strictEqual(completionPct(1, 3), 33);
    });

    test('reads 100% when every remaining lecture is done', () => {
        assert.strictEqual(completionPct(3, 3), 100);
    });

    test('returns 0 instead of dividing by zero on an empty course', () => {
        assert.strictEqual(completionPct(0, 0), 0);
    });
});
