import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router'
import AppHeader from '../../interview/components/AppHeader'
import ChatView from '../components/ChatView'
import SourcesPanel from '../components/SourcesPanel'
import { useStudy } from '../hooks/useStudy'
import '../style/study.scss'

const StudyRoom = () => {
    const { documentId } = useParams()
    const [ searchParams, setSearchParams ] = useSearchParams()
    const [ isSourcesOpen, setIsSourcesOpen ] = useState(false)
    const [ isSidebarOpen, setIsSidebarOpen ] = useState(true)
    const initialPromptRanRef = useRef(false)

    const {
        activeDoc,
        sessions,
        activeSessionId,
        messages,
        activeSources,
        isSending,
        askQuestion,
        startNewSession,
        selectSession,
        removeSession,
        setActiveSources
    } = useStudy(documentId)

    // Automatically trigger initial quick action prompt if present in URL
    useEffect(() => {
        const queryPrompt = searchParams.get('q') || searchParams.get('prompt')
        if (queryPrompt && activeDoc && activeDoc.status === 'READY' && !isSending && !initialPromptRanRef.current) {
            initialPromptRanRef.current = true
            askQuestion(queryPrompt)
            setSearchParams({}, { replace: true })
        }
    }, [ searchParams, activeDoc, isSending, askQuestion, setSearchParams ])

    const formatBytes = (bytes) => {
        if (!bytes) return '0 KB'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const handleSelectSources = (sources) => {
        setActiveSources(sources)
        setIsSourcesOpen(true)
    }

    return (
        <div className='study-room'>
            <AppHeader title='Study Workspace' eyebrow='AI Study Room' />

            <div className={`study-room__layout ${isSourcesOpen ? 'has-sources-open' : ''} ${isSidebarOpen ? 'has-sidebar-open' : 'is-sidebar-collapsed'}`}>
                {/* Left Sidebar: Compact Document Context & Sessions */}
                <aside className={`study-sidebar ${!isSidebarOpen ? 'is-collapsed' : ''}`}>
                    <div className='study-sidebar__header'>
                        <Link to='/study' className='study-sidebar__back' title='Return to Document Library'>
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                <line x1='19' y1='12' x2='5' y2='12' />
                                <polyline points='12 19 5 12 12 5' />
                            </svg>
                            <span>Back to Library</span>
                        </Link>
                    </div>

                    {activeDoc && (
                        <div className='study-sidebar__doc-pill'>
                            <div className='doc-pill-top'>
                                <span className={`file-badge file-badge--${activeDoc.fileType}`}>
                                    {activeDoc.fileType?.toUpperCase()}
                                </span>
                                <h3 className='doc-name' title={activeDoc.originalFileName}>
                                    {activeDoc.originalFileName}
                                </h3>
                            </div>
                            <div className='doc-pill-meta'>
                                <span>📄 {activeDoc.pageCount || 1} {activeDoc.pageCount === 1 ? 'page' : 'pages'}</span>
                                <span>🧩 {activeDoc.chunkCount || 0} chunks</span>
                                <span>💾 {formatBytes(activeDoc.fileSize)}</span>
                            </div>
                        </div>
                    )}

                    <button
                        type='button'
                        className='study-sidebar__new-chat-btn'
                        onClick={startNewSession}
                    >
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                            <line x1='12' y1='5' x2='12' y2='19' />
                            <line x1='5' y1='12' x2='19' y2='12' />
                        </svg>
                        <span>New Chat</span>
                    </button>

                    {sessions.length > 0 && (
                        <div className='study-sidebar__sessions-group'>
                            <div className='study-sidebar__section-label'>Study Sessions</div>
                            <ul className='study-sidebar__sessions-list'>
                                {sessions.map((sess) => (
                                    <li
                                        key={sess._id}
                                        className={`study-sidebar__session-item ${activeSessionId === sess._id ? 'is-active' : ''}`}
                                        onClick={() => selectSession(sess._id)}
                                        title={sess.title || 'Session'}
                                    >
                                        <span className='session-icon'>💬</span>
                                        <span className='session-title'>
                                            {sess.title || 'Session'}
                                        </span>
                                        <button
                                            type='button'
                                            className='session-delete-btn'
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeSession(sess._id)
                                            }}
                                            title='Delete session'
                                            aria-label='Delete session'
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>

                {/* Center Column: Interactive Conversational Chat (The Hero Area) */}
                <main className='study-room__center'>
                    <ChatView
                        messages={messages}
                        isSending={isSending}
                        onSendMessage={askQuestion}
                        onSelectSources={handleSelectSources}
                        onToggleSourcesPanel={() => setIsSourcesOpen((prev) => !prev)}
                        isSourcesPanelOpen={isSourcesOpen}
                        activeSourcesCount={activeSources.length}
                        documentTitle={activeDoc?.originalFileName || 'Study Document'}
                    />
                </main>

                {/* Right Column: Supporting Sources Inspector */}
                <SourcesPanel
                    sources={activeSources}
                    isOpen={isSourcesOpen}
                    onClose={() => setIsSourcesOpen(false)}
                    documentTitle={activeDoc?.originalFileName}
                />
            </div>
        </div>
    )
}

export default StudyRoom
