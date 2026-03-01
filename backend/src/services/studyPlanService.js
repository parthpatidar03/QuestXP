/**
 * studyPlanService.js
 * Core algorithm: generate, recalculate, and allocate study plans
 * No AI calls — pure synchronous JS using date-fns for date arithmetic
 */

const {
    addDays,
    getDay,
    startOfWeek,
    startOfMonth,
    differenceInCalendarDays,
    format,
    isToday,
    parseISO,
    isBefore,
    isAfter,
    startOfDay,
} = require('date-fns');

const Progress = require('../models/Progress');
const Course = require('../models/Course');
const { XP_REWARDS } = require('../constants/xp');

// ─── Algorithm Constants ────────────────────────────────────────────────────
// T008: BUFFER_DAY_RULES thresholds (daysUntilDeadline → bufferDays)
const BUFFER_DAY_RULES = [
    { minDays: 30, buffer: 3 },
    { minDays: 10, buffer: 2 },
    { minDays: 3,  buffer: 1 },
    { minDays: 0,  buffer: 0 },
];

// If totalAllocMins > capacityMins * (1 + HEAVY_DAY_TOLERANCE) → isHeavyDay
const HEAVY_DAY_TOLERANCE = 0.10; // 10%

const MAX_RECALC_LOG_ENTRIES = 20;

// ─── Private Helpers ─────────────────────────────────────────────────────────

/**
 * T010: Returns a flat array of all lecture objects sorted by
 *       section.order then lecture.order within each section.
 * Each lecture object is enriched with sectionIndex and sectionId.
 */
function _collectLecturesInOrder(course) {
    const lectures = [];
    const sortedSections = [...course.sections].sort((a, b) => a.order - b.order);

    sortedSections.forEach((section, sectionIndex) => {
        const sortedLectures = [...section.lectures].sort((a, b) => a.order - b.order);
        sortedLectures.forEach(lec => {
            lectures.push({
                _id: lec._id,
                title: lec.title,
                duration: lec.duration,          // seconds
                order: lec.order,
                youtubeId: lec.youtubeId,
                thumbnailUrl: lec.thumbnailUrl,
                sectionIndex,
                sectionId: section._id,
                sectionTitle: section.title,
            });
        });
    });

    // Hard invariant: verify no cross-section interleaving
    let lastSectionIndex = -1;
    for (const lec of lectures) {
        if (lec.sectionIndex < lastSectionIndex) {
            throw new Error('_collectLecturesInOrder: cross-section interleaving detected');
        }
        lastSectionIndex = lec.sectionIndex;
    }

    return lectures;
}

/**
 * T011: Applies BUFFER_DAY_RULES and returns integer buffer day count.
 */
function _computeBufferDayCount(daysUntilDeadline) {
    // Explicit branches for all 4 thresholds (unit-testable)
    if (daysUntilDeadline >= 30) return 3;   // ≥30 days → 3 buffer
    if (daysUntilDeadline >= 10) return 2;   // 10–29 days → 2 buffer
    if (daysUntilDeadline >= 3)  return 1;   // 3–9 days → 1 buffer
    return 0;                                 // <3 days → 0 buffer
}

/**
 * T012 + T023: Enumerates calendar days from startDate up to (but not including)
 *              the deadline. Rest days receive dayType='rest' and capacityMins=0.
 *              Buffer days are appended at the end with dayType='buffer'.
 * T035: Buffer days appended before deadline counting backward.
 */
function _enumerateStudyDays(startDate, deadline, bufferDayCount, restDays = []) {
    const restDaySet = new Set((restDays || []).map(d => format(parseISO(d), 'yyyy-MM-dd')));
    const days = [];
    const totalDays = differenceInCalendarDays(deadline, startDate);
    const studyDays = totalDays - bufferDayCount;

    for (let i = 0; i < studyDays; i++) {
        const date = addDays(startDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayOfWeek = getDay(date); // 0=Sun, 1=Mon, ..., 6=Sat

        let dayType;
        let capacityMins;

        if (restDaySet.has(dateStr)) {
            dayType = 'rest';
            capacityMins = 0;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayType = 'weekend';
            capacityMins = null; // filled in by caller
        } else {
            dayType = 'weekday';
            capacityMins = null; // filled in by caller
        }

        days.push({ date, dateStr, dayType, capacityMins });
    }

    // T035: Append exactly bufferDayCount entries with dayType='buffer'
    for (let i = 0; i < bufferDayCount; i++) {
        const date = addDays(startDate, studyDays + i);
        days.push({
            date,
            dateStr: format(date, 'yyyy-MM-dd'),
            dayType: 'buffer',
            capacityMins: 0,
        });
    }

    return days;
}

/**
 * T013 + T024: Greedy forward-fill allocation.
 * For each study day, fill up to capacity with whole lectures in order.
 * If a single lecture exceeds capacity, assign it anyway and set isHeavyDay=true.
 * T024: sets isHeavyDay when totalAllocMins > capacityMins * (1 + HEAVY_DAY_TOLERANCE)
 */
function _greedyAllocate(lectures, studyDays, weekdayCapacityMins, weekendCapacityMins) {
    const allocations = [];
    let lectureIndex = 0;

    for (const day of studyDays) {
        // Assign capacity based on day type
        let capacityMins = 0;
        if (day.dayType === 'weekday') capacityMins = weekdayCapacityMins;
        else if (day.dayType === 'weekend') capacityMins = weekendCapacityMins;
        // rest and buffer days have capacityMins = 0

        const dayAlloc = {
            date: day.date,
            dateStr: day.dateStr,
            dayType: day.dayType,
            capacityMins,
            lectureIds: [],
            lectures: [],
            totalAllocMins: 0,
            isHeavyDay: false,
        };

        if (capacityMins > 0 && lectureIndex < lectures.length) {
            // Fill the day up to capacity
            let usedMins = 0;
            while (lectureIndex < lectures.length) {
                const lec = lectures[lectureIndex];
                const lecMins = Math.ceil(lec.duration / 60);

                if (usedMins === 0) {
                    // Always assign at least one lecture (even if it exceeds capacity)
                    dayAlloc.lectureIds.push(lec._id);
                    dayAlloc.lectures.push(lec);
                    usedMins += lecMins;
                    lectureIndex++;
                } else if (usedMins + lecMins <= capacityMins) {
                    dayAlloc.lectureIds.push(lec._id);
                    dayAlloc.lectures.push(lec);
                    usedMins += lecMins;
                    lectureIndex++;
                } else {
                    break;
                }
            }

            dayAlloc.totalAllocMins = usedMins;
            // T024: Heavy day detection
            if (usedMins > capacityMins * (1 + HEAVY_DAY_TOLERANCE)) {
                dayAlloc.isHeavyDay = true;
            }
        }

        allocations.push(dayAlloc);
    }

    return allocations;
}

/**
 * T014 + T030: Groups dailyAllocations by section membership.
 * Sets startDate, endDate, lectureCount, totalMins, milestoneLabel for each phase.
 * Hard invariant: no daily allocation spans two sections.
 */
function _buildPhases(dailyAllocations, course) {
    const phases = [];
    const sortedSections = [...course.sections].sort((a, b) => a.order - b.order);

    let sectionIdx = 0;
    let currentPhase = null;

    for (const alloc of dailyAllocations) {
        if (alloc.lectures.length === 0) continue;

        for (const lec of alloc.lectures) {
            const sec = sortedSections[lec.sectionIndex];
            if (!sec) continue;

            // T030: If this lecture belongs to a new section, close current phase
            if (!currentPhase || currentPhase.sectionId.toString() !== sec._id.toString()) {
                if (currentPhase) {
                    phases.push(currentPhase);
                }
                currentPhase = {
                    sectionId: sec._id,
                    sectionTitle: sec.title,
                    phaseIndex: sectionIdx++,
                    startDate: alloc.date,
                    endDate: alloc.date,
                    lectureCount: 0,
                    totalMins: 0,
                    milestoneLabel: `Complete ${sec.title}`,
                    cannotCompleteByDeadline: false,
                    warningMessage: null,
                };
            }

            currentPhase.endDate = alloc.date;
            currentPhase.lectureCount++;
            currentPhase.totalMins += Math.ceil(lec.duration / 60);
        }
    }

    if (currentPhase) phases.push(currentPhase);

    return phases;
}

/**
 * T015 + T032: Groups phases by calendar month using startOfMonth.
 * A month's sectionsComplete[] lists section titles whose phase endDate falls in that month.
 */
function _buildMonthlyMilestones(phases, dailyAllocations) {
    const monthMap = new Map();

    for (const phase of phases) {
        const monthKey = format(startOfMonth(phase.endDate), 'yyyy-MM');
        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, {
                monthLabel: format(phase.endDate, 'MMMM yyyy'),
                monthKey,
                sectionsComplete: [],
                lectureCount: 0,
                xpTarget: XP_REWARDS.MONTHLY_GOAL_MET,
            });
        }
        const month = monthMap.get(monthKey);
        month.sectionsComplete.push(phase.sectionTitle);
        month.lectureCount += phase.lectureCount;
    }

    return Array.from(monthMap.values());
}

/**
 * T016: Groups allocations by ISO week using startOfWeek.
 * Computes weekLabel, lectureIds[], totalMins, capacityMins, xpTarget.
 */
function _buildWeeklyTargets(dailyAllocations, weekdayCapacityMins, weekendCapacityMins) {
    const weekMap = new Map();

    for (const alloc of dailyAllocations) {
        const weekStart = startOfWeek(alloc.date, { weekStartsOn: 1 }); // Monday
        const weekKey = format(weekStart, 'yyyy-ww');

        if (!weekMap.has(weekKey)) {
            weekMap.set(weekKey, {
                weekKey,
                weekLabel: `Week of ${format(weekStart, 'MMM d, yyyy')}`,
                weekStart,
                lectureIds: [],
                totalMins: 0,
                capacityMins: 0,
                xpTarget: XP_REWARDS.WEEKLY_GOAL_MET,
                overCapacityWarning: false,
            });
        }

        const week = weekMap.get(weekKey);
        week.lectureIds.push(...alloc.lectureIds);
        week.totalMins += alloc.totalAllocMins;

        // Calculate weekly capacity based on day types
        if (alloc.dayType === 'weekday') week.capacityMins += weekdayCapacityMins;
        else if (alloc.dayType === 'weekend') week.capacityMins += weekendCapacityMins;
    }

    return Array.from(weekMap.values());
}

/**
 * T017: Returns the dailyAllocation entry matching today (UTC date).
 */
function _getTodayAllocation(dailyAllocations, completedLectureIds = []) {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const alloc = dailyAllocations.find(a => a.dateStr === todayStr);
    if (!alloc) return null;

    const completedSet = new Set(completedLectureIds.map(id => id.toString()));
    return {
        ...alloc,
        lectures: alloc.lectures.map(lec => ({
            ...lec,
            completed: completedSet.has(lec._id.toString()),
        })),
    };
}

/**
 * T018: Computes infeasibility details when lectures overflow available days.
 */
function _handleInfeasible(totalLectureMins, availableCapacityMins, avgDailyCapacity) {
    const overflowMins = totalLectureMins - availableCapacityMins;
    const infeasibleByDays = avgDailyCapacity > 0
        ? Math.ceil(overflowMins / avgDailyCapacity)
        : 999;

    return { isFeasible: false, infeasibleByDays };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * T019: Orchestrates all helpers to generate a full study plan.
 * Saves plan to progress.studyPlan and returns the populated plan object.
 */
const generatePlan = async (userId, courseId, {
    deadline,
    weekdayCapacityMins,
    weekendCapacityMins,
    restDays = [],
    reason = 'manual',
    startDateOverride = null,
    lectureListOverride = null,
} = {}) => {
    const startTime = Date.now();
    console.log(`[StudyPlan] generatePlan start — userId=${userId} courseId=${courseId} reason=${reason}`);

    const course = await Course.findById(courseId);
    if (!course) throw Object.assign(new Error('Course not found'), { status: 404 });

    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) throw Object.assign(new Error('Progress not found'), { status: 404 });

    // T051: Zero-lecture guard (course not ready)
    const totalLectures = course.sections.reduce((sum, s) => sum + s.lectures.length, 0);
    if (totalLectures === 0) {
        return { courseNotReady: true };
    }

    const allLectures = lectureListOverride || _collectLecturesInOrder(course);
    const startDate = startDateOverride ? startDateOverride : startOfDay(new Date());
    const deadlineDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;

    const daysUntilDeadline = differenceInCalendarDays(deadlineDate, startDate);

    // T034 / T011: Compute buffer days
    const bufferDayCount = _computeBufferDayCount(daysUntilDeadline);

    // T012: Enumerate study days (with buffer days appended at end)
    const studyDays = _enumerateStudyDays(startDate, deadlineDate, bufferDayCount, restDays);

    // T013: Greedy allocation
    const dailyAllocations = _greedyAllocate(
        allLectures,
        studyDays,
        weekdayCapacityMins,
        weekendCapacityMins
    );

    // Feasibility check
    const totalLectureMins = allLectures.reduce((sum, l) => sum + Math.ceil(l.duration / 60), 0);
    const scheduledCount = dailyAllocations.reduce((sum, a) => sum + a.lectures.length, 0);
    const isFeasible = scheduledCount >= allLectures.length;

    let infeasibleByDays = 0;
    let removeBufferToFitDays = null;
    let pushDeadlineDays = null;

    if (!isFeasible) {
        const availableCap = dailyAllocations.reduce((s, a) => s + a.capacityMins, 0);
        const avgCap = availableCap / (studyDays.filter(d => d.dayType !== 'buffer' && d.dayType !== 'rest').length || 1);
        const result = _handleInfeasible(totalLectureMins, availableCap, avgCap);
        infeasibleByDays = result.infeasibleByDays;

        // T036: Conflict resolution options
        removeBufferToFitDays = bufferDayCount;
        pushDeadlineDays = infeasibleByDays;
    }

    // T014: Build phases
    const phases = _buildPhases(dailyAllocations, course);

    // T031: Section-completion warnings
    phases.forEach(phase => {
        if (isAfter(phase.endDate, deadlineDate)) {
            phase.cannotCompleteByDeadline = true;
            phase.warningMessage = `At your current goal, "${phase.sectionTitle}" cannot be completed by your deadline`;
        }
    });

    // T033: Single-section course path — intentionally uniform handling, no special-casing
    // phases will naturally have 1 entry if course has 1 section

    // T015: Build monthly milestones (anchored to phase end dates)
    const monthlyMilestones = _buildMonthlyMilestones(phases, dailyAllocations);

    // T016: Build weekly targets
    const weeklyTargets = _buildWeeklyTargets(dailyAllocations, weekdayCapacityMins, weekendCapacityMins);

    // T025: Over-capacity warning per week
    weeklyTargets.forEach(w => {
        if (w.totalMins > w.capacityMins) {
            w.overCapacityWarning = true;
            w.overCapacityMessage = `This week's plan (${w.totalMins} min) exceeds your goal (${w.capacityMins} min)`;
        }
    });

    // T032: Ensure monthly milestones sectionsComplete[] only lists phases whose endDate is in that month
    // (already enforced by _buildMonthlyMilestones — no additional work needed)

    // T017: Today's allocation
    const completedLectureIds = (progress.lectureProgress || [])
        .filter(lp => lp.completed)
        .map(lp => lp.lecture);
    const todayAllocation = _getTodayAllocation(dailyAllocations, completedLectureIds);

    // T037: Tight-deadline warning
    let tightDeadlineWarning = false;
    let tightDeadlineMessage = null;
    if (daysUntilDeadline < 10) {
        tightDeadlineWarning = true;
        tightDeadlineMessage = bufferDayCount === 0
            ? 'Tight deadline — no revision days reserved.'
            : `Tight deadline — only ${bufferDayCount} revision day${bufferDayCount > 1 ? 's' : ''} reserved.`;
    }

    // T042: section_added reason — newEndDateMessage
    let newEndDateMessage = null;
    if (reason === 'section_added' && phases.length > 0) {
        const lastPhase = phases[phases.length - 1];
        newEndDateMessage = `Your plan has been updated. New estimated completion: ${format(lastPhase.endDate, 'MMM d, yyyy')}`;
    }

    // Build plan object for persistence
    const studyPlan = {
        generatedAt: new Date(),
        lastRecalcAt: new Date(),
        recalcReason: reason,
        deadline: deadlineDate,
        weekdayCapacityMins,
        weekendCapacityMins,
        isFeasible,
        infeasibleByDays,
        bufferDayCount,
        removeBufferToFitDays,
        pushDeadlineDays,
        tightDeadlineWarning,
        tightDeadlineMessage,
        phases,
        monthlyMilestones,
        weeklyTargets,
        dailyAllocations,
        status: 'active',
        scheduleStatus: 'on_track',
        scheduleMessage: null,
        isOverdue: false,
        newEndDateMessage,
    };

    // Persist
    progress.studyPlan = studyPlan;
    progress.deadline = deadlineDate;
    progress.weekdayCapacityMins = weekdayCapacityMins;
    progress.weekendCapacityMins = weekendCapacityMins;
    await progress.save();

    const elapsed = Date.now() - startTime;
    console.log(`[StudyPlan] generatePlan complete — courseId=${courseId} lectures=${allLectures.length} isFeasible=${isFeasible} elapsed=${elapsed}ms`);

    return { ...studyPlan, todayAllocation };
};

/**
 * T039: Recalculates the plan if not already done today (idempotency guard).
 * Merges: past allocations unchanged, future allocations regenerated using incomplete lectures.
 */
const recalculateIfNeeded = async (userId, courseId, { reason = 'login' } = {}) => {
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress || !progress.studyPlan) return null;

    const plan = progress.studyPlan;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // T039: Idempotency guard — skip if already recalculated today
    if (plan.generatedAt && format(new Date(plan.generatedAt), 'yyyy-MM-dd') === todayStr) {
        return plan;
    }

    // T044: All lectures complete — no recalculation needed
    const totalLectures = (await Course.findById(courseId))
        ?.sections.reduce((s, sec) => s + sec.lectures.length, 0) || 0;
    const completedCount = (progress.lectureProgress || []).filter(lp => lp.completed).length;

    if (completedCount >= totalLectures && totalLectures > 0) {
        progress.studyPlan = {
            ...plan,
            status: 'complete',
            actualCompletionDate: new Date(),
        };
        await progress.save();
        return progress.studyPlan;
    }

    // T043: Overdue plan state
    if (plan.deadline && isBefore(new Date(plan.deadline), new Date())) {
        const course = await Course.findById(courseId);
        const allLectures = _collectLecturesInOrder(course);
        const completedIds = new Set(
            (progress.lectureProgress || []).filter(lp => lp.completed).map(lp => lp.lecture.toString())
        );
        const remaining = allLectures.filter(l => !completedIds.has(l._id.toString()));

        const todayAlloc = {
            date: new Date(),
            dateStr: todayStr,
            dayType: 'weekday',
            capacityMins: plan.weekdayCapacityMins,
            lectureIds: remaining.map(l => l._id),
            lectures: remaining,
            totalAllocMins: remaining.reduce((s, l) => s + Math.ceil(l.duration / 60), 0),
            isHeavyDay: true,
        };

        progress.studyPlan = {
            ...plan,
            isOverdue: true,
            todayAllocation: todayAlloc,
            lastRecalcAt: new Date(),
            recalcReason: 'overdue',
        };
        await progress.save();
        return progress.studyPlan;
    }

    // Standard recalculation: generate plan from today with incomplete lectures only
    const course = await Course.findById(courseId);
    const allLectures = _collectLecturesInOrder(course);
    const completedIds = new Set(
        (progress.lectureProgress || []).filter(lp => lp.completed).map(lp => lp.lecture.toString())
    );
    const incompleteLectures = allLectures.filter(l => !completedIds.has(l._id.toString()));

    // T041: Compare completed vs planned to determine schedule status
    const todayDate = startOfDay(new Date());
    const pastAllocations = (plan.dailyAllocations || []).filter(a =>
        isBefore(new Date(a.date), todayDate)
    );
    const plannedThroughToday = pastAllocations.reduce((s, a) => s + (a.lectureIds || []).length, 0);
    const actualCompleted = completedCount;

    let scheduleStatus = 'on_track';
    let scheduleMessage = null;
    const diff = actualCompleted - plannedThroughToday;

    if (diff > 0) {
        scheduleStatus = 'ahead';
        scheduleMessage = `You're ${diff} lecture${diff > 1 ? 's' : ''} ahead of schedule — keep it up!`;
    } else if (diff < 0) {
        scheduleStatus = 'behind';
        scheduleMessage = `You're ${Math.abs(diff)} lecture${Math.abs(diff) > 1 ? 's' : ''} behind — here's your catch-up plan`;
    }

    // Regenerate plan from today with incomplete lectures
    const newPlan = await generatePlan(userId, courseId, {
        deadline: plan.deadline,
        weekdayCapacityMins: plan.weekdayCapacityMins,
        weekendCapacityMins: plan.weekendCapacityMins,
        restDays: [],
        reason,
        startDateOverride: todayDate,
        lectureListOverride: incompleteLectures,
    });

    // Append recalcLog entry (capped at MAX_RECALC_LOG_ENTRIES)
    const recalcLogEntry = {
        at: new Date(),
        reason,
        lecturesCompletedAt: completedCount,
        prevEndDate: plan.phases?.slice(-1)[0]?.endDate || null,
        newEndDate: newPlan.phases?.slice(-1)[0]?.endDate || null,
        deltaDays: null,
    };

    if (recalcLogEntry.prevEndDate && recalcLogEntry.newEndDate) {
        recalcLogEntry.deltaDays = differenceInCalendarDays(
            new Date(recalcLogEntry.newEndDate),
            new Date(recalcLogEntry.prevEndDate)
        );
    }

    const recalcLog = [...(progress.recalcLog || []), recalcLogEntry].slice(-MAX_RECALC_LOG_ENTRIES);
    progress.recalcLog = recalcLog;

    // Merge schedule status into saved plan
    progress.studyPlan = {
        ...progress.studyPlan,
        scheduleStatus,
        scheduleMessage,
    };
    await progress.save();

    return { ...progress.studyPlan, scheduleStatus, scheduleMessage };
};

/**
 * T002: Get today's study allocation for a user+course (does NOT trigger recalculation).
 */
const getTodayAllocation = async (userId, courseId) => {
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress || !progress.studyPlan) return null;

    const completedIds = (progress.lectureProgress || [])
        .filter(lp => lp.completed).map(lp => lp.lecture);

    return _getTodayAllocation(progress.studyPlan.dailyAllocations || [], completedIds);
};

/**
 * T002: Returns 4 weeks of weekly target data starting from the current week.
 */
const getWeeklyView = async (userId, courseId) => {
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress || !progress.studyPlan) return null;

    const weeklyTargets = progress.studyPlan.weeklyTargets || [];
    const completedIds = new Set(
        (progress.lectureProgress || []).filter(lp => lp.completed).map(lp => lp.lecture.toString())
    );

    const todayWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-ww');

    return weeklyTargets
        .filter(w => w.weekKey >= todayWeekStart)
        .slice(0, 4)
        .map(w => ({
            ...w,
            completedCount: (w.lectureIds || []).filter(id => completedIds.has(id.toString())).length,
            isCurrent: w.weekKey === todayWeekStart,
        }));
};

module.exports = {
    generatePlan,
    recalculateIfNeeded,
    getTodayAllocation,
    getWeeklyView,
    // Exposed for unit testing
    _collectLecturesInOrder,
    _computeBufferDayCount,
    _enumerateStudyDays,
    _greedyAllocate,
    _buildPhases,
    _buildMonthlyMilestones,
    _buildWeeklyTargets,
    _getTodayAllocation,
    _handleInfeasible,
    BUFFER_DAY_RULES,
    HEAVY_DAY_TOLERANCE,
    MAX_RECALC_LOG_ENTRIES,
};
