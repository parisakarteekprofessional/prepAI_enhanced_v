const { MockInterviewSession } = require("../../models/mockInterviewSession.model");
const { MockInterviewQuestion } = require("../../models/mockInterviewQuestion.model");
const { MockInterviewResponse } = require("../../models/mockInterviewResponse.model");
const interviewReportModel = require("../../models/interviewReport.model");
const { buildCandidateContext } = require("./candidateContext.service");
const { computeDeterministicScores } = require("./scoring.service");
const {
    evaluateAnswer,
    generateFinalDebrief
} = require("./mistralInterview.service");

const MAX_FOLLOWUPS_PER_QUESTION = 2;

/**
 * Creates a brand-new live interview session for an InterviewReport.
 * Pre-populates ALL questions directly and verbatim from report.technicalQuestions,
 * report.behavioralQuestions, and candidate's solved DSA history.
 */
async function createSession(userId, { interviewReportId, durationMinutes = 0 }) {
    if (!interviewReportId) {
        throw new Error("interviewReportId is required to start a live interview.");
    }

    // 1. Always remove any existing unfinished/in-progress sessions for this user
    // to guarantee the candidate starts with fresh questions matching the report
    const existingIncomplete = await MockInterviewSession.find({
        user: userId,
        status: { $in: ["CREATED", "READY", "IN_PROGRESS"] }
    });

    for (const oldSess of existingIncomplete) {
        await MockInterviewQuestion.deleteMany({ session: oldSess._id });
        await MockInterviewResponse.deleteMany({ session: oldSess._id });
        await MockInterviewSession.deleteOne({ _id: oldSess._id });
    }

    // 2. Build Candidate Context strictly from original report & solved DSA
    const candidateContext = await buildCandidateContext({ userId, interviewReportId });
    const report = candidateContext.report;

    const roleTitle = candidateContext.roleTitle || report.title || "Software Engineer";
    const stagePlan = candidateContext.dsaProblemsSelected.length > 0
        ? ["TECHNICAL", "BEHAVIORAL", "DSA", "FINAL"]
        : ["TECHNICAL", "BEHAVIORAL", "FINAL"];

    const session = new MockInterviewSession({
        user: userId,
        interviewReportId: candidateContext.interviewReportId,
        interviewPlan: candidateContext.interviewReportId,
        roleTitle,
        difficulty: "medium",
        interviewType: "FULL",
        durationMinutes: 0, // Untimed
        stagePlan,
        currentStage: "TECHNICAL",
        status: "CREATED",
        dsaQuestionCount: candidateContext.dsaProblemsSelected.length,
        dsaFollowupCount: 0,
        dsaProblemsSelected: candidateContext.dsaProblemsSelected,
        candidateContextSnapshot: {
            roleTitle,
            skills: candidateContext.skillGaps?.map((g) => g.skill) || [],
            skillGaps: candidateContext.skillGaps || [],
            dsaWeakTopics: candidateContext.dsaWeakTopics || [],
            solvedQuestionIds: [],
            previousMockScores: candidateContext.previousScores || []
        },
        remainingSeconds: 999999
    });

    await session.save();

    // 3. PRE-POPULATE ALL QUESTIONS EXACTLY AS IN THE INTERVIEW REPORT!
    let order = 1;
    let firstQuestionId = null;

    // Step A: All Technical questions verbatim from report.technicalQuestions
    if (report.technicalQuestions && Array.isArray(report.technicalQuestions)) {
        for (let i = 0; i < report.technicalQuestions.length; i++) {
            const tq = report.technicalQuestions[i];
            const q = new MockInterviewQuestion({
                session: session._id,
                questionIndex: i,
                order: order++,
                stage: "TECHNICAL",
                category: "TECHNICAL",
                source: "INTERVIEW_REPORT",
                sourceQuestionId: `technical-${i}`,
                difficulty: "medium",
                questionText: tq.question, // EXACT TEXT FROM REPORT
                expectedKeyPoints: [tq.intention, tq.answer].filter(Boolean),
                contextNote: `Technical Question ${i + 1} from Interview Report`
            });
            await q.save();
            if (!firstQuestionId) firstQuestionId = q._id;
        }
    }

    // Step B: All Behavioral questions verbatim from report.behavioralQuestions
    if (report.behavioralQuestions && Array.isArray(report.behavioralQuestions)) {
        for (let i = 0; i < report.behavioralQuestions.length; i++) {
            const bq = report.behavioralQuestions[i];
            const q = new MockInterviewQuestion({
                session: session._id,
                questionIndex: i,
                order: order++,
                stage: "BEHAVIORAL",
                category: "BEHAVIORAL",
                source: "INTERVIEW_REPORT",
                sourceQuestionId: `behavioral-${i}`,
                difficulty: "medium",
                questionText: bq.question, // EXACT TEXT FROM REPORT
                expectedKeyPoints: [bq.intention, bq.answer].filter(Boolean),
                contextNote: `Behavioral Question ${i + 1} from Interview Report`
            });
            await q.save();
            if (!firstQuestionId) firstQuestionId = q._id;
        }
    }

    // Step C: Solved DSA Questions from user's solved list
    if (candidateContext.dsaProblemsSelected && candidateContext.dsaProblemsSelected.length > 0) {
        for (let i = 0; i < candidateContext.dsaProblemsSelected.length; i++) {
            const dsa = candidateContext.dsaProblemsSelected[i];
            const q = new MockInterviewQuestion({
                session: session._id,
                questionIndex: i,
                order: order++,
                stage: "DSA",
                category: "DSA",
                source: "DSA_SOLVED",
                dsaProblemId: dsa.id,
                dsaProblemTitle: dsa.title,
                topic: dsa.topic,
                difficulty: dsa.difficulty,
                questionText: `In your DSA practice, you solved the problem "${dsa.title}". Could you walk me through your optimal algorithmic approach, the time and space complexity, and any key edge cases you handled?`,
                expectedKeyPoints: ["Optimal algorithmic approach", "Time complexity", "Space complexity", "Edge cases"],
                contextNote: `Sourced from candidate solved problem "${dsa.title}" (${dsa.topic})`
            });
            await q.save();
            if (!firstQuestionId) firstQuestionId = q._id;
        }
    }

    // Step D: Closing Question
    const closingQ = new MockInterviewQuestion({
        session: session._id,
        questionIndex: 0,
        order: order++,
        stage: "FINAL",
        category: "FINAL",
        source: "INTERVIEW_REPORT",
        difficulty: "easy",
        questionText: "Thank you for answering our technical, behavioral, and DSA questions. We have concluded the evaluation. Do you have any questions for me regarding the role, team dynamics, or engineering culture?",
        expectedKeyPoints: ["Thoughtful candidate questions", "Culture & impact interest"],
        contextNote: "Closing stage: candidate Q&A."
    });
    await closingQ.save();
    if (!firstQuestionId) firstQuestionId = closingQ._id;

    session.currentQuestion = firstQuestionId;
    session.totalQuestions = order - 1;
    await session.save();

    return session;
}

async function startInterview(sessionId, userId) {
    const session = await MockInterviewSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        throw new Error("Interview session not found.");
    }

    if (session.status === "COMPLETED") {
        return getSessionState(sessionId, userId);
    }

    if (session.status === "CREATED" || session.status === "READY") {
        session.status = "IN_PROGRESS";
        session.startedAt = new Date();
        session.currentStageIndex = 0;
        session.currentQuestionIndex = 0;

        // Ensure currentQuestion points to order 1
        if (!session.currentQuestion) {
            const firstQ = await MockInterviewQuestion.findOne({ session: session._id, order: 1 });
            if (firstQ) {
                session.currentQuestion = firstQ._id;
                session.currentStage = firstQ.stage;
            }
        }
        await session.save();
    }

    return getSessionState(sessionId, userId);
}

async function getSessionState(sessionId, userId) {
    const session = await MockInterviewSession.findOne({ _id: sessionId, user: userId })
        .populate("currentQuestion");

    if (!session) {
        throw new Error("Interview session not found.");
    }

    // Untimed session: calculate elapsed time
    if (session.status === "IN_PROGRESS" && session.startedAt) {
        const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        session.totalTimeSpentSeconds = elapsed;
        session.remainingSeconds = 999999;
        await session.save();
    }

    const responses = await MockInterviewResponse.find({ session: sessionId })
        .populate("question")
        .sort({ createdAt: 1 });

    const allQuestions = await MockInterviewQuestion.find({ session: sessionId, isFollowUp: false })
        .sort({ order: 1 });

    return {
        session,
        currentQuestion: session.currentQuestion,
        responses,
        allQuestions,
        totalQuestionsCount: allQuestions.length,
        isCompleted: session.status === "COMPLETED"
    };
}

async function submitAnswer(sessionId, userId, { transcript, audioDurationSeconds = 0 }) {
    const session = await MockInterviewSession.findOne({ _id: sessionId, user: userId })
        .populate("currentQuestion");

    if (!session) {
        throw new Error("Interview session not found.");
    }

    if (session.status === "COMPLETED") {
        return { isCompleted: true, session, interviewReportId: session.interviewReportId };
    }

    const currentQuestion = session.currentQuestion;
    if (!currentQuestion) {
        throw new Error("No active question to answer.");
    }

    // 1. Evaluate candidate answer using Mistral
    const evaluation = await evaluateAnswer({
        questionText: currentQuestion.questionText,
        category: currentQuestion.category,
        expectedPoints: currentQuestion.expectedKeyPoints,
        transcript: transcript || "",
        difficulty: currentQuestion.difficulty
    });

    // 2. Save Response record
    const responseRecord = new MockInterviewResponse({
        session: session._id,
        question: currentQuestion._id,
        transcript: transcript || "",
        audioDurationSeconds: Number(audioDurationSeconds) || 0,
        evaluation,
        submittedAt: new Date()
    });
    await responseRecord.save();

    // 3. Adaptive Follow-up Logic (Max 2 follow-ups per question, untimed)
    const canFollowup =
        evaluation.needsFollowUp &&
        currentQuestion.followupIndex < MAX_FOLLOWUPS_PER_QUESTION;

    if (canFollowup) {
        const nextFollowupIndex = currentQuestion.followupIndex + 1;
        const followupText = evaluation.suggestedFollowupQuestion || "Could you elaborate on the architectural trade-offs and complexity bounds of your approach in more detail?";

        const followupQuestion = new MockInterviewQuestion({
            session: session._id,
            questionIndex: session.currentQuestionIndex,
            order: currentQuestion.order,
            stage: currentQuestion.stage,
            category: currentQuestion.category,
            source: "FOLLOW_UP",
            parentQuestionId: currentQuestion.isFollowUp ? currentQuestion.parentQuestionId : currentQuestion._id,
            followupIndex: nextFollowupIndex,
            followupPurpose: evaluation.followupPurpose || "REASONING",
            isFollowUp: true,
            difficulty: currentQuestion.difficulty,
            questionText: followupText,
            expectedKeyPoints: evaluation.missingConcepts || ["Deeper justification", "Complexity bounds"],
            contextNote: `Follow-up on: ${evaluation.followUpReason || "probing depth"}`
        });

        await followupQuestion.save();
        session.currentQuestion = followupQuestion._id;
        if (currentQuestion.category === "DSA") {
            session.dsaFollowupCount += 1;
        }
        await session.save();

        return {
            evaluation,
            isFollowUp: true,
            nextQuestion: followupQuestion,
            isCompleted: false
        };
    }

    // 4. Advance to next planned question
    return await advanceToNextQuestion(session, userId);
}

async function advanceToNextQuestion(session, userId) {
    const currentQ = await MockInterviewQuestion.findById(session.currentQuestion);
    const currentOrder = currentQ ? currentQ.order : 0;

    // Find the next non-followup question by order
    const nextQuestion = await MockInterviewQuestion.findOne({
        session: session._id,
        order: { $gt: currentOrder },
        isFollowUp: false
    }).sort({ order: 1 });

    if (nextQuestion) {
        session.currentQuestion = nextQuestion._id;
        session.currentStage = nextQuestion.stage;
        session.currentQuestionIndex = nextQuestion.questionIndex;
        await session.save();

        return {
            isFollowUp: false,
            nextQuestion,
            isCompleted: false
        };
    }

    // All questions completed -> end interview
    return await endInterview(session._id, userId);
}

async function skipQuestion(sessionId, userId) {
    const session = await MockInterviewSession.findOne({ _id: sessionId, user: userId })
        .populate("currentQuestion");

    if (!session || session.status === "COMPLETED") {
        throw new Error("Invalid session.");
    }

    const currentQuestion = session.currentQuestion;
    if (currentQuestion) {
        const responseRecord = new MockInterviewResponse({
            session: session._id,
            question: currentQuestion._id,
            transcript: "[Candidate Skipped Question]",
            evaluation: {
                score: 2,
                correctness: 2,
                technicalDepth: 2,
                problemSolving: 2,
                communication: 4,
                strengths: [],
                weaknesses: ["Question was skipped"],
                missingConcepts: ["Core answer"],
                feedback: "Skipped question. Revisiting this topic is recommended."
            },
            submittedAt: new Date()
        });
        await responseRecord.save();
    }

    return await advanceToNextQuestion(session, userId);
}

async function endInterview(sessionId, userId) {
    const session = await MockInterviewSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        throw new Error("Interview session not found.");
    }

    if (session.status === "COMPLETED" && session.finalReport?.summary) {
        return { isCompleted: true, session, interviewReportId: session.interviewReportId };
    }

    session.status = "COMPLETED";
    session.currentStage = "COMPLETED";
    session.endedAt = new Date();

    if (session.startedAt) {
        session.totalTimeSpentSeconds = Math.floor(
            (session.endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000
        );
    }
    session.remainingSeconds = 0;

    // Fetch all responses to compute deterministic scores
    const responses = await MockInterviewResponse.find({ session: session._id })
        .populate("question");

    // 1. Calculate deterministic scores using exact formula
    const calculatedScores = computeDeterministicScores(responses);
    session.scores = calculatedScores;

    // 2. Generate qualitative debrief with Mistral
    const debrief = await generateFinalDebrief({
        session,
        responses,
        scores: calculatedScores
    });

    // 3. Actionable Next Steps
    const actionableSteps = [
        {
            label: "Practice Weak DSA Topics",
            link: "/dsa",
            type: "dsa"
        },
        {
            label: "Review Concepts in AI Study Room",
            link: "/study",
            type: "study"
        },
        {
            label: "Review Interview Plan",
            link: `/interview/${session.interviewReportId}`,
            type: "planner"
        }
    ];

    session.finalReport = {
        summary: debrief.summary,
        strengths: debrief.strengths,
        weaknesses: debrief.weaknesses,
        actionableSteps,
        hiringRecommendation: calculatedScores.hiringRecommendation
    };

    await session.save();

    // 4. Update the original InterviewReport document directly with the liveInterviewResult
    if (session.interviewReportId) {
        try {
            await interviewReportModel.findByIdAndUpdate(session.interviewReportId, {
                liveInterviewResult: {
                    sessionId: session._id,
                    overallScore: calculatedScores.overall,
                    scores: calculatedScores,
                    summary: debrief.summary,
                    strengths: debrief.strengths,
                    weaknesses: debrief.weaknesses,
                    actionableSteps,
                    completedAt: new Date(),
                    totalQuestionsAnswered: responses.length,
                    totalTimeSpentSeconds: session.totalTimeSpentSeconds || 0
                }
            });
        } catch (err) {
            console.error("Failed to update original interview report with live score:", err);
        }
    }

    return {
        isCompleted: true,
        session,
        interviewReportId: session.interviewReportId
    };
}

async function getInterviewReport(sessionId, userId) {
    const session = await MockInterviewSession.findOne({ _id: sessionId, user: userId })
        .populate("interviewReportId");

    if (!session) {
        throw new Error("Interview session not found.");
    }

    const responses = await MockInterviewResponse.find({ session: sessionId })
        .populate("question")
        .sort({ createdAt: 1 });

    const allQuestions = await MockInterviewQuestion.find({ session: sessionId })
        .sort({ order: 1 });

    return {
        session,
        responses,
        allQuestions
    };
}

async function listUserSessions(userId, interviewReportId = null) {
    const query = { user: userId };
    if (interviewReportId) {
        query.$or = [
            { interviewReportId: interviewReportId },
            { interviewPlan: interviewReportId }
        ];
    }
    return await MockInterviewSession.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .select("roleTitle targetCompany difficulty interviewType status scores finalReport createdAt endedAt durationMinutes totalTimeSpentSeconds interviewReportId");
}

async function deleteSession(sessionId, userId) {
    const session = await MockInterviewSession.findOne({ _id: sessionId, user: userId });
    if (!session) {
        throw new Error("Interview session not found.");
    }

    await MockInterviewQuestion.deleteMany({ session: sessionId });
    await MockInterviewResponse.deleteMany({ session: sessionId });
    await MockInterviewSession.deleteOne({ _id: sessionId });

    return { success: true };
}

module.exports = {
    createSession,
    startInterview,
    getSessionState,
    submitAnswer,
    skipQuestion,
    endInterview,
    getInterviewReport,
    listUserSessions,
    deleteSession
};
