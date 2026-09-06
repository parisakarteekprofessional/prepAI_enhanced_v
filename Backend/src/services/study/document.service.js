const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const documentModel = require("../../models/document.model")
const chatSessionModel = require("../../models/chatSession.model")
const messageModel = require("../../models/message.model")
const chromaStore = require("./vector/chroma.store")

async function createDocumentRecord({ userId, originalFileName, fileType, fileSize, storagePath }) {
    const doc = await documentModel.create({
        userId,
        originalFileName,
        fileType: fileType.toLowerCase().replace(".", ""),
        fileSize,
        storagePath,
        status: "UPLOADING"
    })
    return doc
}

async function processDocumentIngestion(documentId) {
    const doc = await documentModel.findById(documentId)
    if (!doc) {
        throw new Error("Document not found.")
    }

    doc.status = "PROCESSING"
    doc.errorMessage = null
    await doc.save()

    try {
        const result = await chromaStore.ingestDocument({
            filePath: path.resolve(doc.storagePath),
            fileType: doc.fileType,
            documentId: doc._id.toString(),
            userId: doc.userId.toString(),
            originalFileName: doc.originalFileName
        })

        doc.status = "READY"
        doc.pageCount = result.pageCount || 1
        doc.chunkCount = result.chunkCount || 0
        doc.errorMessage = null
        await doc.save()

        return doc
    } catch (err) {
        console.error(`[Document Service] Ingestion failed for doc ${documentId}:`, err.message)
        doc.status = "FAILED"
        doc.errorMessage = err.message || "Failed to parse and index document."
        await doc.save()
        throw err
    }
}

async function getUserDocuments({ userId, search, fileType, status }) {
    const query = { userId }

    if (search && search.trim()) {
        query.originalFileName = { $regex: search.trim(), $options: "i" }
    }

    if (fileType && fileType !== "all") {
        query.fileType = fileType.toLowerCase().replace(".", "")
    }

    if (status && status !== "all") {
        query.status = status.toUpperCase()
    }

    const documents = await documentModel
        .find(query)
        .sort({ createdAt: -1 })
        .select("-storagePath")

    return documents
}

async function getDocumentById({ documentId, userId }) {
    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
        return null
    }

    const doc = await documentModel.findOne({
        _id: documentId,
        userId
    })
    return doc
}

async function deleteDocument({ documentId, userId }) {
    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
        return null
    }

    const doc = await documentModel.findOne({
        _id: documentId,
        userId
    })

    if (!doc) {
        return null
    }

    // 1. Delete vector embeddings from Chroma
    await chromaStore.deleteDocumentVectors({
        documentId: doc._id.toString(),
        userId: userId.toString()
    })

    // 2. Cascade delete messages and chat sessions
    const sessions = await chatSessionModel.find({ documentId: doc._id, userId }).select("_id")
    const sessionIds = sessions.map((s) => s._id)

    if (sessionIds.length > 0) {
        await messageModel.deleteMany({ sessionId: { $in: sessionIds } })
    }
    await chatSessionModel.deleteMany({ documentId: doc._id, userId })

    // 3. Remove physical file from disk
    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
        try {
            await fs.promises.unlink(doc.storagePath)
        } catch (fileErr) {
            console.warn(`[Document Service] Could not unlink file ${doc.storagePath}:`, fileErr.message)
        }
    }

    // 4. Delete document record
    await documentModel.findByIdAndDelete(doc._id)

    return doc
}

module.exports = {
    createDocumentRecord,
    processDocumentIngestion,
    getUserDocuments,
    getDocumentById,
    deleteDocument
}
