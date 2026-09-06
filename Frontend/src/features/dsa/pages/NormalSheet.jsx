import React, { useState, useMemo } from "react"
import { Link } from "react-router"
import AppHeader from "../../interview/components/AppHeader"
import DsaNav from "../components/DsaNav"
import TopicCard from "../components/TopicCard"
import DsaStats from "../components/DsaStats"
import { normalSheet } from "../services/dsaData"
import { useDsa } from "../hooks/useDsa"
import "../style/sheet.scss"

export default function NormalSheet() {
    const [searchTerm, setSearchTerm] = useState("")
    const { normalStats, getTopicStats } = useDsa()

    const filteredTopics = useMemo(() => {
        const query = searchTerm.trim().toLowerCase()
        if (!query) return normalSheet

        return normalSheet.filter((topic) => {
            return (
                topic.title.toLowerCase().includes(query) ||
                topic.questions.some((q) => q.title.toLowerCase().includes(query))
            )
        })
    }, [searchTerm])

    return (
        <div className="dsa-page">
            <AppHeader eyebrow="Workspace" title="DSA Practice" />
            <DsaNav />

            <main className="dsa-main">
                {/* Header & Overview */}
                <div className="dsa-sheet-header">
                    <div>
                        <div className="dsa-breadcrumbs">
                            <Link to="/dsa">DSA Practice</Link>
                            <span>/</span>
                            <span>Normal Sheet</span>
                        </div>
                        <h1 className="dsa-sheet-header__title">Normal DSA Sheet</h1>
                        <p className="dsa-sheet-header__subtitle">
                            375 essential algorithmic interview questions categorized across 16 foundational topics.
                        </p>
                    </div>

                    <div className="dsa-sheet-header__search">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Filter topics or questions..."
                            className="dsa-sheet-header__input"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="dsa-sheet-header__clear"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Card */}
                <DsaStats
                    stats={normalStats}
                    title="NORMAL SHEET PROGRESS"
                    subtitle="375 questions syllabus"
                />

                {/* Topics Grid */}
                <div className="dsa-topics-section">
                    <div className="dsa-section-header">
                        <h2>Topics ({filteredTopics.length} of 16)</h2>
                        <span className="dsa-section-header__hint">Select a topic to start solving</span>
                    </div>

                    <div className="dsa-topics-grid">
                        {filteredTopics.map((topic) => {
                            const topicStats = getTopicStats(topic.id)
                            return (
                                <TopicCard
                                    key={topic.id}
                                    topic={topic}
                                    stats={topicStats}
                                />
                            )
                        })}
                    </div>

                    {filteredTopics.length === 0 && (
                        <div className="dsa-empty-state">
                            <p>No topics or questions match "{searchTerm}".</p>
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="dsa-btn-secondary"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
