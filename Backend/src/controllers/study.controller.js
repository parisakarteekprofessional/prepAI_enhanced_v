const fs = require("fs")
const path = require("path")
const documentService = require("../services/study/document.service")
const chatService = require("../services/study/chat.service")
const ragService = require("../services/study/rag.service")

const ALLOWED_EXTENSIONS = [ "pdf", "docx", "txt", "md" ]

async function uploadDocumentController(req, res) {
    if (!req.file) {
        return res.status(400).json({
            message: "No document file was uploaded."
        })
    }

    const originalName = req.file.originalname || "document"
    const ext = path.extname(originalName).toLowerCase().replace(".", "")

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        // Clean up uploaded file
        if (req.file.path && fs.existsSync(req.file.path)) {
            try { await fs.promises.unlink(req.file.path) } catch {}
        }
        return res.status(400).json({
            message: `Unsupported file format: .${ext}. Supported types: PDF, DOCX, TXT, MD.`
        })
    }

    try {
        const doc = await documentService.createDocumentRecord({
            userId: req.user.id,
            originalFileName: originalName,
            fileType: ext,
            fileSize: req.file.size,
            storagePath: req.file.path
        })

        // Trigger asynchronous background ingestion
        documentService.processDocumentIngestion(doc._id).catch((err) => {
            console.error(`[Upload Controller] Background ingestion error for ${doc._id}:`, err.message)
        })

        return res.status(201).json({
            message: "Document uploaded successfully and indexing started.",
            document: {
                _id: doc._id,
                originalFileName: doc.originalFileName,
                fileType: doc.fileType,
                fileSize: doc.fileSize,
                pageCount: doc.pageCount,
                chunkCount: doc.chunkCount,
                status: doc.status,
                createdAt: doc.createdAt
            }
        })
    } catch (err) {
        console.error("[Upload Controller] Error creating document:", err)
        return res.status(500).json({
            message: "Failed to upload document: " + err.message
        })
    }
}

async function getUserDocumentsController(req, res) {
    try {
        const { search, fileType, status } = req.query
        const documents = await documentService.getUserDocuments({
            userId: req.user.id,
            search,
            fileType,
            status
        })

        return res.status(200).json({
            message: "Documents fetched successfully.",
            documents
        })
    } catch (err) {
        console.error("[Get Documents Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to fetch documents."
        })
    }
}

async function getDocumentByIdController(req, res) {
    try {
        const { documentId } = req.params
        const document = await documentService.getDocumentById({
            documentId,
            userId: req.user.id
        })

        if (!document) {
            return res.status(404).json({
                message: "Document not found or unauthorized."
            })
        }

        return res.status(200).json({
            message: "Document fetched successfully.",
            document: {
                _id: document._id,
                originalFileName: document.originalFileName,
                fileType: document.fileType,
                fileSize: document.fileSize,
                pageCount: document.pageCount,
                chunkCount: document.chunkCount,
                status: document.status,
                errorMessage: document.errorMessage,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt
            }
        })
    } catch (err) {
        console.error("[Get Document By ID Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to fetch document."
        })
    }
}

async function getDocumentFileController(req, res) {
    try {
        const { documentId } = req.params
        const document = await documentService.getDocumentById({
            documentId,
            userId: req.user.id
        })

        if (!document || !document.storagePath || !fs.existsSync(document.storagePath)) {
            return res.status(404).json({
                message: "Document file not found."
            })
        }

        const mimeTypes = {
            pdf: "application/pdf",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            txt: "text/plain",
            md: "text/markdown"
        }

        const contentType = mimeTypes[document.fileType] || "application/octet-stream"

        res.set({
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename="${encodeURIComponent(document.originalFileName)}"`
        })

        const stream = fs.createReadStream(document.storagePath)
        stream.pipe(res)
    } catch (err) {
        console.error("[Get Document File Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to serve document file."
        })
    }
}

async function deleteDocumentController(req, res) {
    try {
        const { documentId } = req.params
        const deleted = await documentService.deleteDocument({
            documentId,
            userId: req.user.id
        })

        if (!deleted) {
            return res.status(404).json({
                message: "Document not found or unauthorized."
            })
        }

        return res.status(200).json({
            message: "Document and all associated study sessions deleted successfully.",
            documentId
        })
    } catch (err) {
        console.error("[Delete Document Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to delete document: " + err.message
        })
    }
}

async function chatController(req, res) {
    try {
        const { documentId } = req.params
        const { question, sessionId } = req.body

        if (!question || !question.trim()) {
            return res.status(400).json({
                message: "Question cannot be empty."
            })
        }

        const result = await ragService.handleUserQuery({
            documentId,
            userId: req.user.id,
            sessionId,
            question
        })

        return res.status(200).json({
            message: "Response generated successfully.",
            ...result
        })
    } catch (err) {
        console.error("[Chat Controller] Error:", err)
        return res.status(500).json({
            message: err.message || "Failed to generate answer."
        })
    }
}

async function getSessionsController(req, res) {
    try {
        const { documentId } = req.params
        const sessions = await chatService.getUserSessions({
            documentId,
            userId: req.user.id
        })

        return res.status(200).json({
            message: "Sessions fetched successfully.",
            sessions
        })
    } catch (err) {
        console.error("[Get Sessions Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to fetch study sessions."
        })
    }
}

async function getSessionMessagesController(req, res) {
    try {
        const { sessionId } = req.params
        const messages = await chatService.getSessionMessages({
            sessionId,
            userId: req.user.id
        })

        return res.status(200).json({
            message: "Messages fetched successfully.",
            messages
        })
    } catch (err) {
        console.error("[Get Messages Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to fetch session messages."
        })
    }
}

async function deleteSessionController(req, res) {
    try {
        const { sessionId } = req.params
        const deleted = await chatService.deleteSession({
            sessionId,
            userId: req.user.id
        })

        if (!deleted) {
            return res.status(404).json({
                message: "Chat session not found or unauthorized."
            })
        }

        return res.status(200).json({
            message: "Chat session deleted successfully."
        })
    } catch (err) {
        console.error("[Delete Session Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to delete session."
        })
    }
}

async function getRecentSessionsController(req, res) {
    try {
        const sessions = await chatService.getRecentSessions({
            userId: req.user.id
        })

        return res.status(200).json({
            message: "Recent sessions fetched successfully.",
            sessions
        })
    } catch (err) {
        console.error("[Get Recent Sessions Controller] Error:", err)
        return res.status(500).json({
            message: "Failed to fetch recent sessions."
        })
    }
}

module.exports = {
    uploadDocumentController,
    getUserDocumentsController,
    getDocumentByIdController,
    getDocumentFileController,
    deleteDocumentController,
    chatController,
    getSessionsController,
    getSessionMessagesController,
    deleteSessionController,
    getRecentSessionsController
}
