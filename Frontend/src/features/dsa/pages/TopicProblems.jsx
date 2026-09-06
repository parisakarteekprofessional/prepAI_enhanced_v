import React, { useState, useMemo } from "react"
import { useParams, Link, useNavigate } from "react-router"
import AppHeader from "../../interview/components/AppHeader"
import DsaNav from "../components/DsaNav"
import ProblemRow from "../components/ProblemRow"
import FilterBar from "../components/FilterBar"
import ProgressBar from "../components/ProgressBar"
import { normalSheet, getTopicById, canonicalProblems } from "../services/dsaData"
import { useDsa } from "../hooks/useDsa"
import "../style/sheet.scss"

export default function TopicProblems() {
    const { topicId } = useParams()
    const navigate = useNavigate()
    const { getStatus, toggleSolved, getTopicStats } = useDsa()

    const [search, setSearch] = useState("")
    const [difficulty, setDifficulty] = useState("All")
    const [statusFilter, setStatusFilter] = useState("All")

    const topic = useMemo(() => getTopicById(topicId), [topicId])
    const stats = useMemo(() => getTopicStats(topicId), [getTopicStats, topicId])

    // Hydrate questions with canonical metadata
    const topicQuestions = useMemo(() => {
        if (!topic) return []
        return topic.questions.map((q, idx) => {
            const canonical = canonicalProblems[q.id] || {}
            return {
                ...q,
                index: idx + 1,
                difficulty: canonical.difficulty || q.difficulty || "Medium",
                companies: canonical.companies || [],
                remarks: q.remarks || canonical.remarks || null,
                leetcodeUrl: canonical.leetcodeUrl || null
            }
        })
    }, [topic])

    const filteredQuestions = useMemo(() => {
        return topicQuestions.filter((q) => {
            const qStatus = getStatus(q.id)

            // Difficulty filter
            if (difficulty !== "All" && q.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
                return false
            }

            // Status filter
            if (statusFilter !== "All") {
                if (statusFilter === "SOLVED" && qStatus !== "SOLVED") return false
                if (statusFilter === "ATTEMPTED" && qStatus !== "ATTEMPTED") return false
                if (statusFilter === "NOT_STARTED" && qStatus !== "NOT_STARTED") return false
            }

            // Search filter
            if (search.trim()) {
                const query = search.trim().toLowerCase()
                const matchesTitle = q.title.toLowerCase().includes(query)
                const matchesComp = (q.companies || []).some((c) => c.toLowerCase().includes(query))
                const matchesRemark = (q.remarks || "").toLowerCase().includes(query)
                if (!matchesTitle && !matchesComp && !matchesRemark) return false
            }

            return true
        })
    }, [topicQuestions, difficulty, statusFilter, search, getStatus])

    if (!topic) {
        return (
            <div className="dsa-page">
                <AppHeader eyebrow="Workspace" title="DSA Practice" />
                <DsaNav />
                <main className="dsa-main">
                    <div className="dsa-empty-state">
                        <h2>Topic Not Found</h2>
                        <p>The requested topic could not be located in the Normal DSA Sheet.</p>
                        <Link to="/dsa/normal" className="dsa-btn-primary">
                            Return to Normal Sheet
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="dsa-page">
            <AppHeader eyebrow="Workspace" title="DSA Practice" />
            <DsaNav />

            <main className="dsa-main">
                {/* Topic Header */}
                <div className="dsa-topic-header" style={{ "--topic-accent": topic.accent || "#54c6ff" }}>
                    <div className="dsa-topic-header__top">
                        <div className="dsa-breadcrumbs">
                            <Link to="/dsa">DSA Practice</Link>
                            <span>/</span>
                            <Link to="/dsa/normal">Normal Sheet</Link>
                            <span>/</span>
                            <span>{topic.title}</span>
                        </div>

                        {/* Topic Switcher Dropdown */}
                        <div className="dsa-topic-switcher">
                            <label htmlFor="topic-select">Jump to Topic:</label>
                            <select
                                id="topic-select"
                                value={topic.id}
                                onChange={(e) => navigate(`/dsa/normal/${e.target.value}`)}
                                className="dsa-topic-select"
                            >
                                {normalSheet.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.title} ({t.questions.length} Qs)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="dsa-topic-header__main">
                        <div className="dsa-topic-header__title-row">
                            <span className="dsa-topic-header__indicator" />
                            <h1 className="dsa-topic-header__title">{topic.title}</h1>
                            <span className="dsa-topic-header__count">{topic.questions.length} Problems</span>
                        </div>

                        <div className="dsa-topic-header__stats">
                            <div className="dsa-topic-header__progress-wrap">
                                <div className="dsa-topic-header__progress-labels">
                                    <span>{stats.solved} of {stats.total} Solved</span>
                                    <span>{stats.rate}%</span>
                                </div>
                                <ProgressBar value={stats.solved} max={stats.total} showLabel={false} size="sm" />
                            </div>

                            <div className="dsa-topic-header__diff-pills">
                                <span className="dsa-diff-pill dsa-diff-pill--easy">
                                    Easy: {stats.difficultyMap?.Easy?.solved || 0}/{stats.difficultyMap?.Easy?.total || 0}
                                </span>
                                <span className="dsa-diff-pill dsa-diff-pill--medium">
                                    Med: {stats.difficultyMap?.Medium?.solved || 0}/{stats.difficultyMap?.Medium?.total || 0}
                                </span>
                                <span className="dsa-diff-pill dsa-diff-pill--hard">
                                    Hard: {stats.difficultyMap?.Hard?.solved || 0}/{stats.difficultyMap?.Hard?.total || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    search={search}
                    onSearchChange={setSearch}
                    selectedDifficulty={difficulty}
                    onDifficultyChange={setDifficulty}
                    selectedStatus={statusFilter}
                    onStatusChange={setStatusFilter}
                    totalCount={topicQuestions.length}
                    filteredCount={filteredQuestions.length}
                    placeholder={`Search within ${topic.title}...`}
                />

                {/* Dense Problem Table */}
                <div className="dsa-table-container">
                    <table className="dsa-table">
                        <thead>
                            <tr>
                                <th style={{ width: "48px" }}>#</th>
                                <th>Problem Title</th>
                                <th style={{ width: "110px" }}>Difficulty</th>
                                <th>Companies Asked</th>
                                <th style={{ width: "130px" }}>Status</th>
                                <th style={{ width: "90px", textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuestions.map((q) => (
                                <ProblemRow
                                    key={q.id}
                                    problem={q}
                                    index={q.index}
                                    status={getStatus(q.id)}
                                    onToggleStatus={() => toggleSolved(q.id)}
                                    showCompanies={true}
                                />
                            ))}
                        </tbody>
                    </table>

                    {filteredQuestions.length === 0 && (
                        <div className="dsa-empty-state">
                            <p>No questions match your filter criteria.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("")
                                    setDifficulty("All")
                                    setStatusFilter("All")
                                }}
                                className="dsa-btn-secondary"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
