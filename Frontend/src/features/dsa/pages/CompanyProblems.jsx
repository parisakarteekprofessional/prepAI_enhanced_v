import React, { useState, useMemo } from "react"
import { useParams, Link } from "react-router"
import AppHeader from "../../interview/components/AppHeader"
import DsaNav from "../components/DsaNav"
import ProblemRow from "../components/ProblemRow"
import FilterBar from "../components/FilterBar"
import ProgressBar from "../components/ProgressBar"
import { getCompanyById, getCompanyProblems } from "../services/dsaData"
import { useDsa } from "../hooks/useDsa"
import "../style/sheet.scss"

export default function CompanyProblems() {
    const { companyId } = useParams()
    const { getStatus, toggleSolved, getCompanyStats } = useDsa()

    const [search, setSearch] = useState("")
    const [difficulty, setDifficulty] = useState("All")
    const [statusFilter, setStatusFilter] = useState("All")

    const company = useMemo(() => getCompanyById(companyId), [companyId])
    const problems = useMemo(() => getCompanyProblems(companyId), [companyId])
    const stats = useMemo(() => getCompanyStats(companyId), [getCompanyStats, companyId])

    const filteredProblems = useMemo(() => {
        return problems.filter((p) => {
            const pStatus = getStatus(p.id)

            // Difficulty
            if (difficulty !== "All" && p.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
                return false
            }

            // Status
            if (statusFilter !== "All") {
                if (statusFilter === "SOLVED" && pStatus !== "SOLVED") return false
                if (statusFilter === "ATTEMPTED" && pStatus !== "ATTEMPTED") return false
                if (statusFilter === "NOT_STARTED" && pStatus !== "NOT_STARTED") return false
            }

            // Search
            if (search.trim()) {
                const query = search.trim().toLowerCase()
                const matchesTitle = p.title.toLowerCase().includes(query)
                const matchesTopics = (p.topics || []).some((t) => t.toLowerCase().includes(query))
                if (!matchesTitle && !matchesTopics) return false
            }

            return true
        })
    }, [problems, difficulty, statusFilter, search, getStatus])

    if (!company) {
        return (
            <div className="dsa-page">
                <AppHeader eyebrow="Workspace" title="DSA Practice" />
                <DsaNav />
                <main className="dsa-main">
                    <div className="dsa-empty-state">
                        <h2>Company Not Found</h2>
                        <p>The company you are looking for does not exist in the dataset.</p>
                        <Link to="/dsa/company" className="dsa-btn-primary">
                            Browse Companies
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
                {/* Company Header */}
                <div className="dsa-company-header">
                    <div className="dsa-company-header__top">
                        <div className="dsa-breadcrumbs">
                            <Link to="/dsa">DSA Practice</Link>
                            <span>/</span>
                            <Link to="/dsa/company">Company-Wise</Link>
                            <span>/</span>
                            <span>{company.name}</span>
                        </div>

                        <Link to="/dsa/company" className="dsa-back-link">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span>All Companies</span>
                        </Link>
                    </div>

                    <div className="dsa-company-header__main">
                        <div className="dsa-company-header__title-row">
                            <h1 className="dsa-company-header__title">{company.name.toUpperCase()}</h1>
                            <span className="dsa-company-header__count">{company.totalQuestions} Questions</span>
                            {company.isPopular && <span className="dsa-popular-tag">Top Target</span>}
                        </div>

                        <div className="dsa-company-header__stats">
                            <div className="dsa-company-header__progress-wrap">
                                <div className="dsa-company-header__progress-labels">
                                    <span>Progress: {stats.solved} / {company.totalQuestions} Solved</span>
                                    <span>{stats.rate}%</span>
                                </div>
                                <ProgressBar value={stats.solved} max={company.totalQuestions} showLabel={false} size="sm" />
                            </div>

                            <div className="dsa-company-header__diff-pills">
                                <span className="dsa-diff-pill dsa-diff-pill--easy">
                                    Easy: {company.easy}
                                </span>
                                <span className="dsa-diff-pill dsa-diff-pill--medium">
                                    Medium: {company.medium}
                                </span>
                                <span className="dsa-diff-pill dsa-diff-pill--hard">
                                    Hard: {company.hard}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <FilterBar
                    search={search}
                    onSearchChange={setSearch}
                    selectedDifficulty={difficulty}
                    onDifficultyChange={setDifficulty}
                    selectedStatus={statusFilter}
                    onStatusChange={setStatusFilter}
                    totalCount={problems.length}
                    filteredCount={filteredProblems.length}
                    placeholder={`Search within ${company.name} questions...`}
                />

                {/* Dense Problem Table */}
                <div className="dsa-table-container">
                    <table className="dsa-table">
                        <thead>
                            <tr>
                                <th style={{ width: "48px" }}>#</th>
                                <th>Problem Title</th>
                                <th style={{ width: "110px" }}>Difficulty</th>
                                <th style={{ width: "100px" }}>Frequency</th>
                                <th style={{ width: "130px" }}>Acceptance Rate</th>
                                <th style={{ width: "130px" }}>Status</th>
                                <th style={{ width: "90px", textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProblems.map((p) => (
                                <ProblemRow
                                    key={p.id}
                                    problem={p}
                                    index={p.index}
                                    status={getStatus(p.id)}
                                    onToggleStatus={() => toggleSolved(p.id)}
                                    showFrequency={true}
                                    showAcceptance={true}
                                    showCompanies={false}
                                />
                            ))}
                        </tbody>
                    </table>

                    {filteredProblems.length === 0 && (
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
