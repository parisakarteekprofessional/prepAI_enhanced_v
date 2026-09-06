const userModel = require("../models/user.model")
const { dsaSheet, flattenDsaQuestions } = require("../data/dsaSheet")

const allQuestions = flattenDsaQuestions()
const allQuestionIds = new Set(allQuestions.map((question) => question.id))

function buildTopicSummaries(solvedSet) {
    return dsaSheet.map((topic) => {
        const solvedCount = topic.questions.filter((question) => solvedSet.has(question.id)).length

        return {
            id: topic.id,
            title: topic.title,
            accent: topic.accent,
            totalQuestions: topic.questions.length,
            solvedCount,
            completionRate: Math.round((solvedCount / topic.questions.length) * 100),
            questions: topic.questions
        }
    })
}

function buildInsights(solvedSet) {
    const totalQuestions = allQuestions.length
    const solvedQuestions = allQuestions.filter((question) => solvedSet.has(question.id))
    const solvedCount = solvedQuestions.length
    const completionRate = totalQuestions === 0 ? 0 : Math.round((solvedCount / totalQuestions) * 100)

    const difficultyBreakdown = allQuestions.reduce((acc, question) => {
        if (!acc[question.difficulty]) {
            acc[question.difficulty] = { solved: 0, total: 0 }
        }

        acc[question.difficulty].total += 1
        if (solvedSet.has(question.id)) {
            acc[question.difficulty].solved += 1
        }

        return acc
    }, {})

    const strongestTopic = buildTopicSummaries(solvedSet)
        .filter((topic) => topic.solvedCount > 0)
        .sort((a, b) => b.completionRate - a.completionRate)[0] || null

    const nextRecommended = buildTopicSummaries(solvedSet)
        .filter((topic) => topic.solvedCount < topic.totalQuestions)
        .sort((a, b) => a.solvedCount - b.solvedCount)[0] || null

    return {
        totalQuestions,
        solvedCount,
        unsolvedCount: totalQuestions - solvedCount,
        completionRate,
        streakLabel: solvedCount === 0 ? "Start with 2 easy wins today" : `${Math.min(solvedCount, 7)} question momentum`,
        strongestTopic: strongestTopic ? strongestTopic.title : "No solved topic yet",
        recommendedTopic: nextRecommended ? nextRecommended.title : "Revision Time",
        difficultyBreakdown
    }
}

async function getDsaDashboardController(req, res) {
    const user = await userModel.findById(req.user.id).select("username email dsaProgress")
    const solvedSet = new Set(user?.dsaProgress?.solvedQuestionIds || [])

    res.status(200).json({
        message: "DSA dashboard fetched successfully",
        dashboard: {
            topics: buildTopicSummaries(solvedSet),
            insights: buildInsights(solvedSet),
            solvedQuestionIds: [ ...solvedSet ],
            lastSolvedAt: user?.dsaProgress?.lastSolvedAt || null
        }
    })
}

async function getDsaProgressController(req, res) {
    const user = await userModel.findById(req.user.id).select("dsaProgress")
    const dsa = user?.dsaProgress || {}
    const notesObj = {}
    if (dsa.notes) {
        if (dsa.notes instanceof Map) {
            for (const [k, v] of dsa.notes.entries()) {
                notesObj[k] = v
            }
        } else if (typeof dsa.notes === "object") {
            Object.assign(notesObj, dsa.notes)
        }
    }

    res.status(200).json({
        message: "DSA progress fetched successfully",
        progress: {
            solvedQuestionIds: dsa.solvedQuestionIds || [],
            attemptedQuestionIds: dsa.attemptedQuestionIds || [],
            notes: notesObj,
            lastSolvedAt: dsa.lastSolvedAt || null
        }
    })
}

async function updateDsaProgressController(req, res) {
    const { questionId, status, solved } = req.body

    if (!questionId) {
        return res.status(400).json({
            message: "questionId is required"
        })
    }

    let targetStatus = status
    if (!targetStatus && typeof solved === "boolean") {
        targetStatus = solved ? "SOLVED" : "NOT_STARTED"
    }

    if (!targetStatus || !["NOT_STARTED", "ATTEMPTED", "SOLVED"].includes(targetStatus)) {
        return res.status(400).json({
            message: "Valid status ('NOT_STARTED', 'ATTEMPTED', 'SOLVED') or solved boolean is required"
        })
    }

    let update = {}
    if (targetStatus === "SOLVED") {
        update = {
            $addToSet: { "dsaProgress.solvedQuestionIds": questionId },
            $pull: { "dsaProgress.attemptedQuestionIds": questionId },
            $set: { "dsaProgress.lastSolvedAt": new Date() }
        }
    } else if (targetStatus === "ATTEMPTED") {
        update = {
            $addToSet: { "dsaProgress.attemptedQuestionIds": questionId },
            $pull: { "dsaProgress.solvedQuestionIds": questionId }
        }
    } else {
        update = {
            $pull: {
                "dsaProgress.solvedQuestionIds": questionId,
                "dsaProgress.attemptedQuestionIds": questionId
            }
        }
    }

    const updatedUser = await userModel.findByIdAndUpdate(req.user.id, update, {
        returnDocument: "after",
        runValidators: true
    }).select("dsaProgress")

    const dsa = updatedUser?.dsaProgress || {}
    const notesObj = {}
    if (dsa.notes) {
        if (dsa.notes instanceof Map) {
            for (const [k, v] of dsa.notes.entries()) {
                notesObj[k] = v
            }
        } else if (typeof dsa.notes === "object") {
            Object.assign(notesObj, dsa.notes)
        }
    }

    return res.status(200).json({
        message: "DSA progress updated successfully",
        progress: {
            solvedQuestionIds: dsa.solvedQuestionIds || [],
            attemptedQuestionIds: dsa.attemptedQuestionIds || [],
            notes: notesObj,
            lastSolvedAt: dsa.lastSolvedAt || null
        }
    })
}

async function saveDsaNoteController(req, res) {
    const { questionId, note } = req.body

    if (!questionId) {
        return res.status(400).json({
            message: "questionId is required"
        })
    }

    const update = {
        $set: { [`dsaProgress.notes.${questionId}`]: note || "" }
    }

    await userModel.findByIdAndUpdate(req.user.id, update, {
        returnDocument: "after",
        runValidators: true
    })

    return res.status(200).json({
        message: "Note saved successfully",
        questionId,
        note: note || ""
    })
}

async function toggleQuestionSolvedController(req, res) {
    return updateDsaProgressController(req, res)
}

module.exports = {
    getDsaDashboardController,
    getDsaProgressController,
    updateDsaProgressController,
    saveDsaNoteController,
    toggleQuestionSolvedController
}
