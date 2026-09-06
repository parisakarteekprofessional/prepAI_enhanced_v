const engine = require("../services/mockInterview/interviewEngine.service");

async function createSessionController(req, res) {
    try {
        const userId = req.user.id;
        const {
            roleTitle,
            targetCompany,
            difficulty,
            interviewType,
            durationMinutes,
            interviewPlanId,
            interviewReportId,
            reportId
        } = req.body;

        const targetReportId = interviewReportId || reportId || interviewPlanId;

        const session = await engine.createSession(userId, {
            interviewReportId: targetReportId,
            roleTitle,
            targetCompany,
            difficulty,
            interviewType,
            durationMinutes: Number(durationMinutes) || 15
        });

        return res.status(201).json({
            message: "Interview session created successfully",
            session
        });
    } catch (err) {
        console.error("[MockInterview] createSession error:", err);
        return res.status(500).json({
            message: err.message || "Failed to create mock interview session"
        });
    }
}

async function startInterviewController(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const state = await engine.startInterview(sessionId, userId);
        return res.status(200).json({
            message: "Interview started successfully",
            ...state
        });
    } catch (err) {
        console.error("[MockInterview] startInterview error:", err);
        return res.status(500).json({
            message: err.message || "Failed to start interview"
        });
    }
}

async function getSessionStateController(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const state = await engine.getSessionState(sessionId, userId);
        return res.status(200).json({
            message: "Session state retrieved",
            ...state
        });
    } catch (err) {
        console.error("[MockInterview] getSessionState error:", err);
        return res.status(500).json({
            message: err.message || "Failed to retrieve session state"
        });
    }
}

async function submitAnswerController(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;
        const { transcript, audioDurationSeconds } = req.body;

        const result = await engine.submitAnswer(sessionId, userId, {
            transcript: transcript || "",
            audioDurationSeconds: Number(audioDurationSeconds) || 0
        });

        return res.status(200).json({
            message: "Answer submitted and evaluated",
            ...result
        });
    } catch (err) {
        console.error("[MockInterview] submitAnswer error:", err);
        return res.status(500).json({
            message: err.message || "Failed to submit answer"
        });
    }
}

async function skipQuestionController(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const result = await engine.skipQuestion(sessionId, userId);
        return res.status(200).json({
            message: "Question skipped",
            ...result
        });
    } catch (err) {
        console.error("[MockInterview] skipQuestion error:", err);
        return res.status(500).json({
            message: err.message || "Failed to skip question"
        });
    }
}

async function endInterviewController(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const result = await engine.endInterview(sessionId, userId);
        return res.status(200).json({
            message: "Interview ended successfully",
            ...result
        });
    } catch (err) {
        console.error("[MockInterview] endInterview error:", err);
        return res.status(500).json({
            message: err.message || "Failed to end interview"
        });
    }
}

async function getInterviewReportController(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const result = await engine.getInterviewReport(sessionId, userId);
        return res.status(200).json({
            message: "Interview report fetched",
            ...result
        });
    } catch (err) {
        console.error("[MockInterview] getInterviewReport error:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch interview report"
        });
    }
}

async function listUserSessionsController(req, res) {
    try {
        const userId = req.user.id;
        const reportId = req.query.reportId || req.query.interviewReportId || null;
        const sessions = await engine.listUserSessions(userId, reportId);

        return res.status(200).json({
            message: "User sessions fetched",
            sessions
        });
    } catch (err) {
        console.error("[MockInterview] listUserSessions error:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch interview sessions"
        });
    }
}

async function deleteSessionController(req, res) {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        await engine.deleteSession(sessionId, userId);
        return res.status(200).json({
            message: "Interview session deleted successfully"
        });
    } catch (err) {
        console.error("[MockInterview] deleteSession error:", err);
        return res.status(500).json({
            message: err.message || "Failed to delete interview session"
        });
    }
}

module.exports = {
    createSessionController,
    startInterviewController,
    getSessionStateController,
    submitAnswerController,
    skipQuestionController,
    endInterviewController,
    getInterviewReportController,
    listUserSessionsController,
    deleteSessionController
};
