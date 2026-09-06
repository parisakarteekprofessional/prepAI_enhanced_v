const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const studyUpload = require("../middlewares/studyUpload.middleware")
const studyController = require("../controllers/study.controller")

const studyRouter = express.Router()

// Document Library
studyRouter.post(
    "/documents",
    authMiddleware.authUser,
    studyUpload.single("document"),
    studyController.uploadDocumentController
)

studyRouter.get(
    "/documents",
    authMiddleware.authUser,
    studyController.getUserDocumentsController
)

studyRouter.get(
    "/recent-sessions",
    authMiddleware.authUser,
    studyController.getRecentSessionsController
)

studyRouter.get(
    "/documents/:documentId",
    authMiddleware.authUser,
    studyController.getDocumentByIdController
)

studyRouter.get(
    "/documents/:documentId/file",
    authMiddleware.authUser,
    studyController.getDocumentFileController
)

studyRouter.delete(
    "/documents/:documentId",
    authMiddleware.authUser,
    studyController.deleteDocumentController
)

// RAG Chat & Questions
studyRouter.post(
    "/documents/:documentId/chat",
    authMiddleware.authUser,
    studyController.chatController
)

// Chat Sessions & History
studyRouter.get(
    "/documents/:documentId/sessions",
    authMiddleware.authUser,
    studyController.getSessionsController
)

studyRouter.get(
    "/sessions/:sessionId/messages",
    authMiddleware.authUser,
    studyController.getSessionMessagesController
)

studyRouter.delete(
    "/sessions/:sessionId",
    authMiddleware.authUser,
    studyController.deleteSessionController
)

module.exports = studyRouter
