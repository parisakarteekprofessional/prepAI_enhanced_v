import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SUGGESTED_QUESTIONS = [
    "Summarize the key concepts in this document",
    "What are the most important formulas or principles?",
    "Explain the core topics step-by-step for a beginner",
    "Generate 5 high-yield exam practice questions"
]

/**
 * Strips legacy manual citation text like *(Source: Page 1, Section 2)* or
 * --- \n *(Source: ...)* so older messages display cleanly.
 */
function cleanRawCitations(content = '') {
    if (!content) return ''
    return content
        .replace(/\n*---\s*\n*\*\s*\(Source:[^)]+\)\s*\*/gi, '')
        .replace(/\n*\*\s*\(Source:[^)]+\)\s*\*/gi, '')
        .replace(/\n*\(\s*Source:[^)]+\)/gi, '')
        .replace(/\n*\[Source\s*#\d+[^\]]*\]/gi, '')
        .trim()
}

/**
 * Custom CodeBlock component for ReactMarkdown with syntax label and 1-click Copy button
 */
const CodeBlock = ({ className, children, ...props }) => {
    const [copied, setCopied] = useState(false)
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    const rawCode = String(children).replace(/\n$/, '')

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(rawCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy code:', err)
        }
    }

    return (
        <div className='study-code-block'>
            <div className='study-code-block__header'>
                <span className='study-code-block__lang'>{language || 'code'}</span>
                <button
                    type='button'
                    className='study-code-block__copy-btn'
                    onClick={handleCopy}
                    title='Copy code to clipboard'
                    aria-label='Copy code'
                >
                    {copied ? (
                        <>
                            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                <polyline points='20 6 9 17 4 12' />
                            </svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                <rect x='9' y='9' width='13' height='13' rx='2' ry='2' />
                                <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
                            </svg>
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <pre className='study-code-block__pre'>
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    )
}

const ChatView = ({
    messages = [],
    isSending = false,
    onSendMessage,
    onSelectSources,
    onToggleSourcesPanel,
    isSourcesPanelOpen = false,
    activeSourcesCount = 0,
    documentTitle = 'Study Material'
}) => {
    const [input, setInput] = useState('')
    const [isNearBottom, setIsNearBottom] = useState(true)
    const messagesContainerRef = useRef(null)
    const textareaRef = useRef(null)

    // Check if user is scrolled near bottom of chat
    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current
        if (!el) return
        const threshold = 140
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
        setIsNearBottom(nearBottom)
    }, [])

    const scrollToBottom = useCallback((smooth = true) => {
        const el = messagesContainerRef.current
        if (!el) return
        el.scrollTo({
            top: el.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        })
    }, [])

    // Scroll when new messages arrive only if already near bottom or if user sent a message
    useEffect(() => {
        if (isNearBottom) {
            scrollToBottom(true)
        }
    }, [messages, isSending, isNearBottom, scrollToBottom])

    const handleSubmit = (e) => {
        if (e) e.preventDefault()
        const trimmed = input.trim()
        if (!trimmed || isSending) return

        onSendMessage(trimmed)
        setInput('')
        setIsNearBottom(true)

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }

        // Force scroll down for user's own sent message
        setTimeout(() => scrollToBottom(true), 50)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleInputChange = (e) => {
        setInput(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
    }

    return (
        <div className='study-chat'>
            {/* Top Chat Action Bar */}
            <div className='study-chat__top-bar'>
                <div className='study-chat__doc-info'>
                    <span className='doc-icon'>📖</span>
                    <span className='doc-title' title={documentTitle}>{documentTitle}</span>
                </div>

                <div className='study-chat__top-actions'>
                    {onToggleSourcesPanel && (
                        <button
                            type='button'
                            className={`study-chat__sources-toggle-btn ${isSourcesPanelOpen ? 'is-active' : ''}`}
                            onClick={onToggleSourcesPanel}
                            title={isSourcesPanelOpen ? 'Hide source citations' : 'Show source citations'}
                        >
                            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' />
                                <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' />
                            </svg>
                            <span>Sources</span>
                            {activeSourcesCount > 0 && (
                                <span className='badge'>{activeSourcesCount}</span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Independent Scrollable Conversation Area */}
            <div
                className='study-chat__messages'
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                <div className='study-chat__feed'>
                    {messages.length === 0 ? (
                        <div className='study-chat__welcome'>
                            <div className='welcome-badge'>
                                <span className='sparkle'>✦</span>
                                <span>PrepAI Document Study Assistant</span>
                            </div>
                            <h2>Explore your study notes</h2>
                            <p>
                                Ask any question, explore key concepts, or request chapter summaries.
                                Every response is directly synthesized and cited from <strong>{documentTitle}</strong>.
                            </p>

                            <div className='study-chat__prompt-grid'>
                                {SUGGESTED_QUESTIONS.map((q, idx) => (
                                    <button
                                        key={idx}
                                        type='button'
                                        className='study-chat__prompt-card'
                                        onClick={() => onSendMessage(q)}
                                        disabled={isSending}
                                    >
                                        <span className='prompt-icon'>💡</span>
                                        <span className='prompt-text'>{q}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const isUser = msg.role === 'user'
                            const hasSources = msg.sources && msg.sources.length > 0
                            const cleanedText = cleanRawCitations(msg.content)

                            return (
                                <div
                                    key={msg._id || index}
                                    className={`study-msg-row study-msg-row--${isUser ? 'user' : 'assistant'} ${msg.isError ? 'is-error' : ''}`}
                                >
                                    {isUser ? (
                                        <div className='study-msg-user-bubble'>
                                            {msg.content}
                                        </div>
                                    ) : (
                                        <div className='study-msg-assistant'>
                                            <div className='study-msg-assistant__meta'>
                                                <div className='assistant-identity'>
                                                    <span className='assistant-avatar'>✦</span>
                                                    <span className='assistant-name'>PrepAI Study Assistant</span>
                                                </div>

                                                {hasSources && onSelectSources && (
                                                    <button
                                                        type='button'
                                                        className='study-msg-sources-btn'
                                                        onClick={() => onSelectSources(msg.sources)}
                                                        title='Inspect cited excerpts and page numbers'
                                                    >
                                                        <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                                            <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' />
                                                            <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' />
                                                        </svg>
                                                        <span>{msg.sources.length} {msg.sources.length === 1 ? 'citation' : 'citations'}</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className='study-msg-assistant__content'>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        // Code block vs inline code
                                                        code({ node, className, children, ...props }) {
                                                            const isBlock = Boolean(className) || String(children).includes('\n')
                                                            if (isBlock) {
                                                                return (
                                                                    <CodeBlock className={className} {...props}>
                                                                        {children}
                                                                    </CodeBlock>
                                                                )
                                                            }
                                                            return (
                                                                <code className='study-inline-code' {...props}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        },
                                                        pre({ children }) {
                                                            return <>{children}</>
                                                        },
                                                        // Responsive table wrapper
                                                        table({ children, ...props }) {
                                                            return (
                                                                <div className='study-markdown-table-wrapper'>
                                                                    <table {...props}>{children}</table>
                                                                </div>
                                                            )
                                                        },
                                                        // Safe links
                                                        a({ href, children, ...props }) {
                                                            return (
                                                                <a
                                                                    href={href}
                                                                    target='_blank'
                                                                    rel='noopener noreferrer'
                                                                    {...props}
                                                                >
                                                                    {children}
                                                                </a>
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {cleanedText}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}

                    {/* Typing / Synthesizing Indicator */}
                    {isSending && (
                        <div className='study-msg-row study-msg-row--assistant'>
                            <div className='study-msg-assistant'>
                                <div className='study-msg-assistant__meta'>
                                    <div className='assistant-identity'>
                                        <span className='assistant-avatar'>✦</span>
                                        <span className='assistant-name'>PrepAI Study Assistant</span>
                                    </div>
                                </div>
                                <div className='study-msg-thinking'>
                                    <span className='thinking-text'>Synthesizing answer from document notes</span>
                                    <span className='typing-dot' />
                                    <span className='typing-dot' />
                                    <span className='typing-dot' />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Jump to bottom button when user scrolled up */}
            {!isNearBottom && (
                <button
                    type='button'
                    className='study-chat__scroll-bottom-btn'
                    onClick={() => scrollToBottom(true)}
                    title='Scroll to latest message'
                    aria-label='Scroll to bottom'
                >
                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                        <line x1='12' y1='5' x2='12' y2='19' />
                        <polyline points='19 12 12 19 5 12' />
                    </svg>
                </button>
            )}

            {/* Bottom Sticky ChatGPT-Style Composer */}
            <div className='study-chat__composer-wrapper'>
                <div className='study-chat__composer-inner'>
                    <form className='study-chat__composer-box' onSubmit={handleSubmit}>
                        <textarea
                            ref={textareaRef}
                            rows='1'
                            value={input}
                            placeholder='Ask anything about this document... (Shift+Enter for newline)'
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isSending}
                            aria-label='Message input'
                        />

                        <button
                            type='submit'
                            className='study-chat__send-btn'
                            disabled={!input.trim() || isSending}
                            aria-label='Send message'
                            title='Send (Enter)'
                        >
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                <line x1='12' y1='19' x2='12' y2='5' />
                                <polyline points='5 12 12 5 19 12' />
                            </svg>
                        </button>
                    </form>

                    <div className='study-chat__composer-hint'>
                        <span>Shift + Enter for new line • Grounded in {documentTitle}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatView
