import React from "react"

export default function ProgressBar({ value = 0, max = 100, showLabel = true, size = "md", labelPrefix = "" }) {
    const safeMax = max > 0 ? max : 1
    const percentage = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)))

    return (
        <div className={`dsa-progress-bar dsa-progress-bar--${size}`}>
            <div className="dsa-progress-bar__track">
                <div
                    className="dsa-progress-bar__fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className="dsa-progress-bar__meta">
                    {labelPrefix && <span className="dsa-progress-bar__prefix">{labelPrefix}</span>}
                    <span className="dsa-progress-bar__value">
                        {value} <span className="dsa-progress-bar__divider">/</span> {max}
                    </span>
                    <span className="dsa-progress-bar__pct">({percentage}%)</span>
                </div>
            )}
        </div>
    )
}
