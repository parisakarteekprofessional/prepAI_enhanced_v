import React from "react"
import { Link } from "react-router"
import ProgressBar from "./ProgressBar"

export default function CompanyCard({ company, stats }) {
    if (!company) return null

    const { id, name, totalQuestions = 0, easy = 0, medium = 0, hard = 0, isPopular } = company
    const solved = stats?.solved || 0
    const pct = totalQuestions > 0 ? Math.round((solved / totalQuestions) * 100) : 0

    return (
        <div className={`dsa-company-card ${isPopular ? "dsa-company-card--popular" : ""}`}>
            <div className="dsa-company-card__header">
                <div>
                    <h3 className="dsa-company-card__name">{name}</h3>
                    <span className="dsa-company-card__total">{totalQuestions} Questions</span>
                </div>
                {isPopular && <span className="dsa-company-card__popular-badge">Top Target</span>}
            </div>

            <div className="dsa-company-card__diffs">
                <span className="dsa-diff-tag dsa-diff-tag--easy">Easy {easy}</span>
                <span className="dsa-diff-tag dsa-diff-tag--medium">Med {medium}</span>
                <span className="dsa-diff-tag dsa-diff-tag--hard">Hard {hard}</span>
            </div>

            <div className="dsa-company-card__progress">
                <div className="dsa-company-card__progress-label">
                    <span>{solved} / {totalQuestions} Solved</span>
                    <span>{pct}%</span>
                </div>
                <ProgressBar value={solved} max={totalQuestions} showLabel={false} size="sm" />
            </div>

            <Link to={`/dsa/company/${id}`} className="dsa-company-card__action">
                <span>Practice</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </Link>
        </div>
    )
}
