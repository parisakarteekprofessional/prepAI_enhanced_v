import React, { useState } from 'react';
import { Link } from 'react-router';
import { getInterviewReport } from '../../mockInterview/services/mockInterview.api';

export const MockReportsSection = ({
    sessions = [],
    loading = false,
    interviewId,
    reportTitle,
    onSelectActiveReport
}) => {
    const [expandedSessionId, setExpandedSessionId] = useState(null);
    const [sessionDetails, setSessionDetails] = useState({});
    const [loadingDetails, setLoadingDetails] = useState({});

    // Toggle expansion of question-by-question breakdown for an attempt
    const handleToggleDetails = async (sessionId) => {
        if (expandedSessionId === sessionId) {
            setExpandedSessionId(null);
            return;
        }

        setExpandedSessionId(sessionId);

        // Fetch details if not already cached
        if (!sessionDetails[sessionId]) {
            setLoadingDetails(prev => ({ ...prev, [sessionId]: true }));
            try {
                const data = await getInterviewReport(sessionId);
                setSessionDetails(prev => ({
                    ...prev,
                    [sessionId]: {
                        responses: data?.responses || [],
                        allQuestions: data?.allQuestions || []
                    }
                }));
            } catch (err) {
                console.error('Failed to load session details:', err);
            } finally {
                setLoadingDetails(prev => ({ ...prev, [sessionId]: false }));
            }
        }
    };

    // Calculate aggregated summary statistics
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED' || (s.scores && s.scores.overall !== undefined));
    const totalAttempts = completedSessions.length;
    const scores = completedSessions.map(s => s.scores?.overall || 0);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const latestScore = scores.length > 0 ? scores[0] : 0;
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const getRecommendationColor = (rec) => {
        switch (rec) {
            case 'STRONG_HIRE':
                return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' };
            case 'HIRE':
                return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)' };
            case 'LEANING_HIRE':
                return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
            case 'LEANING_NO_HIRE':
            case 'NO_HIRE':
                return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
            default:
                return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' };
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid rgba(236, 72, 153, 0.3)', borderTopColor: '#ec4899', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p>Loading previous mock interview reports...</p>
            </div>
        );
    }

    return (
        <div className="mock-reports-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Header with Title and Quick Action */}
            <div className="content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.25rem' }}>
                        AI Mock Interview Reports & History
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8' }}>
                        Track your past mock interview attempts, review score trends, and inspect detailed question debriefs.
                    </p>
                </div>
                <Link
                    to={`/mock-interview/live?reportId=${interviewId}`}
                    className="button primary-button"
                    style={{
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: 700
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                    Take New Live Interview
                </Link>
            </div>

            {/* Aggregated Performance Metric Cards */}
            {totalAttempts > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '1rem'
                }}>
                    <div style={{ background: 'rgba(22, 28, 44, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Total Attempts
                        </span>
                        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
                            {totalAttempts} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Completed</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(22, 28, 44, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Highest Score
                        </span>
                        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                            {highestScore}%
                        </div>
                    </div>

                    <div style={{ background: 'rgba(22, 28, 44, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Latest Score
                        </span>
                        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#ec4899', marginTop: '0.2rem' }}>
                            {latestScore}%
                        </div>
                    </div>

                    <div style={{ background: 'rgba(22, 28, 44, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Average Score
                        </span>
                        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
                            {avgScore}%
                        </div>
                    </div>
                </div>
            )}

            {/* List of Previous Mock Interview Reports */}
            {completedSessions.length === 0 ? (
                <div style={{
                    background: 'rgba(18, 24, 38, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '3.5rem 2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
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
                        No Previous Mock Interview Reports Found
                    </h3>
                    <p style={{ maxWidth: '520px', margin: '0 auto 1.75rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.55 }}>
                        Once you complete an AI mock interview, all your previous scores, category evaluations, and debrief summaries will be archived here for review.
                    </p>
                    <Link
                        to={`/mock-interview/live?reportId=${interviewId}`}
                        className="button primary-button"
                        style={{ textDecoration: 'none', display: 'inline-flex', padding: '0.75rem 1.5rem', fontWeight: 700 }}
                    >
                        Start Live AI Interview →
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {completedSessions.map((sess, idx) => {
                        const attemptNum = totalAttempts - idx;
                        const dateStr = new Date(sess.endedAt || sess.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });
                        const timeStr = new Date(sess.endedAt || sess.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const recStyle = getRecommendationColor(sess.finalReport?.hiringRecommendation);
                        const isExpanded = expandedSessionId === sess._id;
                        const isDetailsLoading = loadingDetails[sess._id];
                        const details = sessionDetails[sess._id];

                        return (
                            <div
                                key={sess._id}
                                style={{
                                    background: 'rgba(18, 24, 38, 0.85)',
                                    border: idx === 0 ? '1px solid rgba(236, 72, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '16px',
                                    padding: '1.6rem',
                                    boxShadow: idx === 0 ? '0 8px 28px rgba(236, 72, 153, 0.08)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Top Attempt Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingBottom: '1.1rem',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                    marginBottom: '1.25rem',
                                    flexWrap: 'wrap',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <span style={{
                                            padding: '0.28rem 0.75rem',
                                            borderRadius: '999px',
                                            background: idx === 0 ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.08)',
                                            color: '#ffffff',
                                            fontSize: '0.78rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.04em'
                                        }}>
                                            Attempt #{attemptNum} {idx === 0 && '• LATEST'}
                                        </span>

                                        <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {dateStr} at {timeStr}
                                        </span>

                                        {sess.totalTimeSpentSeconds > 0 && (
                                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                                • {Math.round(sess.totalTimeSpentSeconds / 60)} mins duration
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            background: recStyle.bg,
                                            color: recStyle.text,
                                            border: `1px solid ${recStyle.border}`
                                        }}>
                                            {sess.finalReport?.hiringRecommendation?.replace(/_/g, ' ') || 'COMPLETED'}
                                        </span>

                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            padding: '0.25rem 0.85rem',
                                            borderRadius: '999px',
                                            background: 'rgba(236, 72, 153, 0.15)',
                                            border: '1px solid rgba(236, 72, 153, 0.35)',
                                            color: '#f472b6',
                                            fontWeight: 800,
                                            fontSize: '0.95rem'
                                        }}>
                                            <span>{sess.scores?.overall ?? 0}%</span>
                                            <span style={{ fontSize: '0.68rem', color: '#cbd5e1', fontWeight: 600 }}>SCORE</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 5-Category Scores Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                    gap: '0.85rem',
                                    marginBottom: '1.25rem'
                                }}>
                                    <div style={{ background: 'rgba(12, 17, 28, 0.65)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Technical</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{sess.scores?.technical ?? 0}%</span>
                                        <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '0.35rem' }}>
                                            <div style={{ width: `${sess.scores?.technical ?? 0}%`, height: '100%', background: '#38bdf8', borderRadius: '2px' }} />
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(12, 17, 28, 0.65)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>DSA & Algorithms</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ec4899' }}>{sess.scores?.dsa ?? 0}%</span>
                                        <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '0.35rem' }}>
                                            <div style={{ width: `${sess.scores?.dsa ?? 0}%`, height: '100%', background: '#ec4899', borderRadius: '2px' }} />
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(12, 17, 28, 0.65)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Problem Solving</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a855f7' }}>{sess.scores?.problemSolving ?? 0}%</span>
                                        <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '0.35rem' }}>
                                            <div style={{ width: `${sess.scores?.problemSolving ?? 0}%`, height: '100%', background: '#a855f7', borderRadius: '2px' }} />
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(12, 17, 28, 0.65)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Communication</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>{sess.scores?.communication ?? 0}%</span>
                                        <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '0.35rem' }}>
                                            <div style={{ width: `${sess.scores?.communication ?? 0}%`, height: '100%', background: '#34d399', borderRadius: '2px' }} />
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(12, 17, 28, 0.65)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Behavioral</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>{sess.scores?.behavioral ?? 0}%</span>
                                        <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', marginTop: '0.35rem' }}>
                                            <div style={{ width: `${sess.scores?.behavioral ?? 0}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Executive Summary Debrief */}
                                {sess.finalReport?.summary && (
                                    <div style={{ background: 'rgba(12, 17, 28, 0.55)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '1.1rem 1.25rem', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: '0 0 0.5rem', color: '#f8fafc', fontSize: '0.9rem', fontWeight: 700 }}>
                                            Executive Debrief
                                        </h4>
                                        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.55 }}>
                                            {sess.finalReport.summary}
                                        </p>
                                    </div>
                                )}

                                {/* Strengths & Weaknesses */}
                                {((sess.finalReport?.strengths && sess.finalReport.strengths.length > 0) ||
                                  (sess.finalReport?.weaknesses && sess.finalReport.weaknesses.length > 0)) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                        {sess.finalReport?.strengths?.length > 0 && (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.18)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                                <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                                                    ✓ Key Strengths
                                                </span>
                                                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                                                    {sess.finalReport.strengths.map((st, i) => (
                                                        <li key={i} style={{ marginBottom: '0.2rem' }}>{st}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {sess.finalReport?.weaknesses?.length > 0 && (
                                            <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.18)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                                <span style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                                                    ⚠ Areas for Improvement
                                                </span>
                                                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                                                    {sess.finalReport.weaknesses.map((wk, i) => (
                                                        <li key={i} style={{ marginBottom: '0.2rem' }}>{wk}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Collapsible Question-by-Question Breakdown */}
                                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleDetails(sess._id)}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '8px',
                                            padding: '0.45rem 0.95rem',
                                            color: '#cbd5e1',
                                            fontSize: '0.82rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.45rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                        {isExpanded ? 'Hide Questions & Transcripts' : 'View Questions & Transcripts'}
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        {onSelectActiveReport && (
                                            <button
                                                type="button"
                                                onClick={() => onSelectActiveReport(sess)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#38bdf8',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    padding: '0.45rem 0.6rem'
                                                }}
                                            >
                                                Open in AI Score Tab →
                                            </button>
                                        )}
                                        <Link
                                            to={`/mock-interview/live?reportId=${interviewId}`}
                                            className="button"
                                            style={{
                                                padding: '0.45rem 0.95rem',
                                                borderRadius: '8px',
                                                background: 'rgba(236, 72, 153, 0.15)',
                                                border: '1px solid rgba(236, 72, 153, 0.35)',
                                                color: '#f472b6',
                                                fontSize: '0.82rem',
                                                fontWeight: 700,
                                                textDecoration: 'none'
                                            }}
                                        >
                                            Retake Interview
                                        </Link>
                                    </div>
                                </div>

                                {/* Expanded Question-by-Question Content */}
                                {isExpanded && (
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                                        {isDetailsLoading ? (
                                            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                                Loading questions and candidate transcripts...
                                            </div>
                                        ) : details?.responses && details.responses.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <h5 style={{ margin: '0 0 0.25rem', color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 700 }}>
                                                    Questions Asked & Candidate Responses ({details.responses.length})
                                                </h5>
                                                {details.responses.map((resp, rIdx) => {
                                                    const qText = resp.question?.questionText || `Question ${rIdx + 1}`;
                                                    const stage = resp.question?.stage || 'QUESTION';
                                                    const evalScore = resp.evaluation?.score;

                                                    return (
                                                        <div
                                                            key={rIdx}
                                                            style={{
                                                                background: 'rgba(10, 14, 24, 0.75)',
                                                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                                                borderRadius: '10px',
                                                                padding: '1rem'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                                    Q${rIdx + 1} • ${stage}
                                                                </span>
                                                                {evalScore !== undefined && (
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: evalScore >= 7 ? '#34d399' : evalScore >= 4 ? '#fbbf24' : '#f87171' }}>
                                                                        Score: ${evalScore}/10
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p style={{ margin: '0 0 0.65rem', color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>
                                                                {qText}
                                                            </p>
                                                            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', padding: '0.65rem 0.85rem', marginBottom: resp.evaluation?.feedback ? '0.65rem' : 0 }}>
                                                                <span style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                                                                    Your Answer:
                                                                </span>
                                                                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.84rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                                                                    "{resp.transcript || 'No answer recorded or question skipped.'}"
                                                                </p>
                                                            </div>
                                                            {resp.evaluation?.feedback && (
                                                                <div style={{ borderLeft: '2px solid #38bdf8', paddingLeft: '0.65rem', marginTop: '0.45rem' }}>
                                                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.45 }}>
                                                                        <strong style={{ color: '#38bdf8' }}>AI Feedback: </strong>
                                                                        {resp.evaluation.feedback}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                                                Detailed questions for this session are being finalized.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MockReportsSection;
