import React from "react"

export default function FilterBar({
    search = "",
    onSearchChange,
    selectedDifficulty = "All",
    onDifficultyChange,
    selectedStatus = "All",
    onStatusChange,
    totalCount = 0,
    filteredCount = 0,
    placeholder = "Search problems by title, company, or topic..."
}) {
    return (
        <div className="dsa-filter-bar">
            <div className="dsa-filter-bar__search">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="dsa-filter-bar__input"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => onSearchChange("")}
                        className="dsa-filter-bar__clear"
                        title="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>

            <div className="dsa-filter-bar__controls">
                {onDifficultyChange && (
                    <div className="dsa-filter-group">
                        <span className="dsa-filter-group__label">Difficulty:</span>
                        <div className="dsa-pill-group">
                            {["All", "Easy", "Medium", "Hard"].map((diff) => (
                                <button
                                    key={diff}
                                    type="button"
                                    onClick={() => onDifficultyChange(diff)}
                                    className={`dsa-pill-btn ${selectedDifficulty === diff ? "is-selected" : ""}`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {onStatusChange && (
                    <div className="dsa-filter-group">
                        <span className="dsa-filter-group__label">Status:</span>
                        <div className="dsa-pill-group">
                            {[
                                { key: "All", label: "All" },
                                { key: "SOLVED", label: "Solved" },
                                { key: "ATTEMPTED", label: "Attempted" },
                                { key: "NOT_STARTED", label: "Unsolved" }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => onStatusChange(key)}
                                    className={`dsa-pill-btn ${selectedStatus === key ? "is-selected" : ""}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <span className="dsa-filter-bar__count">
                    Showing <strong>{filteredCount}</strong> of {totalCount}
                </span>
            </div>
        </div>
    )
}
