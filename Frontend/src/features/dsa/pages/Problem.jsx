import React, { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate, Link } from "react-router"
import AppHeader from "../../interview/components/AppHeader"
import DsaNav from "../components/DsaNav"
import DifficultyBadge from "../components/DifficultyBadge"
import { getProblemById, getAdjacentProblems } from "../services/dsaData"
import { useDsa } from "../hooks/useDsa"
import "../style/problem.scss"

export default function Problem() {
    const { problemId } = useParams()
    const navigate = useNavigate()
    const { getStatus, setStatus, getNote, saveNote } = useDsa()

    const problem = useMemo(() => getProblemById(problemId), [problemId])
    const currentStatus = getStatus(problemId)

    const [noteText, setNoteText] = useState("")
    const [noteSaveStatus, setNoteSaveStatus] = useState("") // "saving", "saved", ""

    // Adjacent problems for Prev / Next
    const { prevId, nextId } = useMemo(() => {
        return getAdjacentProblems(problemId)
    }, [problemId])

    // Load existing note
    useEffect(() => {
        setNoteText(getNote(problemId))
        setNoteSaveStatus("")
    }, [problemId, getNote])

    const handleSaveNote = async () => {
        setNoteSaveStatus("saving")
        await saveNote(problemId, noteText)
        setNoteSaveStatus("saved")
        setTimeout(() => setNoteSaveStatus(""), 2500)
    }

    if (!problem) {
        return (
            <div className="dsa-page">
                <AppHeader eyebrow="Workspace" title="DSA Practice" />
                <DsaNav />
                <main className="dsa-main">
                    <div className="dsa-empty-state">
                        <h2>Problem Not Found</h2>
                        <p>The problem "{problemId}" could not be found in our database.</p>
                        <Link to="/dsa" className="dsa-btn-primary">
                            Return to DSA Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="dsa-page">
            <AppHeader eyebrow="Workspace" title="DSA Practice" />
            <DsaNav />

            <main className="dsa-main">
                {/* Top Navigation & Breadcrumbs */}
                <div className="dsa-problem-topbar">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="dsa-problem-back"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>Back</span>
                    </button>

                    <div className="dsa-breadcrumbs">
                        <Link to="/dsa">DSA Practice</Link>
                        <span>/</span>
                        <span>Problem Workspace</span>
                    </div>

                    <div className="dsa-problem-nav-actions">
                        {prevId && (
                            <Link to={`/dsa/problem/${prevId}`} className="dsa-prev-next-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                                <span>Previous</span>
                            </Link>
                        )}
                        {nextId && (
                            <Link to={`/dsa/problem/${nextId}`} className="dsa-prev-next-btn">
                                <span>Next</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Main Problem Workspace Card */}
                <div className="dsa-workspace-card">
                    {/* Header */}
                    <div className="dsa-workspace-header">
                        <div className="dsa-workspace-title-box">
                            <div className="dsa-workspace-title-row">
                                <h1 className="dsa-workspace-title">{problem.title}</h1>
                                <DifficultyBadge difficulty={problem.difficulty} size="normal" />
                            </div>

                            {/* Remarks / Hints */}
                            {problem.remarks && (
                                <div className="dsa-workspace-remark">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span>Tip: {problem.remarks}</span>
                                </div>
                            )}
                        </div>

                        {/* External link: secondary action */}
                        {problem.leetcodeUrl && (
                            <a
                                href={problem.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="dsa-leetcode-link"
                            >
                                <span>Open on LeetCode</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        )}
                    </div>

                    {/* Metadata Section */}
                    <div className="dsa-workspace-meta-grid">
                        {/* Topics */}
                        {problem.topics && problem.topics.length > 0 && (
                            <div className="dsa-meta-block">
                                <span className="dsa-meta-block__label">Topics & Patterns:</span>
                                <div className="dsa-meta-tags">
                                    {problem.topics.map((topic, i) => (
                                        <span key={i} className="dsa-topic-pill">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Acceptance Rate */}
                        {problem.acceptanceRate !== undefined && problem.acceptanceRate !== null && (
                            <div className="dsa-meta-block">
                                <span className="dsa-meta-block__label">Acceptance Rate:</span>
                                <span className="dsa-meta-rate">{problem.acceptanceRate}%</span>
                            </div>
                        )}

                        {/* Companies Asked */}
                        {problem.companies && problem.companies.length > 0 && (
                            <div className="dsa-meta-block dsa-meta-block--full">
                                <span className="dsa-meta-block__label">Also Asked By ({problem.companies.length} companies):</span>
                                <div className="dsa-meta-companies">
                                    {problem.companies.map((comp, i) => (
                                        <span key={i} className="dsa-company-tag">
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Workflow & Progress Controls */}
                    <div className="dsa-progress-section">
                        <div className="dsa-progress-section__header">
                            <div>
                                <span className="dsa-progress-section__eyebrow">YOUR WORKFLOW</span>
                                <h3>Update Problem Status</h3>
                            </div>
                            <span className="dsa-progress-section__state-label">
                                Current Status: <strong>{currentStatus.replace('_', ' ')}</strong>
                            </span>
                        </div>

                        <div className="dsa-status-buttons">
                            <button
                                type="button"
                                onClick={() => setStatus(problem.id, "NOT_STARTED")}
                                className={`dsa-status-choice-btn dsa-status-choice-btn--not-started ${currentStatus === "NOT_STARTED" ? "is-selected" : ""}`}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9" />
                                </svg>
                                <span>Not Started</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus(problem.id, "ATTEMPTED")}
                                className={`dsa-status-choice-btn dsa-status-choice-btn--attempted ${currentStatus === "ATTEMPTED" ? "is-selected" : ""}`}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Attempted</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setStatus(problem.id, "SOLVED")}
                                className={`dsa-status-choice-btn dsa-status-choice-btn--solved ${currentStatus === "SOLVED" ? "is-selected" : ""}`}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Solved</span>
                            </button>
                        </div>
                    </div>

                    {/* Personal Notes Section */}
                    <div className="dsa-notes-section">
                        <div className="dsa-notes-section__header">
                            <div>
                                <span className="dsa-notes-section__eyebrow">PERSONAL WORKSPACE</span>
                                <h3>Notes & Complexity Analysis</h3>
                            </div>
                            <span className="dsa-notes-section__hint">Save your approach, edge cases, time/space complexity</span>
                        </div>

                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Write your notes here... (e.g. Kadane's algorithm, time complexity O(N), space complexity O(1), watch out for all-negative inputs...)"
                            className="dsa-notes-textarea"
                            rows={6}
                        />

                        <div className="dsa-notes-footer">
                            <button
                                type="button"
                                onClick={handleSaveNote}
                                disabled={noteSaveStatus === "saving"}
                                className="dsa-btn-primary"
                            >
                                {noteSaveStatus === "saving" ? "Saving..." : "Save Notes"}
                            </button>

                            {noteSaveStatus === "saved" && (
                                <span className="dsa-notes-saved-indicator">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Notes saved successfully!
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bottom Workflow Action Bar */}
                    <div className="dsa-workspace-bottom-actions">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="dsa-btn-secondary"
                        >
                            ← Return to List
                        </button>

                        {nextId && (
                            <button
                                type="button"
                                onClick={() => navigate(`/dsa/problem/${nextId}`)}
                                className="dsa-btn-primary"
                            >
                                <span>Continue to Next Problem</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
