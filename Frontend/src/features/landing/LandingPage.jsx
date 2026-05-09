import React from "react"
import { Link } from "react-router"
import "./landing.scss"

const LandingPage = () => {
    return (
        <main className="landing-page">
            <section className="landing-shell">
                <nav className="landing-nav">
                    <Link className="landing-brand" to="/">
                        <span className="landing-brand__mark">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3L14.4 8.6L20.5 9.1L15.9 13.1L17.3 19L12 15.9L6.7 19L8.1 13.1L3.5 9.1L9.6 8.6L12 3Z" fill="currentColor" />
                            </svg>
                        </span>
                        <span>PrepAI</span>
                    </Link>

                    <div className="landing-nav__links">
                        <a href="#features">Features</a>
                        <a href="#workflow">Workflow</a>
                        <Link to="/login">Login</Link>
                        <Link className="landing-nav__cta" to="/register">Get Started</Link>
                    </div>
                </nav>

                <div className="landing-hero">
                    <div className="landing-hero__content">
                        <span className="landing-eyebrow">AI interview command center</span>
                        <h1>
                            Prepare smarter for your <span>dream job.</span>
                        </h1>
                        <p>
                            Upload your resume and job description to analyze your match score, uncover skill gaps,
                            practice targeted questions, and download a recruiter-ready resume.
                        </p>

                        <div className="landing-actions">
                            <Link className="landing-button landing-button--primary" to="/register">
                                Get Started
                            </Link>
                            <Link className="landing-button landing-button--secondary" to="/login">
                                Login
                            </Link>
                        </div>
                    </div>

                    <div className="landing-visual" aria-hidden="true">
                        <div className="landing-depth-grid" />
                        <div className="landing-depth-panel landing-depth-panel--one" />
                        <div className="landing-depth-panel landing-depth-panel--two" />
                        <div className="landing-card landing-card--score">
                            <span>Match Score</span>
                            <strong>86%</strong>
                            <small>Strong role alignment</small>
                        </div>
                        <div className="landing-card landing-card--main">
                            <div className="landing-card__topline">
                                <span />
                                <span />
                                <span />
                            </div>
                            <h2>Frontend Engineer</h2>
                            <div className="landing-meter">
                                <span style={{ width: "86%" }} />
                            </div>
                            <ul>
                                <li>React system design prompts</li>
                                <li>Behavioral interview stories</li>
                                <li>Resume optimization plan</li>
                            </ul>
                        </div>
                        <div className="landing-card landing-card--tag">
                            <span>Skill Gap</span>
                            <strong>TypeScript Depth</strong>
                        </div>
                    </div>
                </div>

                <div className="landing-feature-strip" id="features">
                    <article>
                        <span>01</span>
                        <strong>Role Match</strong>
                        <p>Measure how closely your profile fits the job description.</p>
                    </article>
                    <article>
                        <span>02</span>
                        <strong>Practice Plan</strong>
                        <p>Get technical, behavioral, and day-wise preparation guidance.</p>
                    </article>
                    <article>
                        <span>03</span>
                        <strong>Resume PDF</strong>
                        <p>Generate a sharper resume tailored to the opportunity.</p>
                    </article>
                </div>

                <div className="landing-workflow" id="workflow">
                    <span>How it works</span>
                    <strong>Upload resume, paste the role, generate your plan.</strong>
                    <p>
                        PrepAI turns the same inputs you already have into match scoring, question practice, skill
                        gap review, and resume output inside your private workspace.
                    </p>
                </div>
            </section>
        </main>
    )
}

export default LandingPage
