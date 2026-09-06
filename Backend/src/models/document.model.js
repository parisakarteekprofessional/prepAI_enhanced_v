const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    originalFileName: {
        type: String,
        required: true,
        trim: true
    },
    fileType: {
        type: String,
        enum: [ "pdf", "docx", "txt", "md" ],
        required: true,
        lowercase: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    pageCount: {
        type: Number,
        default: 1
    },
    chunkCount: {
        type: Number,
        default: 0
    },
    storagePath: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: [ "UPLOADING", "PROCESSING", "READY", "FAILED" ],
        default: "UPLOADING",
        index: true
    },
    errorMessage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
})

const documentModel = mongoose.model("Document", documentSchema)

module.exports = documentModel
