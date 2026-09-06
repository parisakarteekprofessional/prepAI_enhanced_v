import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams, useSearchParams, Link } from 'react-router'
import AppHeader from '../components/AppHeader.jsx'
import MockReportsSection from '../components/MockReportsSection.jsx'
import { getInterviewHistory } from '../../mockInterview/services/mockInterview.api.js'

const NAV_ITEMS = [
    { id: 'live-interview', label: 'AI Interview Score', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>) },
    { id: 'mock-reports', label: 'AI Mock Reports', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>) },
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const { interviewId } = useParams()
    const [ searchParams ] = useSearchParams()
    const initialNav = searchParams.get('tab') === 'live-interview' ? 'live-interview' : searchParams.get('tab') === 'mock-reports' ? 'mock-reports' : 'technical'

    const [ activeNav, setActiveNav ] = useState(initialNav)
    const [ loadFailed, setLoadFailed ] = useState(false)
    const [ resumePreparing, setResumePreparing ] = useState(false)
    const [ mockHistory, setMockHistory ] = useState([])
    const [ loadingMockHistory, setLoadingMockHistory ] = useState(false)
    const { report, getReportById, loading, getResumePdf } = useInterview()

    useEffect(() => {
        if (interviewId) {
            setLoadFailed(false)
            setLoadingMockHistory(true)
            getInterviewHistory(interviewId)
                .then((res) => {
                    if (res?.sessions) setMockHistory(res.sessions)
                })
                .catch((e) => console.error('Failed to fetch mock history:', e))
                .finally(() => setLoadingMockHistory(false))

            getReportById(interviewId).then((data) => {
                if (!data) {
                    setLoadFailed(true)
                } else if (searchParams.get('tab') === 'live-interview' || searchParams.get('completed') === 'true') {
                    setActiveNav('live-interview')
                }
            })
        }
    }, [ interviewId, searchParams ])

    const handleResumeDownload = async () => {
        setResumePreparing(true)
        try {
            await getResumePdf(interviewId)
        } finally {
            setResumePreparing(false)
        }
    }

    if (loading) {
        return (
            <div className='interview-page'>
                <AppHeader eyebrow='Report' title='Interview Plan' />
                <main className='loading-screen loading-screen--panel'>
                    <h1>{resumePreparing ? 'Preparing your resume...' : 'Loading your interview plan...'}</h1>
                </main>
            </div>
        )
    }

    if (loadFailed || !report) {
        return (
            <div className='interview-page'>
                <AppHeader eyebrow='Report' title='Interview Plan' />
                <main className='empty-report'>
                    <span className='empty-report__icon'>
                        <svg width='28' height='28' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                            <path d='M12 8V12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                            <path d='M12 16H12.01' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                            <path d='M10.3 4.3L2.9 17.2C2.1 18.6 3.1 20.3 4.7 20.3H19.3C20.9 20.3 21.9 18.6 21.1 17.2L13.7 4.3C12.9 2.9 11.1 2.9 10.3 4.3Z' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' />
                        </svg>
                    </span>
                    <h1>Interview plan not available</h1>
                    <p>This report could not be loaded. Go back home, create a new plan, or log out from the top bar.</p>
                </main>
            </div>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    const liveResult = report.liveInterviewResult
    const liveScores = liveResult?.scores || {}

    return (
        <div className='interview-page'>
            <AppHeader eyebrow='Report' title={report.title || 'Interview Plan'} />
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <div className='interview-nav__summary'>
                            <span>Plan</span>
                            <strong>{report.title || 'Untitled role'}</strong>
                        </div>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                                {item.id === 'live-interview' && liveResult && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        background: 'rgba(52, 211, 153, 0.2)',
                                        color: '#34d399',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '4px'
                                    }}>
                                        {liveResult.overallScore}%
                                    </span>
                                )}
                                {item.id === 'mock-reports' && mockHistory.length > 0 && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        background: 'rgba(236, 72, 153, 0.2)',
                                        color: '#f472b6',
                                        padding: '0.1rem 0.45rem',
                                        borderRadius: '4px'
                                    }}>
                                        {mockHistory.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleResumeDownload}
                        className='button primary-button' >
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Download Resume
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {/* Section 0: AI Mock Reports & History */}
                    {activeNav === 'mock-reports' && (
                        <section>
                            <MockReportsSection
                                sessions={mockHistory}
                                loading={loadingMockHistory}
                                interviewId={interviewId}
                                reportTitle={report.title}
                                onSelectActiveReport={() => setActiveNav('live-interview')}
                            />
                        </section>
                    )}

                    {/* Section 1: Live AI Interview Score & Debrief */}
                    {activeNav === 'live-interview' && (
                        <section>
                            <div className='content-header' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    <h2>Live AI Interview Score</h2>
                                    {liveResult && (
                                        <span className='content-header__count'>
                                            Conducted on {new Date(liveResult.completedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                {mockHistory.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveNav('mock-reports')}
                                        style={{
                                            background: 'rgba(236, 72, 153, 0.12)',
                                            border: '1px solid rgba(236, 72, 153, 0.3)',
                                            borderRadius: '8px',
                                            padding: '0.4rem 0.85rem',
                                            color: '#f472b6',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.45rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                        View All Mock Reports ({mockHistory.length}) →
                                    </button>
                                )}
                            </div>

                            {liveResult ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Overall Score Dial Card */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'auto 1fr auto',
                                        alignItems: 'center',
                                        gap: '2rem',
                                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '16px',
                                        padding: '1.75rem'
                                    }}>
                                        <div style={{
                                            width: '90px',
                                            height: '90px',
                                            borderRadius: '50%',
                                            border: '4px solid #ec4899',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(236, 72, 153, 0.12)'
                                        }}>
                                            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc' }}>
                                                {liveResult.overallScore}%
                                            </span>
                                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                                                Score
                                            </span>
                                        </div>

                                        <div>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: 'rgba(52, 211, 153, 0.2)',
                                                color: '#34d399',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {liveScores.hiringRecommendation?.replace(/_/g, ' ') || 'COMPLETED'}
                                            </span>
                                            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', color: '#f8fafc' }}>
                                                {report.title} Live Simulation
                                            </h3>
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                                                Questions sourced directly from this plan and your solved DSA history. Untimed candidate evaluation.
                                            </p>
                                        </div>

                                        <div>
                                            <Link
                                                to={`/mock-interview/live?reportId=${interviewId}`}
                                                className='button primary-button'
                                                style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.7rem 1.25rem', fontSize: '0.85rem' }}
                                            >
                                                Retake Live Interview
                                            </Link>
                                        </div>
                                    </div>

                                    {/* 5-Category Breakdown Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Technical Knowledge</span>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8', margin: '0.25rem 0' }}>
                                                {liveScores.technical ?? 75}%
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${liveScores.technical ?? 75}%`, height: '100%', background: '#38bdf8' }} />
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>DSA & Algorithms</span>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ec4899', margin: '0.25rem 0' }}>
                                                {liveScores.dsa ?? 75}%
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${liveScores.dsa ?? 75}%`, height: '100%', background: '#ec4899' }} />
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Problem Solving</span>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a855f7', margin: '0.25rem 0' }}>
                                                {liveScores.problemSolving ?? 75}%
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${liveScores.problemSolving ?? 75}%`, height: '100%', background: '#a855f7' }} />
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Communication</span>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34d399', margin: '0.25rem 0' }}>
                                                {liveScores.communication ?? 75}%
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${liveScores.communication ?? 75}%`, height: '100%', background: '#34d399' }} />
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Behavioral</span>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', margin: '0.25rem 0' }}>
                                                {liveScores.behavioral ?? 75}%
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${liveScores.behavioral ?? 75}%`, height: '100%', background: '#f59e0b' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Executive Summary & Feedback */}
                                    {liveResult.summary && (
                                        <div style={{ background: 'rgba(18, 24, 38, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1.5rem' }}>
                                            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: '#f8fafc' }}>
                                                Executive Debrief Summary
                                            </h3>
                                            <p style={{ margin: '0 0 1.25rem', color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.92rem' }}>
                                                {liveResult.summary}
                                            </p>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                                {liveResult.strengths?.length > 0 && (
                                                    <div>
                                                        <h4 style={{ margin: '0 0 0.5rem', color: '#34d399', fontSize: '0.88rem', fontWeight: 700 }}>
                                                            ✓ Key Strengths
                                                        </h4>
                                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                            {liveResult.strengths.map((s, i) => (
                                                                <li key={i} style={{ marginBottom: '0.3rem' }}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {liveResult.weaknesses?.length > 0 && (
                                                    <div>
                                                        <h4 style={{ margin: '0 0 0.5rem', color: '#f87171', fontSize: '0.88rem', fontWeight: 700 }}>
                                                            ⚠ Blind Spots & Improvements
                                                        </h4>
                                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                            {liveResult.weaknesses.map((w, i) => (
                                                                <li key={i} style={{ marginBottom: '0.3rem' }}>{w}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    background: 'rgba(18, 24, 38, 0.7)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '16px',
                                    padding: '3rem 2rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'rgba(236, 72, 153, 0.15)',
                                        color: '#f472b6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 1.25rem'
                                    }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                    </div>
                                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#f8fafc' }}>
                                        No Live AI Interview Taken Yet
                                    </h3>
                                    <p style={{ maxWidth: '520px', margin: '0 auto 1.5rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                        Practice answering the exact technical & behavioral questions generated in this report, along with problems from your solved DSA history, in a live untimed simulation.
                                    </p>
                                    <Link
                                        to={`/mock-interview/live?reportId=${interviewId}`}
                                        className='button primary-button'
                                        style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.75rem 1.5rem' }}
                                    >
                                        Take Live AI Interview →
                                    </Link>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Section 2: Technical Questions */}
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Section 3: Behavioral Questions */}
                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Section 4: Preparation Road Map */}
                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>Role match for your resume</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Live AI Interview Score Card or Launch CTA */}
                    {liveResult ? (
                        <div className='mock-interview-score-card' style={{
                            background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
                            border: '1px solid rgba(52, 211, 153, 0.35)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Live AI Interview Score
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f8fafc' }}>
                                    {liveResult.overallScore}%
                                </span>
                            </div>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(52, 211, 153, 0.2)',
                                color: '#34d399',
                                margin: '0 auto'
                            }}>
                                {liveScores.hiringRecommendation?.replace(/_/g, ' ') || 'COMPLETED'}
                            </span>
                            <button
                                type='button'
                                onClick={() => setActiveNav('live-interview')}
                                className='button'
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#e2e8f0',
                                    fontSize: '0.78rem',
                                    padding: '0.5rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                View Score Breakdown →
                            </button>
                            <Link
                                to={`/mock-interview/live?reportId=${interviewId}`}
                                className='button primary-button'
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.6rem 1rem',
                                    fontSize: '0.8rem',
                                    textDecoration: 'none',
                                    fontWeight: 700
                                }}
                            >
                                Retake Live Interview
                            </Link>
                        </div>
                    ) : (
                        <div className='mock-interview-cta' style={{
                            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
                            border: '1px solid rgba(236, 72, 153, 0.3)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f472b6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Face-to-Face Simulation
                            </span>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                                Ready for a live simulation?
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                Practice these exact technical & behavioral questions plus questions from your solved DSA list untimed.
                            </p>
                            <Link
                                to={`/mock-interview/live?reportId=${interviewId}`}
                                className='button primary-button'
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.7rem 1rem',
                                    fontSize: '0.85rem',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    letterSpacing: '0.03em'
                                }}
                            >
                                <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polygon points='23 7 16 12 23 17 23 7' /><rect x='1' y='5' width='15' height='14' rx='2' ry='2' /></svg>
                                TAKE LIVE AI INTERVIEW
                            </Link>
                        </div>
                    )}

                    <div className='sidebar-divider' />

                    {/* Bridges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Preparation Hub
                        </span>
                        <Link
                            to='/dsa'
                            className='button'
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#e2e8f0',
                                fontSize: '0.8rem',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'center',
                                textDecoration: 'none',
                                borderRadius: '8px'
                            }}
                        >
                            Practice Weak DSA Topics →
                        </Link>
                        <Link
                            to='/study'
                            className='button'
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#e2e8f0',
                                fontSize: '0.8rem',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'center',
                                textDecoration: 'none',
                                borderRadius: '8px'
                            }}
                        >
                            Study Weak Concepts →
                        </Link>
                    </div>

                </aside>
            </div>
        </div>
    )
}

export default Interview
