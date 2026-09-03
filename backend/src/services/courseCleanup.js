/**
 * Pure helpers used when a course or one of its sections is removed.
 *
 * Kept dependency-free (no models, no queues) so they can be reasoned about
 * and unit tested on plain objects.
 */

/** Recounts a course's lecture total and duration from the sections it has left. */
const recalcCourseTotals = (course) => {
    const lectures = course.sections.flatMap(section => section.lectures || []);
    course.totalLectures = lectures.length;
    course.totalDuration = lectures.reduce((total, lecture) => total + (lecture.duration || 0), 0);
};

/**
 * Removes matching videos from every day of a roadmap and refreshes day totals.
 *
 * `shouldRemove(video)` decides per planned video. Days that lose nothing are
 * left alone so Mongoose doesn't mark them dirty for no reason.
 */
const pruneRoadmapVideos = (roadmap, shouldRemove) => {
    roadmap.days.forEach(day => {
        const kept = day.plannedVideos.filter(video => !shouldRemove(video));
        if (kept.length === day.plannedVideos.length) return;

        day.plannedVideos = kept;
        // plannedVideos store seconds; totalMinutes is minutes, same as the generator.
        day.totalMinutes = kept.reduce((total, video) => total + (video.duration || 0), 0) / 60;
    });
};

/** Total planned videos left across all days — zero means the plan is empty. */
const countRoadmapVideos = (roadmap) =>
    roadmap.days.reduce((total, day) => total + day.plannedVideos.length, 0);

/** Renumbers sections 0..n-1 by their existing order, closing any gap. */
const renumberSections = (sections) => {
    [...sections]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach((section, index) => { section.order = index; });
};

/** Completion percentage of a course, rounded the same way progressService does. */
const completionPct = (completedCount, totalLectures) =>
    (totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0);

module.exports = {
    recalcCourseTotals,
    pruneRoadmapVideos,
    countRoadmapVideos,
    renumberSections,
    completionPct,
};
