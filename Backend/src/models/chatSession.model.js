const mongoose = require("mongoose")

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
        index: true
    },
    title: {
        type: String,
        default: "Study Session",
        trim: true
    },
    lastQuestion: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
})

const chatSessionModel = mongoose.model("ChatSession", chatSessionSchema)

module.exports = chatSessionModel
