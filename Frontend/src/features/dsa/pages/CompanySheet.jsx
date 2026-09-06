import React, { useState, useMemo } from "react"
import { Link } from "react-router"
import AppHeader from "../../interview/components/AppHeader"
import DsaNav from "../components/DsaNav"
import CompanyCard from "../components/CompanyCard"
import { companies, getPopularCompanies } from "../services/dsaData"
import { useDsa } from "../hooks/useDsa"
import "../style/sheet.scss"

export default function CompanySheet() {
    const [search, setSearch] = useState("")
    const [selectedLetter, setSelectedLetter] = useState("ALL")
    const { getCompanyStats } = useDsa()

    const popularCompanies = useMemo(() => getPopularCompanies(), [])

    const alphabet = useMemo(() => {
        const letters = new Set(companies.map((c) => c.name.charAt(0).toUpperCase()).filter((l) => /[A-Z]/.test(l)))
        return ["ALL", ...Array.from(letters).sort()]
    }, [])

    const filteredCompanies = useMemo(() => {
        let list = companies

        if (selectedLetter !== "ALL") {
            list = list.filter((c) => c.name.charAt(0).toUpperCase() === selectedLetter)
        }

        if (search.trim()) {
            const query = search.trim().toLowerCase()
            list = list.filter((c) => c.name.toLowerCase().includes(query))
        }

        return list
    }, [search, selectedLetter])

    return (
        <div className="dsa-page">
            <AppHeader eyebrow="Workspace" title="DSA Practice" />
            <DsaNav />

            <main className="dsa-main">
                {/* Header */}
                <div className="dsa-sheet-header">
                    <div>
                        <div className="dsa-breadcrumbs">
                            <Link to="/dsa">DSA Practice</Link>
                            <span>/</span>
                            <span>Company-Wise</span>
                        </div>
                        <h1 className="dsa-sheet-header__title">Company-Wise DSA</h1>
                        <p className="dsa-sheet-header__subtitle">
                            Curated interview questions from 464 companies with real frequency & acceptance rates.
                        </p>
                    </div>

                    <div className="dsa-sheet-header__search">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search 464 companies..."
                            className="dsa-sheet-header__input"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="dsa-sheet-header__clear"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Popular Companies Showcase */}
                {!search && selectedLetter === "ALL" && (
                    <section className="dsa-popular-section">
                        <div className="dsa-section-header">
                            <span className="dsa-section-header__eyebrow">TOP TIERS</span>
                            <h2>Popular Tech Companies</h2>
                            <span className="dsa-section-header__hint">High-frequency interview question sets</span>
                        </div>

                        <div className="dsa-popular-pills">
                            {popularCompanies.map((c) => (
                                <Link
                                    key={c.id}
                                    to={`/dsa/company/${c.id}`}
                                    className="dsa-popular-pill"
                                >
                                    <span className="dsa-popular-pill__name">{c.name}</span>
                                    <span className="dsa-popular-pill__count">{c.totalQuestions} Qs</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Alphabetical Quick Filter */}
                <div className="dsa-alphabet-filter">
                    {alphabet.map((letter) => (
                        <button
                            key={letter}
                            type="button"
                            onClick={() => setSelectedLetter(letter)}
                            className={`dsa-alphabet-btn ${selectedLetter === letter ? "is-active" : ""}`}
                        >
                            {letter}
                        </button>
                    ))}
                </div>

                {/* All Companies Grid */}
                <section className="dsa-companies-section">
                    <div className="dsa-section-header">
                        <h2>
                            All Companies ({filteredCompanies.length})
                        </h2>
                        <span className="dsa-section-header__hint">
                            Showing questions tailored by hiring company
                        </span>
                    </div>

                    <div className="dsa-companies-grid">
                        {filteredCompanies.map((company) => {
                            const companyStats = getCompanyStats(company.id)
                            return (
                                <CompanyCard
                                    key={company.id}
                                    company={company}
                                    stats={companyStats}
                                />
                            )
                        })}
                    </div>

                    {filteredCompanies.length === 0 && (
                        <div className="dsa-empty-state">
                            <p>No companies found matching "{search}".</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("")
                                    setSelectedLetter("ALL")
                                }}
                                className="dsa-btn-secondary"
                            >
                                Reset Search
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
