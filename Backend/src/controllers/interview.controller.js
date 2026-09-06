const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const { selfDescription, jobDescription } = req.body

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

async function deleteInterviewReportController(req, res) {
    const { interviewId } = req.params

    try {
        const report = await interviewReportModel.findById(interviewId)

        if (!report) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        // Allow deletion if the user owns the report OR if the report has no assigned user (legacy report)
        if (report.user && req.user && req.user.id && report.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                message: "Unauthorized to delete this interview report."
            })
        }

        await interviewReportModel.findByIdAndDelete(interviewId)

        return res.status(200).json({
            message: "Interview report deleted successfully.",
            interviewReportId: interviewId
        })
    } catch (error) {
        console.error("Error deleting interview report:", error)
        return res.status(500).json({
            message: "Failed to delete interview report.",
            error: error.message
        })
    }
}

async function clearAllInterviewReportsController(req, res) {
    try {
        await interviewReportModel.deleteMany({
            $or: [
                { user: req.user.id },
                { user: null },
                { user: { $exists: false } }
            ]
        })

        return res.status(200).json({
            message: "All interview reports cleared successfully."
        })
    } catch (error) {
        console.error("Error clearing interview reports:", error)
        return res.status(500).json({
            message: "Failed to clear interview reports.",
            error: error.message
        })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    deleteInterviewReportController,
    clearAllInterviewReportsController
}