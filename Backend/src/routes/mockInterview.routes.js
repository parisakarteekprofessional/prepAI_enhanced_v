const express = require("express");
const { authUser } = require("../middlewares/auth.middleware");
const controller = require("../controllers/mockInterview.controller");

const router = express.Router();

// Session lifecycle routes
router.post("/", authUser, controller.createSessionController);
router.post("/session", authUser, controller.createSessionController);

router.get("/history", authUser, controller.listUserSessionsController);
router.get("/", authUser, controller.listUserSessionsController);

router.get("/:sessionId", authUser, controller.getSessionStateController);
router.get("/session/:sessionId", authUser, controller.getSessionStateController);

router.post("/:sessionId/start", authUser, controller.startInterviewController);
router.post("/session/:sessionId/start", authUser, controller.startInterviewController);

router.get("/:sessionId/current", authUser, controller.getSessionStateController);

router.post("/:sessionId/answer", authUser, controller.submitAnswerController);
router.post("/session/:sessionId/answer", authUser, controller.submitAnswerController);

router.post("/:sessionId/next", authUser, controller.skipQuestionController);
router.post("/:sessionId/skip", authUser, controller.skipQuestionController);
router.post("/session/:sessionId/skip", authUser, controller.skipQuestionController);

router.post("/:sessionId/end", authUser, controller.endInterviewController);
router.post("/session/:sessionId/end", authUser, controller.endInterviewController);

router.get("/:sessionId/report", authUser, controller.getInterviewReportController);
router.get("/session/:sessionId/report", authUser, controller.getInterviewReportController);

router.delete("/:sessionId", authUser, controller.deleteSessionController);
router.delete("/session/:sessionId", authUser, controller.deleteSessionController);

module.exports = router;
