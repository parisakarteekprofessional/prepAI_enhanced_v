import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import AppHeader from "../../interview/components/AppHeader";
import { useMockInterview } from "../hooks/useMockInterview";
import { getAllInterviewReports } from "../../interview/services/interview.api";
import "../style/mockInterview.scss";

const MockInterviewHome = () => {
    const navigate = useNavigate();
    const { fetchHistory, deleteSession } = useMockInterview();
    const [history, setHistory] = useState([]);
    const [savedPlans, setSavedPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [hist, plans] = await Promise.all([
                    fetchHistory(),
                    getAllInterviewReports().catch(() => [])
                ]);
                setHistory(hist || []);
                setSavedPlans(Array.isArray(plans) ? plans : []);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [fetchHistory]);

    const handleDeleteHistory = async (e, sessionId) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to remove this mock interview record?")) {
            const ok = await deleteSession(sessionId);
            if (ok) {
                setHistory((prev) => prev.filter((s) => s._id !== sessionId));
            }
        }
    };

    const getRecBadgeClass = (rec) => {
        if (rec === "STRONG_HIRE") return "strong-hire";
        if (rec === "HIRE") return "hire";
        if (rec === "LEANING_HIRE") return "leaning-hire";
        if (rec === "LEANING_NO_HIRE") return "leaning-no-hire";
        return "no-hire";
    };

    const formatRecLabel = (rec) => {
        if (!rec || rec === "PENDING") return "Completed";
        return rec.replace(/_/g, " ");
    };

    return (
        <div className="mock-interview-page">
            <AppHeader eyebrow="Simulation Hub" title="AI Mock Interview" />

            <section className="mock-hero">
                <span className="mock-hero__eyebrow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    Face-to-Face Simulation
                </span>
                <h1>
                    Interactive <span className="highlight">Live AI Mock Interviews</span>
                </h1>
                <p>
                    Experience realistic, adaptive technical interviews anchored directly in your Interview Planner reports. Questions originate from your role assessment, paired with exactly two algorithmic problems from your solved DSA history.
                </p>
            </section>

            <main className="mock-dashboard-content">
                {/* 1. Start from Interview Reports */}
                <section className="dashboard-section">
                    <div className="dashboard-section__header">
                        <h2>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            Available Interview Reports
                        </h2>
                        <span className="badge-count">{savedPlans.length} reports</span>
                    </div>

                    {savedPlans.length === 0 ? (
                        <div className="plan-card" style={{ textAlign: "center", padding: "2.5rem" }}>
                            <p style={{ color: "#94a3b8", margin: "0 0 1rem" }}>
                                You don't have any generated interview reports yet. Start by generating an interview plan with your resume and target job description.
                            </p>
                            <Link to="/app" className="btn-primary" style={{ display: "inline-flex" }}>
                                Go to Interview Planner →
                            </Link>
                        </div>
                    ) : (
                        <div className="plan-cards-grid">
                            {savedPlans.map((plan) => (
                                <div key={plan._id} className="plan-card">
                                    <div className="plan-card__top">
                                        <h3>{plan.title || "Untitled Role"}</h3>
                                        <span className="recommendation-badge hire">Match {plan.matchScore || 85}%</span>
                                    </div>
                                    <p className="plan-card__meta">
                                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                                    </p>
                                    <div className="plan-card__footer">
                                        <Link
                                            to={`/mock-interview/live?reportId=${plan._id}`}
                                            className="btn-primary"
                                            style={{ textDecoration: "none", fontSize: "0.85rem", padding: "0.6rem 1rem" }}
                                        >
                                            Take Live AI Interview →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 2. Past Mock Interview Sessions */}
                <section className="dashboard-section">
                    <div className="dashboard-section__header">
                        <h2>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Completed Mock Interview Reports
                        </h2>
                        <span className="badge-count">{history.length} completed</span>
                    </div>

                    {loading ? (
                        <p style={{ color: "#64748b" }}>Loading completed sessions...</p>
                    ) : history.length === 0 ? (
                        <div className="plan-card" style={{ textAlign: "center", padding: "2.5rem" }}>
                            <p style={{ color: "#94a3b8", margin: "0" }}>
                                No live mock interviews completed yet. Choose an interview report above to take your first live session.
                            </p>
                        </div>
                    ) : (
                        <div className="history-cards-grid">
                            {history.map((sess) => (
                                <div
                                    key={sess._id}
                                    className="history-card"
                                    onClick={() => navigate(`/mock-interview/${sess._id}/report`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="history-card__top">
                                        <div>
                                            <h3>{sess.roleTitle || "Software Engineer"}</h3>
                                            {sess.targetCompany && (
                                                <p style={{ fontSize: "0.85rem", color: "#38bdf8", margin: "0.2rem 0 0" }}>
                                                    Target: {sess.targetCompany}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteHistory(e, sess._id)}
                                            style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}
                                            title="Delete session"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                    <p className="history-card__meta">
                                        Conducted on {new Date(sess.createdAt).toLocaleDateString()} &bull; Duration: {Math.round((sess.totalTimeSpentSeconds || 900) / 60)} mins
                                    </p>
                                    <div className="history-card__footer">
                                        <span className={`recommendation-badge ${getRecBadgeClass(sess.finalReport?.hiringRecommendation)}`}>
                                            {formatRecLabel(sess.finalReport?.hiringRecommendation)}
                                        </span>
                                        <span className="score-pill">
                                            Score: <strong>{sess.scores?.overall || 0}</strong>/100
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default MockInterviewHome;
