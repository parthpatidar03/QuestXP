const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─── Study Plan Subdocuments ──────────────────────────────────────────────────
// T006: studyPlan subdocument schema (all fields from data-model.md)

const dailyAllocationSchema = new Schema({
    date:           { type: Date, required: true },
    dateStr:        { type: String, required: true },
    dayType:        { type: String, enum: ['weekday', 'weekend', 'rest', 'buffer'], required: true },
    capacityMins:   { type: Number, default: 0 },
    lectureIds:     [{ type: Schema.Types.ObjectId }],
    totalAllocMins: { type: Number, default: 0 },
    isHeavyDay:     { type: Boolean, default: false },
}, { _id: false });

const phaseSchema = new Schema({
    sectionId:                  { type: Schema.Types.ObjectId },
    sectionTitle:               { type: String },
    phaseIndex:                 { type: Number },
    startDate:                  { type: Date },
    endDate:                    { type: Date },
    lectureCount:               { type: Number, default: 0 },
    totalMins:                  { type: Number, default: 0 },
    milestoneLabel:             { type: String },
    cannotCompleteByDeadline:   { type: Boolean, default: false },
    warningMessage:             { type: String, default: null },
}, { _id: false });

const monthlyMilestoneSchema = new Schema({
    monthLabel:      { type: String },
    monthKey:        { type: String },
    sectionsComplete: [{ type: String }],
    lectureCount:    { type: Number, default: 0 },
    xpTarget:        { type: Number, default: 0 },
}, { _id: false });

const weeklyTargetSchema = new Schema({
    weekKey:               { type: String },
    weekLabel:             { type: String },
    lectureIds:            [{ type: Schema.Types.ObjectId }],
    totalMins:             { type: Number, default: 0 },
    capacityMins:          { type: Number, default: 0 },
    xpTarget:              { type: Number, default: 0 },
    overCapacityWarning:   { type: Boolean, default: false },
    overCapacityMessage:   { type: String, default: null },
}, { _id: false });

const studyPlanSchema = new Schema({
    generatedAt:          { type: Date },
    lastRecalcAt:         { type: Date },
    recalcReason:         { type: String, default: 'manual' },
    deadline:             { type: Date },
    weekdayCapacityMins:  { type: Number, default: 0 },
    weekendCapacityMins:  { type: Number, default: 0 },
    isFeasible:           { type: Boolean, default: true },
    infeasibleByDays:     { type: Number, default: 0 },
    bufferDayCount:       { type: Number, default: 0 },
    removeBufferToFitDays: { type: Number, default: null },
    pushDeadlineDays:     { type: Number, default: null },
    tightDeadlineWarning: { type: Boolean, default: false },
    tightDeadlineMessage: { type: String, default: null },
    phases:               [phaseSchema],
    monthlyMilestones:    [monthlyMilestoneSchema],
    weeklyTargets:        [weeklyTargetSchema],
    dailyAllocations:     [dailyAllocationSchema],
    status:               { type: String, enum: ['active', 'complete', 'overdue'], default: 'active' },
    scheduleStatus:       { type: String, enum: ['ahead', 'on_track', 'behind'], default: 'on_track' },
    scheduleMessage:      { type: String, default: null },
    isOverdue:            { type: Boolean, default: false },
    actualCompletionDate: { type: Date, default: null },
    newEndDateMessage:    { type: String, default: null },
}, { _id: false });

// T007: recalcLog subdocument array (capped at 20 entries by service layer)
const recalcLogSchema = new Schema({
    at:                    { type: Date, required: true },
    reason:                { type: String, required: true },
    lecturesCompletedAt:   { type: Number, default: 0 },
    prevEndDate:           { type: Date, default: null },
    newEndDate:            { type: Date, default: null },
    deltaDays:             { type: Number, default: null },
}, { _id: false });

// ─── Main Progress Schema ─────────────────────────────────────────────────────

const progressSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },

    lectureProgress: [{
        lecture: { type: Schema.Types.ObjectId, required: true },
        watchedSeconds: { type: Number, default: 0 },
        lastPosition: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        watchCount: { type: Number, default: 0 },
    }],

    completedCount: { type: Number, default: 0 },
    completionPct: { type: Number, default: 0 },
    lastLectureId: { type: Schema.Types.ObjectId, default: null },
    totalMinutes: { type: Number, default: 0 },

    studySessions: [{
        date: { type: Date, required: true },
        minutesStudied: { type: Number, default: 0 },
        lecturesCompleted: [{ type: Schema.Types.ObjectId }],
        goalMet: { type: Boolean, default: false },
    }],

    // T006: Full studyPlan subdocument
    studyPlan: { type: studyPlanSchema, default: null },

    // T007: recalcLog array (capped at 20 by service layer)
    recalcLog: [recalcLogSchema],

    deadline: { type: Date, default: null },
    weekdayCapacityMins: { type: Number, default: 0 },
    weekendCapacityMins: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
});

progressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
