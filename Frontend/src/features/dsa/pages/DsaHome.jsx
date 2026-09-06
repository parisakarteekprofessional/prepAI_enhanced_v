import React from "react"
import { Link, useNavigate } from "react-router"
import AppHeader from "../../interview/components/AppHeader"
import DsaNav from "../components/DsaNav"
import DsaStats from "../components/DsaStats"
import DifficultyBadge from "../components/DifficultyBadge"
import StatusBadge from "../components/StatusBadge"
import { useDsa } from "../hooks/useDsa"
import "../style/dsa.scss"

export default function DsaHome() {
    const {
        normalStats,
        overallStats,
        continueProblem,
        getStatus,
        setStatus,
        toggleSolved
    } = useDsa()

    const navigate = useNavigate()

    return (
        <div className="dsa-page">
            <AppHeader eyebrow="Workspace" title="DSA Practice" />
            <DsaNav />

            <main className="dsa-main">
                {/* Hero / Header */}
                <header className="dsa-hero-header">
                    <span className="dsa-eyebrow-tag">CODING WORKSPACE</span>
                    <h1 className="dsa-hero-header__title">
                        DSA <span className="highlight-blue">Practice</span>
                    </h1>
                    <p className="dsa-hero-header__subtitle">
                        Your coding preparation workspace. Master standard patterns or target specific dream companies.
                    </p>
                </header>

                {/* Two Major Primary Sections */}
                <div className="dsa-sheets-grid">
                    {/* 1. Normal DSA Sheet */}
                    <div className="dsa-sheet-card dsa-sheet-card--normal">
                        <div className="dsa-sheet-card__badge">TOPIC-WISE SYLLABUS</div>
                        <h2 className="dsa-sheet-card__title">NORMAL DSA SHEET</h2>
                        <p className="dsa-sheet-card__desc">
                            Curated 375 problems covering 16 fundamental computer science topics. Build algorithmic rigor from Arrays to DP and Segment Trees.
                        </p>

                        <div className="dsa-sheet-card__metrics">
                            <div className="dsa-metric-box">
                                <strong>375</strong>
                                <span>Problems</span>
                            </div>
                            <div className="dsa-metric-box">
                                <strong>16</strong>
                                <span>Topics</span>
                            </div>
                            <div className="dsa-metric-box">
                                <strong>{normalStats.solved}</strong>
                                <span>Solved ({normalStats.rate}%)</span>
                            </div>
                        </div>

                        <div className="dsa-sheet-card__footer">
                            <Link to="/dsa/normal" className="dsa-sheet-btn dsa-sheet-btn--primary">
                                <span>Practice Topics</span>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* 2. Company-Wise Sheet */}
                    <div className="dsa-sheet-card dsa-sheet-card--company">
                        <div className="dsa-sheet-card__badge">TARGET COMPANIES</div>
                        <h2 className="dsa-sheet-card__title">COMPANY-WISE QUESTIONS</h2>
                        <p className="dsa-sheet-card__desc">
                            LeetCode questions curated across 464 top tech employers. Focus on problems frequently asked by Amazon, Google, Microsoft, Meta, and more.
                        </p>

                        <div className="dsa-sheet-card__metrics">
                            <div className="dsa-metric-box">
                                <strong>464</strong>
                                <span>Companies</span>
                            </div>
                            <div className="dsa-metric-box">
                                <strong>7,715</strong>
                                <span>Records</span>
                            </div>
                            <div className="dsa-metric-box">
                                <strong>1,820</strong>
                                <span>Unique Qs</span>
                            </div>
                        </div>

                        <div className="dsa-sheet-card__footer">
                            <Link to="/dsa/company" className="dsa-sheet-btn dsa-sheet-btn--secondary">
                                <span>Explore Companies</span>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Progress Overview */}
                <section className="dsa-dashboard-section">
                    <DsaStats
                        stats={normalStats}
                        title="YOUR PROGRESS (NORMAL SHEET)"
                        subtitle="Progress across the 375 Apna College syllabus"
                    />
                </section>

                {/* Continue Practicing Section */}
                {continueProblem && (
                    <section className="dsa-dashboard-section">
                        <div className="dsa-continue-card">
                            <div className="dsa-continue-card__header">
                                <span className="dsa-continue-card__eyebrow">CONTINUE PRACTICING</span>
                                <span className="dsa-continue-card__hint">Recommended next question to solve</span>
                            </div>

                            <div className="dsa-continue-card__body">
                                <div className="dsa-continue-card__info">
                                    <div className="dsa-continue-card__title-row">
                                        <h3 className="dsa-continue-card__title">{continueProblem.title}</h3>
                                        <DifficultyBadge difficulty={continueProblem.difficulty} />
                                    </div>
                                    <div className="dsa-continue-card__meta">
                                        {continueProblem.topics && continueProblem.topics.length > 0 && (
                                            <span className="dsa-meta-tag">{continueProblem.topics[0]}</span>
                                        )}
                                        {continueProblem.companies && continueProblem.companies.length > 0 && (
                                            <span className="dsa-meta-tag dsa-meta-tag--company">
                                                Asked by {continueProblem.companies.slice(0, 2).join(", ")}
                                                {continueProblem.companies.length > 2 && ` +${continueProblem.companies.length - 2}`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="dsa-continue-card__actions">
                                    <StatusBadge
                                        status={continueProblem.status}
                                        interactive={true}
                                        onToggle={() => toggleSolved(continueProblem.id)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/dsa/problem/${continueProblem.id}`)}
                                        className="dsa-btn-primary"
                                    >
                                        <span>Resume Solving</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}
