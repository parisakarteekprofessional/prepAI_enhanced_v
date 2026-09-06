import React from "react"
import { Link } from "react-router"
import DifficultyBadge from "./DifficultyBadge"
import StatusBadge from "./StatusBadge"

export default function ProblemRow({
    problem,
    index,
    status = "NOT_STARTED",
    onToggleStatus,
    showFrequency = false,
    showAcceptance = false,
    showCompanies = true
}) {
    if (!problem) return null

    const { id, title, difficulty = "Medium", companies = [], frequency, acceptanceRate, remarks } = problem

    const topCompanies = Array.isArray(companies) ? companies.slice(0, 3) : []
    const remainingCount = Array.isArray(companies) && companies.length > 3 ? companies.length - 3 : 0

    return (
        <tr className={`dsa-problem-row dsa-problem-row--${status.toLowerCase().replace('_', '-')}`}>
            <td className="dsa-problem-row__cell-index">{index}</td>

            <td className="dsa-problem-row__cell-title">
                <div className="dsa-problem-row__title-wrap">
                    <Link to={`/dsa/problem/${id}`} className="dsa-problem-row__link">
                        {title}
                    </Link>
                    {remarks && (
                        <span className="dsa-problem-row__remark" title={remarks}>
                            {remarks}
                        </span>
                    )}
                </div>
            </td>

            <td className="dsa-problem-row__cell-diff">
                <DifficultyBadge difficulty={difficulty} size="sm" />
            </td>

            {showFrequency && (
                <td className="dsa-problem-row__cell-freq">
                    {frequency !== undefined && frequency !== null ? (
                        <span className="dsa-freq-badge">{frequency}%</span>
                    ) : (
                        <span className="dsa-muted-dash">—</span>
                    )}
                </td>
            )}

            {showAcceptance && (
                <td className="dsa-problem-row__cell-acc">
                    {acceptanceRate !== undefined && acceptanceRate !== null ? (
                        <span className="dsa-acc-text">{acceptanceRate}%</span>
                    ) : (
                        <span className="dsa-muted-dash">—</span>
                    )}
                </td>
            )}

            {showCompanies && (
                <td className="dsa-problem-row__cell-comps">
                    <div className="dsa-problem-row__comps-list">
                        {topCompanies.map((c, i) => (
                            <span key={i} className="dsa-comp-tag">
                                {c}
                            </span>
                        ))}
                        {remainingCount > 0 && (
                            <span className="dsa-comp-tag dsa-comp-tag--more" title={companies.slice(3).join(', ')}>
                                +{remainingCount}
                            </span>
                        )}
                        {!topCompanies.length && <span className="dsa-muted-dash">—</span>}
                    </div>
                </td>
            )}

            <td className="dsa-problem-row__cell-status">
                <StatusBadge
                    status={status}
                    interactive={true}
                    onToggle={onToggleStatus}
                    size="sm"
                />
            </td>

            <td className="dsa-problem-row__cell-action">
                <Link to={`/dsa/problem/${id}`} className="dsa-problem-row__solve-btn">
                    <span>Solve</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </Link>
            </td>
        </tr>
    )
}
