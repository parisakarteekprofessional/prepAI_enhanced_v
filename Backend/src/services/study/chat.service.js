const chatSessionModel = require("../../models/chatSession.model")
const messageModel = require("../../models/message.model")
const documentModel = require("../../models/document.model")

async function getOrCreateSession({ documentId, userId, sessionId, title }) {
    if (sessionId) {
        const session = await chatSessionModel.findOne({
            _id: sessionId,
            documentId,
            userId
        })
        if (session) {
            return session
        }
    }

    // Default title from document name if available
    let sessionTitle = title || "Study Session"
    if (!title) {
        const doc = await documentModel.findById(documentId).select("originalFileName")
        if (doc) {
            sessionTitle = `Notes: ${doc.originalFileName}`
        }
    }

    const newSession = await chatSessionModel.create({
        documentId,
        userId,
        title: sessionTitle
    })

    return newSession
}

async function getUserSessions({ documentId, userId }) {
    const sessions = await chatSessionModel
        .find({ documentId, userId })
        .sort({ updatedAt: -1 })
    return sessions
}

async function getSessionMessages({ sessionId, userId }) {
    const session = await chatSessionModel.findOne({ _id: sessionId, userId })
    if (!session) {
        throw new Error("Chat session not found or unauthorized.")
    }

    const messages = await messageModel
        .find({ sessionId, userId })
        .sort({ createdAt: 1 })

    return messages
}

async function deleteSession({ sessionId, userId }) {
    const session = await chatSessionModel.findOne({ _id: sessionId, userId })
    if (!session) {
        return null
    }

    await messageModel.deleteMany({ sessionId })
    await chatSessionModel.findByIdAndDelete(sessionId)
    return session
}

async function getRecentSessions({ userId, limit = 6 }) {
    const sessions = await chatSessionModel
        .find({ userId, lastQuestion: { $ne: "" } })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate("documentId", "originalFileName fileType pageCount status")

    // Filter out any sessions where document was deleted
    return sessions.filter((s) => s.documentId)
}

module.exports = {
    getOrCreateSession,
    getUserSessions,
    getSessionMessages,
    deleteSession,
    getRecentSessions
}
