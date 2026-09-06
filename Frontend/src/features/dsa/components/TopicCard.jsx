import React from "react"
import { Link } from "react-router"
import ProgressBar from "./ProgressBar"

export default function TopicCard({ topic, stats }) {
    if (!topic) return null

    const { id, title, accent = "#54c6ff", questions = [] } = topic
    const total = questions.length
    const solved = stats?.solved || 0
    const easy = stats?.difficultyMap?.Easy?.solved || 0
    const medium = stats?.difficultyMap?.Medium?.solved || 0
    const hard = stats?.difficultyMap?.Hard?.solved || 0

    return (
        <div className="dsa-topic-card" style={{ "--topic-accent": accent }}>
            <div className="dsa-topic-card__header">
                <div className="dsa-topic-card__title-box">
                    <span className="dsa-topic-card__bar" />
                    <h3 className="dsa-topic-card__title">{title}</h3>
                </div>
                <span className="dsa-topic-card__count-badge">{total} Qs</span>
            </div>

            <div className="dsa-topic-card__progress">
                <div className="dsa-topic-card__progress-label">
                    <span>{solved} / {total} Solved</span>
                    <span>{total > 0 ? Math.round((solved / total) * 100) : 0}%</span>
                </div>
                <ProgressBar value={solved} max={total} showLabel={false} size="sm" />
            </div>

            <div className="dsa-topic-card__diffs">
                <span className="dsa-diff-tag dsa-diff-tag--easy">
                    E: {easy}/{stats?.difficultyMap?.Easy?.total || 0}
                </span>
                <span className="dsa-diff-tag dsa-diff-tag--medium">
                    M: {medium}/{stats?.difficultyMap?.Medium?.total || 0}
                </span>
                <span className="dsa-diff-tag dsa-diff-tag--hard">
                    H: {hard}/{stats?.difficultyMap?.Hard?.total || 0}
                </span>
            </div>

            <Link to={`/dsa/normal/${id}`} className="dsa-topic-card__action">
                <span>Practice Topic</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </Link>
        </div>
    )
}
