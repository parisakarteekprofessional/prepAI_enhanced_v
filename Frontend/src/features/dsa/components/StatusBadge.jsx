import React from "react"

export default function StatusBadge({ status = "NOT_STARTED", onToggle, interactive = false, size = "normal" }) {
    const isSolved = status === "SOLVED"
    const isAttempted = status === "ATTEMPTED"

    let label = "Not Started"
    let statusClass = "not-started"

    if (isSolved) {
        label = "Solved"
        statusClass = "solved"
    } else if (isAttempted) {
        label = "In Progress"
        statusClass = "attempted"
    }

    const handleClick = (e) => {
        if (interactive && onToggle) {
            e.stopPropagation()
            onToggle()
        }
    }

    return (
        <button
            type="button"
            className={`dsa-status-badge dsa-status-badge--${statusClass} dsa-status-badge--${size} ${interactive ? "is-clickable" : ""}`}
            onClick={handleClick}
            title={interactive ? `Status: ${label}. Click to toggle.` : `Status: ${label}`}
            disabled={!interactive}
        >
            <span className="dsa-status-badge__icon">
                {isSolved ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : isAttempted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                    </svg>
                )}
            </span>
            <span className="dsa-status-badge__label">{label}</span>
        </button>
    )
}
