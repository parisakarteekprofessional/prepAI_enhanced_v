const mongoose = require("mongoose")

const sourceCitationSchema = new mongoose.Schema({
    pageNumber: {
        type: Number,
        default: 1
    },
    chunkIndex: {
        type: Number,
        default: 0
    },
    section: {
        type: String,
        default: ""
    },
    sourceFileName: {
        type: String,
        default: ""
    },
    previewText: {
        type: String,
        default: ""
    },
    similarity: {
        type: Number,
        default: 0
    }
}, {
    _id: false
})

const messageSchema = new mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatSession",
        required: true,
        index: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: [ "user", "assistant" ],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sources: [ sourceCitationSchema ]
}, {
    timestamps: true
})

const messageModel = mongoose.model("Message", messageSchema)

module.exports = messageModel
