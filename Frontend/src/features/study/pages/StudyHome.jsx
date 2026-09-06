import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import AppHeader from '../../interview/components/AppHeader'
import DocumentCard from '../components/DocumentCard'
import UploadModal from '../components/UploadModal'
import { useStudy } from '../hooks/useStudy'
import '../style/study.scss'

const StudyHome = () => {
    const navigate = useNavigate()
    const {
        documents,
        recentSessions,
        loading,
        fetchDocuments,
        fetchRecentSessionsList,
        uploadFile,
        removeDocument
    } = useStudy()

    const [ isUploadOpen, setIsUploadOpen ] = useState(false)
    const [ searchQuery, setSearchQuery ] = useState('')
    const [ formatFilter, setFormatFilter ] = useState('all')
    const [ sortBy, setSortBy ] = useState('recent-added')
    const [ isDropzoneDragging, setIsDropzoneDragging ] = useState(false)

    useEffect(() => {
        fetchDocuments({ search: searchQuery, fileType: formatFilter })
        fetchRecentSessionsList()
    }, [ fetchDocuments, fetchRecentSessionsList, searchQuery, formatFilter ])

    const handleUploadSuccess = async (file) => {
        const newDoc = await uploadFile(file)
        return newDoc
    }

    const handleDeleteDocument = async (id) => {
        await removeDocument(id)
    }

    // Direct drag-and-drop on empty state dropzone
    const handleDropzoneDrop = async (e) => {
        e.preventDefault()
        setIsDropzoneDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setIsUploadOpen(true)
        }
    }

    // Client-side sorting
    const sortedDocuments = useMemo(() => {
        const list = [ ...documents ]
        switch (sortBy) {
            case 'recent-studied':
                return list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            case 'name-asc':
                return list.sort((a, b) => (a.originalFileName || '').localeCompare(b.originalFileName || ''))
            case 'name-desc':
                return list.sort((a, b) => (b.originalFileName || '').localeCompare(a.originalFileName || ''))
            case 'recent-added':
            default:
                return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        }
    }, [ documents, sortBy ])

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return 'Recently'
        const diffSecs = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000)
        if (diffSecs < 60) return 'Just now'
        const diffMins = Math.round(diffSecs / 60)
        if (diffMins < 60) return `${diffMins}m ago`
        const diffHours = Math.round(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`
        const diffDays = Math.round(diffHours / 24)
        return `${diffDays}d ago`
    }

    return (
        <main className='study-home'>
            <AppHeader title='AI Study Room' eyebrow='Study Assistant' />

            <div className='study-home__content'>
                {/* 1. Hero Section */}
                <section className='study-hero'>
                    <div className='study-hero__info'>
                        <div className='study-hero__eyebrow-badge'>
                            <span className='sparkle'>✦</span>
                            <span>AI STUDY ROOM</span>
                        </div>
                        <h1 className='study-hero__title'>
                            Your personal AI study assistant
                        </h1>
                        <p className='study-hero__desc'>
                            Upload notes, textbooks, PDFs and documentation. Ask questions, generate summaries, and study directly from your material.
                        </p>

                        <div className='study-hero__actions-row'>
                            <button
                                type='button'
                                className='study-hero__action-btn'
                                onClick={() => setIsUploadOpen(true)}
                            >
                                <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                    <line x1='12' y1='5' x2='12' y2='19' />
                                    <line x1='5' y1='12' x2='19' y2='12' />
                                </svg>
                                <span>Upload Material</span>
                            </button>

                            <div className='study-hero__features-inline'>
                                <span>✦ Local Embeddings</span>
                                <span>•</span>
                                <span>Zero API Costs</span>
                                <span>•</span>
                                <span>Page-Level Citations</span>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Visual Preview Card */}
                    <div className='study-hero__visual' aria-hidden='true'>
                        <div className='visual-card'>
                            <div className='visual-card__header'>
                                <span className='visual-card__dot dot--pink' />
                                <span className='visual-card__dot dot--blue' />
                                <span className='visual-card__dot dot--green' />
                                <span className='visual-card__title'>Grounded Neural RAG</span>
                            </div>
                            <div className='visual-card__body'>
                                <div className='visual-card__query'>
                                    <span className='user-tag'>Student:</span>
                                    <span className='query-text'>What are the core themes in Chapter 3?</span>
                                </div>
                                <div className='visual-card__answer'>
                                    <div className='assistant-tag'>
                                        <span className='spark'>✦</span>
                                        <span>PrepAI Assistant</span>
                                        <span className='cite-tag'>Page 4</span>
                                    </div>
                                    <p className='answer-snippet'>
                                        The chapter outlines workforce demand forecasting, supply analysis, and quantitative modeling techniques...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Search + Filter + Sort Toolbar */}
                <div className='study-toolbar'>
                    <div className='study-toolbar__search'>
                        <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <circle cx='11' cy='11' r='8' />
                            <line x1='21' y1='21' x2='16.65' y2='16.65' />
                        </svg>
                        <input
                            type='text'
                            placeholder='Search documents by name...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type='button'
                                className='search-clear-btn'
                                onClick={() => setSearchQuery('')}
                                aria-label='Clear search'
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className='study-toolbar__controls'>
                        <div className='study-toolbar__filters'>
                            {[ 'all', 'pdf', 'docx', 'txt', 'md' ].map((type) => (
                                <button
                                    key={type}
                                    type='button'
                                    className={`study-toolbar__pill ${formatFilter === type ? 'is-active' : ''}`}
                                    onClick={() => setFormatFilter(type)}
                                >
                                    {type.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className='study-toolbar__sort'>
                            <span className='sort-label'>Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className='study-toolbar__select'
                                aria-label='Sort documents'
                            >
                                <option value='recent-added'>Recently added</option>
                                <option value='recent-studied'>Recently studied</option>
                                <option value='name-asc'>Name A-Z</option>
                                <option value='name-desc'>Name Z-A</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 4. Documents Section */}
                <section className='study-section'>
                    <div className='study-section__header'>
                        <h2>
                            Your Documents
                            <span className='badge-count'>{sortedDocuments.length}</span>
                        </h2>
                    </div>

                    {sortedDocuments.length === 0 ? (
                        searchQuery || formatFilter !== 'all' ? (
                            /* No Search Results State */
                            <div className='study-empty-search'>
                                <span className='empty-search-icon'>🔍</span>
                                <h3>No documents found</h3>
                                <p>No study materials match your current search or format filter.</p>
                                <button
                                    type='button'
                                    className='study-toolbar__pill'
                                    onClick={() => { setSearchQuery(''); setFormatFilter('all'); }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            /* Purposeful Dropzone Empty State */
                            <div
                                className={`study-dropzone-empty ${isDropzoneDragging ? 'is-dragover' : ''}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDropzoneDragging(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDropzoneDragging(false); }}
                                onDrop={handleDropzoneDrop}
                                onClick={() => setIsUploadOpen(true)}
                                role='button'
                                tabIndex={0}
                                aria-label='Upload material dropzone'
                            >
                                <div className='dropzone-icon-box'>
                                    <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#54c6ff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                                        <polyline points='14 2 14 8 20 8' />
                                        <line x1='12' y1='18' x2='12' y2='12' />
                                        <line x1='9' y1='15' x2='15' y2='15' />
                                    </svg>
                                </div>
                                <h3>Start studying smarter</h3>
                                <p className='dropzone-instruction'>
                                    Drop your study material here or browse files
                                </p>
                                <div className='dropzone-formats-badge'>
                                    <span>PDF</span>
                                    <span>·</span>
                                    <span>DOCX</span>
                                    <span>·</span>
                                    <span>TXT</span>
                                    <span>·</span>
                                    <span>MD</span>
                                </div>
                                <button
                                    type='button'
                                    className='study-hero__action-btn'
                                    onClick={(e) => { e.stopPropagation(); setIsUploadOpen(true); }}
                                >
                                    Upload Material
                                </button>
                            </div>
                        )
                    ) : (
                        <ul className='study-grid'>
                            {sortedDocuments.map((doc) => (
                                <DocumentCard
                                    key={doc._id}
                                    document={doc}
                                    onDelete={handleDeleteDocument}
                                />
                            ))}
                        </ul>
                    )}
                </section>

                {/* 5. Recent Study Sessions (Subordinate to Documents) */}
                <section className='study-recents'>
                    <div className='study-section__header'>
                        <h2>Recent Study Sessions</h2>
                    </div>

                    {recentSessions.length === 0 ? (
                        <div className='study-recents__empty'>
                            <span className='empty-icon'>💬</span>
                            <p>Your recent study sessions will appear here.</p>
                        </div>
                    ) : (
                        <div className='study-recents__grid'>
                            {recentSessions.map((session) => {
                                const docId = session.documentId?._id || (typeof session.documentId === 'string' ? session.documentId : null)
                                if (!docId) return null
                                const docName = session.documentId?.originalFileName || 'Study Document'

                                return (
                                    <Link
                                        key={session._id}
                                        to={`/study/${docId}`}
                                        className='study-recents__card'
                                        title={`Continue study session on ${docName}`}
                                    >
                                        <div className='recent-card-top'>
                                            <div className='recent-doc-title'>
                                                <span className='chat-icon'>💬</span>
                                                <span className='doc-name' title={docName}>{docName}</span>
                                            </div>
                                        </div>

                                        <p className='recent-card-question'>
                                            "{session.lastQuestion || 'Discussion session'}"
                                        </p>

                                        <div className='recent-card-footer'>
                                            <span className='recent-time'>{formatRelativeTime(session.updatedAt)}</span>
                                            <span className='continue-cta'>Continue →</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </main>
    )
}

export default StudyHome
