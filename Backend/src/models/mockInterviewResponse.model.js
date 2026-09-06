const mongoose = require("mongoose");

const mockInterviewResponseSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MockInterviewSession",
            required: true,
            index: true
        },
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MockInterviewQuestion",
            required: true,
            index: true
        },
        transcript: {
            type: String,
            default: "",
            trim: true
        },
        audioDurationSeconds: {
            type: Number,
            default: 0
        },
        evaluation: {
            score: { type: Number, default: 0, min: 0, max: 10 },
            correctness: { type: Number, default: 0, min: 0, max: 10 },
            technicalDepth: { type: Number, default: 0, min: 0, max: 10 },
            problemSolving: { type: Number, default: 0, min: 0, max: 10 },
            communication: { type: Number, default: 0, min: 0, max: 10 },
            timeComplexity: { type: Number, default: 0, min: 0, max: 10 },
            spaceComplexity: { type: Number, default: 0, min: 0, max: 10 },
            strengths: { type: [String], default: [] },
            weaknesses: { type: [String], default: [] },
            missingConcepts: { type: [String], default: [] },
            feedback: { type: String, default: "" },
            needsFollowUp: { type: Boolean, default: false },
            followUpReason: { type: String, default: "" },
            suggestedFollowupQuestion: { type: String, default: "" },
            followupPurpose: { type: String, default: "" }
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const MockInterviewResponse = mongoose.model("MockInterviewResponse", mockInterviewResponseSchema);

module.exports = {
    MockInterviewResponse
};
