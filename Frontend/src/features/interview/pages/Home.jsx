import React, { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'
import AppHeader from '../components/AppHeader.jsx'

const Home = () => {

    const { loading, generateReport, reports, deleteReport, clearAllReports } = useInterview()
    const safeReports = Array.isArray(reports) ? reports : []
    const [ isDeletingId, setIsDeletingId ] = useState(null)
    const [ showAllReports, setShowAllReports ] = useState(false)
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ resumeFileName, setResumeFileName ] = useState("")
    const [ formError, setFormError ] = useState("")
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async () => {
        const resumeFile = resumeInputRef.current.files[ 0 ]
        setFormError("")

        if (!jobDescription.trim()) {
            setFormError("Please paste the target job description.")
            return
        }

        if (!resumeFile) {
            setFormError("Please upload a PDF resume.")
            return
        }

        const data = await generateReport({ jobDescription, selfDescription, resumeFile })
        if (data?._id) {
            navigate(`/interview/${data._id}`)
        } else {
            setFormError("Could not generate the interview plan. Please make sure you are logged in and try again.")
        }
    }

    const handleDeleteReport = async (e, reportId) => {
        e.stopPropagation()
        if (window.confirm("Are you sure you want to remove this interview plan?")) {
            setIsDeletingId(reportId)
            try {
                await deleteReport(reportId)
            } catch (err) {
                alert("Failed to delete interview report. Please restart your backend server so the latest delete endpoints are active.")
            } finally {
                setIsDeletingId(null)
            }
        }
    }

    const handleClearAllReports = async () => {
        if (window.confirm("Are you sure you want to remove all previous interview plans? This action cannot be undone.")) {
            try {
                await clearAllReports()
            } catch (err) {
                alert("Failed to clear interview reports. Please restart your backend server so the latest delete endpoints are active.")
            }
        }
    }

    const displayedReports = showAllReports ? safeReports : safeReports.slice(0, 6)

    if (loading) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <div className='home-page'>
            <AppHeader eyebrow='Workspace' title='Interview Planner' />

            <header className='page-header page-header--interview'>
                <span className='page-header__eyebrow'>AI interview command center</span>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Analyze the role, map your strengths, and turn your resume into a focused interview strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            value={jobDescription}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            <label className='dropzone' htmlFor='resume'>
                                <span className='dropzone__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                </span>
                                <p className='dropzone__title'>{resumeFileName || "Click to upload"}</p>
                                <p className='dropzone__subtitle'>PDF only (Max 3MB)</p>
                                <input
                                    ref={resumeInputRef}
                                    hidden
                                    type='file'
                                    id='resume'
                                    name='resume'
                                    accept='application/pdf,.pdf'
                                    onChange={(e) => setResumeFileName(e.target.files[ 0 ]?.name || "")}
                                />
                            </label>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                value={selfDescription}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    {formError && <span className='footer-error'>{formError}</span>}
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {safeReports.length > 0 && (
                <section className='recent-reports'>
                    <div className='recent-reports__header'>
                        <div className='recent-reports__title-wrap'>
                            <h2>My Recent Interview Plans</h2>
                            <span className='reports-count-badge'>{safeReports.length}</span>
                        </div>
                        <div className='recent-reports__actions'>
                            {safeReports.length > 6 && (
                                <button
                                    type='button'
                                    className='reports-toggle-btn'
                                    onClick={() => setShowAllReports(prev => !prev)}
                                >
                                    {showAllReports ? "Show Less" : `Show All (${safeReports.length})`}
                                </button>
                            )}
                            <button
                                type='button'
                                className='reports-clear-btn'
                                onClick={handleClearAllReports}
                                title='Remove all previous interview plans'
                            >
                                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                    <polyline points='3 6 5 6 21 6' />
                                    <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                                </svg>
                                <span>Clear All</span>
                            </button>
                        </div>
                    </div>

                    <ul className='reports-list'>
                        {displayedReports.map(report => (
                            <li
                                key={report._id}
                                className={`report-item ${isDeletingId === report._id ? 'is-deleting' : ''}`}
                                onClick={() => navigate(`/interview/${report._id}`)}
                            >
                                <div className='report-item__top'>
                                    <h3 title={report.title || 'Untitled Position'}>
                                        {report.title || 'Untitled Position'}
                                    </h3>
                                    <button
                                        type='button'
                                        className='report-item__delete-btn'
                                        onClick={(e) => handleDeleteReport(e, report._id)}
                                        title='Delete this interview plan'
                                        aria-label='Delete this plan'
                                        disabled={isDeletingId === report._id}
                                    >
                                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <polyline points='3 6 5 6 21 6' />
                                            <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                                            <line x1='10' y1='11' x2='10' y2='17' />
                                            <line x1='14' y1='11' x2='14' y2='17' />
                                        </svg>
                                    </button>
                                </div>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <div className='report-item__bottom'>
                                    <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                        Match Score: {report.matchScore}%
                                    </p>
                                    <span className='report-item__view-hint'>View Plan →</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>
        </div>
    )
}

export default Home
