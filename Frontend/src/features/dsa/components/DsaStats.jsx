import React from "react"
import ProgressBar from "./ProgressBar"

export default function DsaStats({ stats, title = "YOUR PROGRESS", subtitle = "Overall DSA preparation tracker" }) {
    if (!stats) return null

    const { total = 0, solved = 0, attempted = 0, rate = 0, difficultyMap = {} } = stats

    const easy = difficultyMap.Easy || { solved: 0, total: 0 }
    const medium = difficultyMap.Medium || { solved: 0, total: 0 }
    const hard = difficultyMap.Hard || { solved: 0, total: 0 }

    return (
        <div className="dsa-stats-card">
            <div className="dsa-stats-card__header">
                <div>
                    <span className="dsa-stats-card__eyebrow">{title}</span>
                    <h3 className="dsa-stats-card__title">
                        {solved} <span className="dsa-stats-card__muted">/ {total} Problems Solved</span>
                    </h3>
                </div>
                <div className="dsa-stats-card__pct-badge">
                    <span>{rate}%</span>
                    <small>Completed</small>
                </div>
            </div>

            <ProgressBar value={solved} max={total} showLabel={false} size="lg" />

            <div className="dsa-stats-card__breakdown">
                <div className="dsa-stat-pill dsa-stat-pill--easy">
                    <span className="dsa-stat-pill__dot" />
                    <span className="dsa-stat-pill__label">Easy</span>
                    <strong className="dsa-stat-pill__value">
                        {easy.solved} <small>/ {easy.total}</small>
                    </strong>
                </div>

                <div className="dsa-stat-pill dsa-stat-pill--medium">
                    <span className="dsa-stat-pill__dot" />
                    <span className="dsa-stat-pill__label">Medium</span>
                    <strong className="dsa-stat-pill__value">
                        {medium.solved} <small>/ {medium.total}</small>
                    </strong>
                </div>

                <div className="dsa-stat-pill dsa-stat-pill--hard">
                    <span className="dsa-stat-pill__dot" />
                    <span className="dsa-stat-pill__label">Hard</span>
                    <strong className="dsa-stat-pill__value">
                        {hard.solved} <small>/ {hard.total}</small>
                    </strong>
                </div>

                {attempted > 0 && (
                    <div className="dsa-stat-pill dsa-stat-pill--attempted">
                        <span className="dsa-stat-pill__dot" />
                        <span className="dsa-stat-pill__label">In Progress</span>
                        <strong className="dsa-stat-pill__value">{attempted}</strong>
                    </div>
                )}
            </div>
        </div>
    )
}
