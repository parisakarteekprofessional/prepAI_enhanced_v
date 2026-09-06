const userModel = require("../../models/user.model");
const interviewReportModel = require("../../models/interviewReport.model");
const { MockInterviewSession } = require("../../models/mockInterviewSession.model");
const { dsaSheet, flattenDsaQuestions } = require("../../data/dsaSheet");

const DSA_QUESTION_LIMIT = 2;

async function buildCandidateContext({ userId, interviewReportId }) {
    if (!interviewReportId) {
        throw new Error("interviewReportId is required to start a live interview.");
    }

    // 1. Retrieve User
    const user = await userModel.findById(userId).select("username email dsaProgress");
    if (!user) {
        throw new Error("User not found.");
    }

    // 2. Retrieve Original Interview Report
    const report = await interviewReportModel.findById(interviewReportId);
    if (!report) {
        throw new Error("Interview report not found.");
    }

    // 3. Authorization Check: Report must belong to authenticated user
    if (report.user && report.user.toString() !== userId.toString()) {
        throw new Error("Unauthorized: You do not have permission to access this report.");
    }

    // 4. Eligibility Check
    if (report.status && report.status !== "COMPLETED") {
        throw new Error("This interview report is still generating or incomplete.");
    }

    if (report.eligibleForLiveInterview === false) {
        throw new Error("This interview report is not eligible for a live AI interview.");
    }

    const solvedSet = new Set(user.dsaProgress?.solvedQuestionIds || []);
    const allQuestions = flattenDsaQuestions();

    // Map questions by ID for fast lookup
    const questionsMap = new Map();
    for (const q of allQuestions) {
        questionsMap.set(q.id, q);
    }

    // 5. Analyze DSA Topics for Weakness
    const topicAnalysis = dsaSheet.map((topic) => {
        const topicTotal = topic.questions.length;
        const topicSolved = topic.questions.filter((q) => solvedSet.has(q.id)).length;
        const completionRate = topicTotal > 0 ? Math.round((topicSolved / topicTotal) * 100) : 0;
        return {
            id: topic.id,
            title: topic.title,
            completionRate,
            solvedCount: topicSolved,
            totalCount: topicTotal
        };
    });

    // Find weak topics (completion < 50%)
    const weakTopics = topicAnalysis
        .filter((t) => t.completionRate < 50)
        .sort((a, b) => a.completionRate - b.completionRate);

    const dsaWeakTopicTitles = weakTopics.map((t) => t.title);

    // 6. Select EXACTLY TWO solved DSA problems
    // Rule: Must come exclusively from user.dsaProgress.solvedQuestionIds
    const solvedQuestionsList = [];
    for (const qId of solvedSet) {
        const detail = questionsMap.get(qId);
        if (detail) {
            solvedQuestionsList.push({
                id: detail.id,
                title: detail.title,
                topic: detail.topic || "Data Structures",
                difficulty: detail.difficulty || "Medium"
            });
        }
    }

    // Prioritize solved problems from weak topics first
    const selectedDsaProblems = [];
    for (const weakTopic of dsaWeakTopicTitles) {
        const match = solvedQuestionsList.find(
            (p) => p.topic.toLowerCase() === weakTopic.toLowerCase() && !selectedDsaProblems.some((s) => s.id === p.id)
        );
        if (match) {
            selectedDsaProblems.push(match);
            if (selectedDsaProblems.length >= DSA_QUESTION_LIMIT) break;
        }
    }

    // Fill remainder from other solved problems
    for (const p of solvedQuestionsList) {
        if (selectedDsaProblems.length >= DSA_QUESTION_LIMIT) break;
        if (!selectedDsaProblems.some((s) => s.id === p.id)) {
            selectedDsaProblems.push(p);
        }
    }

    // 7. Pull past mock interview performance
    const pastSessions = await MockInterviewSession.find({
        user: userId,
        status: "COMPLETED"
    })
        .sort({ createdAt: -1 })
        .limit(3)
        .select("scores finalReport roleTitle createdAt");

    const previousScores = pastSessions.map((s) => s.scores?.overall || 0);

    return {
        userId,
        interviewReportId: report._id,
        roleTitle: report.title || "Software Engineer",
        targetCompany: "",
        jobDescription: report.jobDescription || "",
        matchScore: report.matchScore || 75,
        skillGaps: report.skillGaps || [],
        technicalQuestions: report.technicalQuestions || [],
        behavioralQuestions: report.behavioralQuestions || [],
        dsaProblemsSelected: selectedDsaProblems,
        dsaWeakTopics: dsaWeakTopicTitles,
        hasSufficientDsa: selectedDsaProblems.length >= DSA_QUESTION_LIMIT,
        dsaSolvedCount: solvedQuestionsList.length,
        previousScores,
        report
    };
}

module.exports = {
    buildCandidateContext,
    DSA_QUESTION_LIMIT
};
