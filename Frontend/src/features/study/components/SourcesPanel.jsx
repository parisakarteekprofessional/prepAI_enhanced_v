import React from 'react'

const SourcesPanel = ({
    sources = [],
    isOpen = true,
    onClose,
    documentTitle = 'Document'
}) => {
    if (!isOpen) {
        return null
    }

    return (
        <aside className='study-sources'>
            <div className='study-sources__header'>
                <div className='study-sources__title-group'>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#54c6ff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' />
                        <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' />
                    </svg>
                    <h3>Source Citations</h3>
                    {sources.length > 0 && (
                        <span className='sources-count'>{sources.length}</span>
                    )}
                </div>

                {onClose && (
                    <button
                        type='button'
                        className='study-sources__close-btn'
                        onClick={onClose}
                        title='Close sources panel'
                        aria-label='Close sources panel'
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className='study-sources__content'>
                {sources.length === 0 ? (
                    <div className='study-sources__empty'>
                        <span className='empty-icon'>📑</span>
                        <p className='empty-primary'>No citations selected</p>
                        <p className='empty-secondary'>
                            When you ask a question, the relevant pages and excerpts referenced by the AI will appear here.
                        </p>
                    </div>
                ) : (
                    <ul className='study-sources__list'>
                        {sources.map((source, index) => {
                            const page = source.pageNumber || 1
                            const section = source.section || 'General Content'
                            const sim = Math.round((source.similarity || 0) * 100)
                            const preview = source.previewText || source.text || '...'

                            return (
                                <li key={index} className='study-sources__card'>
                                    <div className='source-meta'>
                                        <span className='page-tag'>📄 Page {page}</span>
                                        {sim > 0 && <span className='sim-tag'>{sim}% relevance</span>}
                                    </div>
                                    <h4 className='source-section'>{section}</h4>
                                    <p className='source-snippet'>
                                        "{preview}"
                                    </p>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </aside>
    )
}

export default SourcesPanel
