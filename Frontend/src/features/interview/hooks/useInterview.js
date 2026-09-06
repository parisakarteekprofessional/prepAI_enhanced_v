import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, deleteInterviewReport, clearAllInterviewReports } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            console.log(error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            const nextReports = Array.isArray(response?.interviewReports) ? response.interviewReports : []
            setReports(nextReports)
            return nextReports
        } catch (error) {
            console.log(error)
            setReports([])
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    const deleteReport = async (interviewReportId) => {
        const previousReports = reports
        // Optimistic UI update: immediately remove from UI
        setReports((prev) => (Array.isArray(prev) ? prev.filter((r) => r._id !== interviewReportId) : []))
        if (report?._id === interviewReportId) {
            setReport(null)
        }

        try {
            await deleteInterviewReport(interviewReportId)
            return true
        } catch (error) {
            console.error("Failed to delete interview report:", error)
            // Rollback optimistic update
            setReports(previousReports)
            throw error
        }
    }

    const clearAllReports = async () => {
        const previousReports = reports
        // Optimistic UI update: immediately clear from UI
        setReports([])
        if (report) {
            setReport(null)
        }

        try {
            await clearAllInterviewReports()
            return true
        } catch (error) {
            console.error("Failed to clear interview reports:", error)
            // Rollback optimistic update
            setReports(previousReports)
            throw error
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, deleteReport, clearAllReports }

}
