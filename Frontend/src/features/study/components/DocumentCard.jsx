import React, { useState } from 'react'
import { useNavigate } from 'react-router'

const DocumentCard = ({ document: doc, onDelete }) => {
    const navigate = useNavigate()
    const [ menuOpen, setMenuOpen ] = useState(false)

    const formatBytes = (bytes) => {
        if (!bytes) return '0 KB'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

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

    const isReady = doc.status === 'READY'
    const isProcessing = doc.status === 'PROCESSING' || doc.status === 'UPLOADING'
    const isFailed = doc.status === 'FAILED'

    const handleDelete = (e) => {
        e.stopPropagation()
        setMenuOpen(false)
        if (window.confirm(`Delete "${doc.originalFileName}" and all of its study chat history?`)) {
            onDelete(doc._id)
        }
    }

    const handleOpenStudy = (e) => {
        e.stopPropagation()
        if (isReady) {
            navigate(`/study/${doc._id}`)
        }
    }

    const getFileTypeMeta = (type) => {
        switch (type?.toLowerCase()) {
            case 'pdf': return { label: 'PDF', colorClass: 'file-type--pdf', icon: '📄' }
            case 'docx': return { label: 'DOCX', colorClass: 'file-type--docx', icon: '📝' }
            case 'txt': return { label: 'TXT', colorClass: 'file-type--txt', icon: '📃' }
            case 'md': return { label: 'MD', colorClass: 'file-type--md', icon: '📑' }
            default: return { label: 'DOC', colorClass: 'file-type--default', icon: '📄' }
        }
    }

    const fileMeta = getFileTypeMeta(doc.fileType)

    return (
        <li
            className={`study-doc-card ${isReady ? 'is-ready' : ''} ${isProcessing ? 'is-processing' : ''}`}
            onClick={handleOpenStudy}
            tabIndex={isReady ? 0 : -1}
            onKeyDown={(e) => { if (e.key === 'Enter') handleOpenStudy(e) }}
            role='button'
            aria-label={`Open ${doc.originalFileName}`}
        >
            <div className='study-doc-card__top'>
                <div className='study-doc-card__type-badge-group'>
                    <span className={`file-badge ${fileMeta.colorClass}`}>
                        {fileMeta.label}
                    </span>
                    {isProcessing && (
                        <span className='processing-pulse-badge'>Indexing...</span>
                    )}
                </div>

                <div className='study-doc-card__menu-wrapper' onClick={(e) => e.stopPropagation()}>
                    <button
                        type='button'
                        className='study-doc-card__more-btn'
                        onClick={() => setMenuOpen((prev) => !prev)}
                        title='Options'
                        aria-label='Document options'
                    >
                        ⋮
                    </button>

                    {menuOpen && (
                        <div className='study-doc-card__dropdown-menu'>
                            <button
                                type='button'
                                className='dropdown-item dropdown-item--delete'
                                onClick={handleDelete}
                            >
                                <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                    <polyline points='3 6 5 6 21 6' />
                                    <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                                </svg>
                                <span>Delete Document</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className='study-doc-card__title' title={doc.originalFileName}>
                {doc.originalFileName}
            </h3>

            <div className='study-doc-card__meta-row'>
                <span>{doc.pageCount ? `${doc.pageCount} ${doc.pageCount === 1 ? 'page' : 'pages'}` : '1 page'}</span>
                <span className='dot-sep'>·</span>
                <span>{formatBytes(doc.fileSize)}</span>
                <span className='dot-sep'>·</span>
                <span>{formatRelativeTime(doc.updatedAt || doc.createdAt)}</span>
            </div>

            {isFailed && doc.errorMessage && (
                <div className='study-doc-card__error-banner'>
                    ⚠️ {doc.errorMessage}
                </div>
            )}

            <div className='study-doc-card__footer'>
                <div className='study-doc-card__cta'>
                    <span>{isReady ? 'Open Study Room' : isProcessing ? 'Indexing Content...' : 'Unavailable'}</span>
                    {isReady && <span className='arrow-icon'>→</span>}
                </div>
            </div>
        </li>
    )
}

export default DocumentCard
