import React from "react"

export default function DifficultyBadge({ difficulty = "Medium", size = "normal" }) {
    const diff = (difficulty || "Medium").toLowerCase()
    const label = difficulty || "Medium"

    return (
        <span className={`dsa-badge dsa-badge--${diff} dsa-badge--${size}`}>
            {label}
        </span>
    )
}
