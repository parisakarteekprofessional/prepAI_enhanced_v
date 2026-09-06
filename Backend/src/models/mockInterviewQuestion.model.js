const mongoose = require("mongoose");

const mockInterviewQuestionSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MockInterviewSession",
            required: true,
            index: true
        },
        questionIndex: {
            type: Number,
            required: true
        },
        order: {
            type: Number,
            default: 0
        },
        stage: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: [
                "INTRODUCTION",
                "TECHNICAL",
                "BEHAVIORAL",
                "DSA",
                "FINAL"
            ],
            default: "TECHNICAL"
        },
        source: {
            type: String,
            enum: ["INTERVIEW_REPORT", "DSA_SOLVED", "FOLLOW_UP"],
            default: "INTERVIEW_REPORT"
        },
        sourceQuestionId: {
            type: String,
            default: ""
        },
        dsaProblemId: {
            type: String,
            default: ""
        },
        dsaProblemTitle: {
            type: String,
            default: ""
        },
        topic: {
            type: String,
            default: ""
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard", "Easy", "Medium", "Hard"],
            default: "medium"
        },
        questionText: {
            type: String,
            required: true,
            trim: true
        },
        expectedKeyPoints: {
            type: [String],
            default: []
        },
        contextNote: {
            type: String,
            default: ""
        },
        isFollowUp: {
            type: Boolean,
            default: false
        },
        parentQuestionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MockInterviewQuestion",
            default: null
        },
        followupIndex: {
            type: Number,
            default: 0
        },
        followupPurpose: {
            type: String,
            default: ""
        },
        codeSnippet: {
            type: String,
            default: ""
        },
        askedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

const MockInterviewQuestion = mongoose.model("MockInterviewQuestion", mockInterviewQuestionSchema);

module.exports = {
    MockInterviewQuestion
};
