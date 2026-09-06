const mongoose = require("mongoose");

const STAGES = [
    "START",
    "INTRODUCTION",
    "TECHNICAL",
    "BEHAVIORAL",
    "DSA",
    "FINAL",
    "COMPLETED"
];

const mockInterviewSessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
            index: true
        },
        interviewReportId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InterviewReport",
            required: true,
            index: true
        },
        interviewPlan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InterviewReport",
            default: null
        },
        roleTitle: {
            type: String,
            required: true,
            trim: true
        },
        targetCompany: {
            type: String,
            default: "",
            trim: true
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium"
        },
        interviewType: {
            type: String,
            enum: ["FULL", "TECHNICAL_ONLY", "BEHAVIORAL_ONLY", "DSA_FOCUSED"],
            default: "FULL"
        },
        durationMinutes: {
            type: Number,
            default: 0,
            min: 0,
            max: 180
        },
        status: {
            type: String,
            enum: ["CREATED", "READY", "IN_PROGRESS", "PAUSED", "COMPLETED", "ABANDONED"],
            default: "CREATED",
            index: true
        },
        currentStage: {
            type: String,
            enum: STAGES,
            default: "START"
        },
        stagePlan: {
            type: [String],
            default: ["INTRODUCTION", "TECHNICAL", "BEHAVIORAL", "DSA", "FINAL"]
        },
        currentStageIndex: {
            type: Number,
            default: 0
        },
        currentQuestionIndex: {
            type: Number,
            default: 0
        },
        dsaQuestionCount: {
            type: Number,
            default: 0
        },
        dsaFollowupCount: {
            type: Number,
            default: 0
        },
        dsaProblemsSelected: [
            {
                id: { type: String },
                title: { type: String },
                topic: { type: String },
                difficulty: { type: String }
            }
        ],
        currentQuestion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MockInterviewQuestion",
            default: null
        },
        candidateContextSnapshot: {
            roleTitle: { type: String, default: "" },
            skills: { type: [String], default: [] },
            skillGaps: [
                {
                    skill: { type: String },
                    severity: { type: String, enum: ["low", "medium", "high"] }
                }
            ],
            dsaWeakTopics: { type: [String], default: [] },
            solvedQuestionIds: { type: [String], default: [] },
            previousMockScores: { type: [Number], default: [] }
        },
        startedAt: {
            type: Date,
            default: null
        },
        endedAt: {
            type: Date,
            default: null
        },
        totalTimeSpentSeconds: {
            type: Number,
            default: 0
        },
        remainingSeconds: {
            type: Number,
            default: 900
        },
        scores: {
            overall: { type: Number, default: 0, min: 0, max: 100 },
            technical: { type: Number, default: 0, min: 0, max: 100 },
            behavioral: { type: Number, default: 0, min: 0, max: 100 },
            dsa: { type: Number, default: 0, min: 0, max: 100 },
            problemSolving: { type: Number, default: 0, min: 0, max: 100 },
            communication: { type: Number, default: 0, min: 0, max: 100 }
        },
        finalReport: {
            summary: { type: String, default: "" },
            strengths: { type: [String], default: [] },
            weaknesses: { type: [String], default: [] },
            actionableSteps: [
                {
                    label: { type: String },
                    link: { type: String },
                    type: { type: String }
                }
            ],
            hiringRecommendation: {
                type: String,
                enum: [
                    "STRONG_HIRE",
                    "HIRE",
                    "LEANING_HIRE",
                    "LEANING_NO_HIRE",
                    "NO_HIRE",
                    "PENDING"
                ],
                default: "PENDING"
            }
        }
    },
    {
        timestamps: true
    }
);

const MockInterviewSession = mongoose.model("MockInterviewSession", mockInterviewSessionSchema);

module.exports = {
    MockInterviewSession,
    STAGES
};
