import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import AppHeader from "../../interview/components/AppHeader";
import { useMockInterview } from "../hooks/useMockInterview";
import "../style/mockInterview.scss";

const MockInterviewReport = () => {
    const { sessionId } = useParams();
    const { fetchReport, session, responses, loading } = useMockInterview();
    const [openQuestionIndex, setOpenQuestionIndex] = useState(0);

    useEffect(() => {
        if (sessionId) {
            fetchReport(sessionId);
        }
    }, [sessionId, fetchReport]);

    const getRecBadgeClass = (rec) => {
        if (rec === "STRONG_HIRE") return "strong-hire";
        if (rec === "HIRE") return "hire";
        if (rec === "LEANING_HIRE") return "leaning-hire";
        if (rec === "LEANING_NO_HIRE") return "leaning-no-hire";
        return "no-hire";
    };

    const formatRecLabel = (rec) => {
        if (!rec) return "Pending";
        return rec.replace(/_/g, " ");
    };

    if (loading || !session) {
        return (
            <div className="mock-interview-page">
                <AppHeader eyebrow="Evaluation" title="Mock Interview Report" />
                <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
                    <h2>Compiling Deterministic Performance Report...</h2>
                    <p style={{ color: "#64748b" }}>Analyzing technical accuracy, DSA problem solving, and communication...</p>
                </div>
            </div>
        );
    }

    const scores = session.scores || { overall: 65, technical: 65, behavioral: 65, dsa: 65, problemSolving: 65, communication: 65 };
    const finalReport = session.finalReport || {};

    const getSourceBadge = (source) => {
        if (source === "DSA_SOLVED") return { label: "Previously Solved DSA", color: "#34d399" };
        if (source === "FOLLOW_UP") return { label: "AI Follow-up", color: "#f59e0b" };
        return { label: "From Interview Report", color: "#38bdf8" };
    };

    return (
        <div className="mock-interview-page">
            <AppHeader eyebrow="Evaluation Report" title={session.roleTitle || "Mock Interview Report"} />

            <div className="report-page-container">
                {/* 1. Hero Performance Card */}
                <div className="report-hero-card">
                    <div className="overall-score-dial">
                        <span className="dial-number">{scores.overall}</span>
                        <span className="dial-label">Overall</span>
                    </div>

                    <div>
                        <span className={`recommendation-badge ${getRecBadgeClass(finalReport.hiringRecommendation)}`}>
                            {formatRecLabel(finalReport.hiringRecommendation)}
                        </span>
                        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, margin: "0.5rem 0 0.25rem" }}>
                            {session.roleTitle} {session.targetCompany ? `at ${session.targetCompany}` : ""}
                        </h1>
                        <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
                            Conducted on {new Date(session.createdAt).toLocaleDateString()} &bull; Duration: {Math.round((session.totalTimeSpentSeconds || 900) / 60)} minutes
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        <Link to={`/mock-interview/live?reportId=${session.interviewReportId}`} className="btn-primary" style={{ textDecoration: "none", textAlign: "center" }}>
                            TAKE LIVE AI INTERVIEW
                        </Link>
                        {session.interviewReportId && (
                            <Link to={`/interview/${session.interviewReportId}`} className="btn-secondary" style={{ textDecoration: "none", textAlign: "center", fontSize: "0.85rem" }}>
                                View Original Report
                            </Link>
                        )}
                    </div>
                </div>

                {/* 2. Category Performance Overview */}
                <div className="report-category-grid">
                    <div className="category-card">
                        <span className="category-card__label">Technical Knowledge</span>
                        <span className="category-card__score">{scores.technical}%</span>
                        <div className="category-card__bar">
                            <div className="fill" style={{ width: `${scores.technical}%` }} />
                        </div>
                    </div>

                    <div className="category-card">
                        <span className="category-card__label">DSA & Algorithms</span>
                        <span className="category-card__score">{scores.dsa}%</span>
                        <div className="category-card__bar">
                            <div className="fill" style={{ width: `${scores.dsa}%` }} />
                        </div>
                    </div>

                    <div className="category-card">
                        <span className="category-card__label">Problem Solving</span>
                        <span className="category-card__score">{scores.problemSolving}%</span>
                        <div className="category-card__bar">
                            <div className="fill" style={{ width: `${scores.problemSolving}%` }} />
                        </div>
                    </div>

                    <div className="category-card">
                        <span className="category-card__label">Communication</span>
                        <span className="category-card__score">{scores.communication}%</span>
                        <div className="category-card__bar">
                            <div className="fill" style={{ width: `${scores.communication}%` }} />
                        </div>
                    </div>
                </div>

                {/* 3. Executive AI Summary */}
                <div style={{
                    background: "rgba(18, 23, 34, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "1.5rem"
                }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
                        Executive Debrief Summary
                    </h2>
                    <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: "0.95rem", margin: "0 0 1.25rem" }}>
                        {finalReport.summary || "The candidate provided structured answers across core categories."}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                        <div>
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#34d399", margin: "0 0 0.5rem" }}>
                                ✓ Key Strengths
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#94a3b8", fontSize: "0.88rem" }}>
                                {(finalReport.strengths || ["Structured answers"]).map((st, i) => (
                                    <li key={i} style={{ marginBottom: "0.25rem" }}>{st}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f87171", margin: "0 0 0.5rem" }}>
                                ⚠ Blind Spots & Improvements
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: "1.2rem", color: "#94a3b8", fontSize: "0.88rem" }}>
                                {(finalReport.weaknesses || ["Deepen trade-off analysis"]).map((w, i) => (
                                    <li key={i} style={{ marginBottom: "0.25rem" }}>{w}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 4. Actionable Next Steps Bridges */}
                <div className="actionable-bridges-card">
                    <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.25rem", color: "#f8fafc" }}>
                            Recommended Preparation
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
                            Target identified blind spots through focused DSA practice and study room notes.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <Link to="/dsa" className="btn-secondary" style={{ borderColor: "rgba(236, 72, 153, 0.4)", color: "#f472b6" }}>
                            Practice Weak DSA Topics →
                        </Link>
                        <Link to="/study" className="btn-secondary" style={{ borderColor: "rgba(56, 189, 248, 0.4)", color: "#38bdf8" }}>
                            Study Concepts in AI Study Room →
                        </Link>
                    </div>
                </div>

                {/* 5. Questions Asked Section */}
                <div>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 1rem" }}>
                        Questions Asked ({responses.length} questions recorded)
                    </h2>

                    {responses.map((r, i) => {
                        const isOpen = openQuestionIndex === i;
                        const ev = r.evaluation || {};
                        const src = getSourceBadge(r.question?.source);
                        const scoreVal = ev.score || ev.overallScore || 6;

                        return (
                            <div key={r._id || i} className="accordion-item">
                                <div
                                    className="accordion-item__header"
                                    onClick={() => setOpenQuestionIndex(isOpen ? null : i)}
                                >
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <span style={{ fontSize: "0.75rem", color: "#ec4899", fontWeight: 700, textTransform: "uppercase" }}>
                                                Q{i + 1} &bull; {r.question?.category || "Technical"}
                                            </span>
                                            <span style={{ fontSize: "0.7rem", color: src.color, background: "rgba(255, 255, 255, 0.05)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                                                {src.label}
                                            </span>
                                            {r.question?.dsaProblemTitle && (
                                                <span style={{ fontSize: "0.7rem", color: "#34d399" }}>
                                                    ({r.question.dsaProblemTitle})
                                                </span>
                                            )}
                                        </div>
                                        <h4 style={{ margin: "0.3rem 0 0", fontSize: "0.95rem", color: "#f1f5f9" }}>
                                            {r.question?.questionText || "Question text"}
                                        </h4>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: scoreVal >= 7 ? "#34d399" : "#fbbf24" }}>
                                            Score: {scoreVal}/10
                                        </span>
                                        <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "0.2s" }}>
                                            ▼
                                        </span>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="accordion-item__body">
                                        <div>
                                            <strong style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase" }}>
                                                Candidate Answer:
                                            </strong>
                                            <p style={{ margin: "0.3rem 0 0", color: "#cbd5e1", fontStyle: "italic", background: "rgba(0, 0, 0, 0.3)", padding: "0.75rem", borderRadius: "8px" }}>
                                                "{r.transcript || "No response recorded"}"
                                            </p>
                                        </div>

                                        <div>
                                            <strong style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase" }}>
                                                Evaluation:
                                            </strong>
                                            <p style={{ margin: "0.3rem 0 0", color: "#f1f5f9" }}>
                                                {ev.feedback || "Good response covering key technical aspects."}
                                            </p>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            {ev.strengths?.length > 0 && (
                                                <div>
                                                    <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>Strengths:</span>
                                                    <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#94a3b8" }}>
                                                        {ev.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {ev.weaknesses?.length > 0 && (
                                                <div>
                                                    <span style={{ fontSize: "0.75rem", color: "#f87171", fontWeight: 700 }}>Weaknesses:</span>
                                                    <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#94a3b8" }}>
                                                        {ev.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {ev.missingConcepts?.length > 0 && (
                                            <div>
                                                <span style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 700 }}>Missing Concepts:</span>
                                                <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#94a3b8" }}>
                                                    {ev.missingConcepts.map((m, idx) => <li key={idx}>{m}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MockInterviewReport;
