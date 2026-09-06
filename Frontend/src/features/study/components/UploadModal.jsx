import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'

const ALLOWED_EXTENSIONS = [ 'pdf', 'docx', 'txt', 'md' ]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const navigate = useNavigate()
    const [ file, setFile ] = useState(null)
    const [ isDragging, setIsDragging ] = useState(false)
    const [ error, setError ] = useState(null)
    const [ uploading, setUploading ] = useState(false)
    const [ progress, setProgress ] = useState(0)
    const [ progressStage, setProgressStage ] = useState('')
    const [ uploadedDoc, setUploadedDoc ] = useState(null)

    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!isOpen) {
            setFile(null)
            setError(null)
            setUploading(false)
            setProgress(0)
            setProgressStage('')
            setUploadedDoc(null)
        }
    }, [ isOpen ])

    if (!isOpen) return null

    const validateAndSetFile = (selectedFile) => {
        setError(null)
        if (!selectedFile) return

        const ext = selectedFile.name.split('.').pop().toLowerCase()
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            setError(`Unsupported file format: .${ext}. Allowed formats: PDF, DOCX, TXT, MD.`)
            setFile(null)
            return
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError(`File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`)
            setFile(null)
            return
        }

        setFile(selectedFile)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0])
        }
    }

    const handleStartUpload = async () => {
        if (!file) return
        setUploading(true)
        setError(null)
        setProgress(15)
        setProgressStage('Uploading document to server...')

        let timer = null
        try {
            timer = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + 12
                    if (next < 40) {
                        setProgressStage('Uploading document to server...')
                    } else if (next < 75) {
                        setProgressStage('Extracting text and document structure...')
                    } else if (next < 95) {
                        setProgressStage('Generating local embeddings and vector indexing...')
                    }
                    return next < 95 ? next : prev
                })
            }, 350)

            const createdDoc = await onUploadSuccess(file)
            clearInterval(timer)
            setProgress(100)
            setProgressStage('Document indexed & ready!')
            setUploadedDoc(createdDoc)
        } catch (err) {
            if (timer) clearInterval(timer)
            setError(err.message || 'Upload failed. Please try again.')
            setUploading(false)
            setProgress(0)
        }
    }

    const handleStartStudying = () => {
        if (uploadedDoc?._id) {
            onClose()
            navigate(`/study/${uploadedDoc._id}`)
        } else {
            onClose()
        }
    }

    const formatBytes = (bytes) => {
        if (!bytes) return '0 KB'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className='study-modal-backdrop' onClick={onClose}>
            <div className='study-upload-modal' onClick={(e) => e.stopPropagation()}>
                <div className='study-upload-modal__header'>
                    <div className='modal-title-group'>
                        <span className='modal-icon'>📚</span>
                        <h3>Upload Study Material</h3>
                    </div>
                    <button type='button' className='modal-close-btn' onClick={onClose} aria-label='Close'>✕</button>
                </div>

                <div className='study-upload-modal__body'>
                    {error && (
                        <div className='study-modal-error'>
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                                <circle cx='12' cy='12' r='10' />
                                <line x1='12' y1='8' x2='12' y2='12' />
                                <line x1='12' y1='16' x2='12.01' y2='16' />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {uploadedDoc ? (
                        /* Success Stage */
                        <div className='study-upload-success'>
                            <div className='success-badge'>
                                <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#10b981' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                    <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
                                    <polyline points='22 4 12 14.01 9 11.01' />
                                </svg>
                            </div>
                            <h4>{uploadedDoc.originalFileName} is ready</h4>
                            <p>
                                Indexed into {uploadedDoc.chunkCount || 0} searchable chunks. You can now ask questions, generate summaries, and study directly from this document.
                            </p>
                            <div className='success-actions'>
                                <button
                                    type='button'
                                    className='study-hero__action-btn'
                                    onClick={handleStartStudying}
                                >
                                    Start Studying Now →
                                </button>
                                <button
                                    type='button'
                                    className='study-toolbar__pill'
                                    onClick={() => {
                                        setFile(null)
                                        setUploadedDoc(null)
                                        setUploading(false)
                                        setProgress(0)
                                    }}
                                >
                                    Upload Another
                                </button>
                            </div>
                        </div>
                    ) : !file ? (
                        /* Dropzone Stage */
                        <div
                            className={`study-upload-modal__dropzone ${isDragging ? 'is-dragover' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className='dropzone-icon-circle'>
                                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='#54c6ff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                                    <polyline points='17 8 12 3 7 8' />
                                    <line x1='12' y1='3' x2='12' y2='15' />
                                </svg>
                            </div>
                            <p className='dropzone-title'>Drag and drop your study material</p>
                            <p className='dropzone-subtitle'>or click to browse from your computer</p>
                            <div className='dropzone-format-tags'>
                                <span>PDF</span>
                                <span>DOCX</span>
                                <span>TXT</span>
                                <span>MD</span>
                                <span className='format-size-limit'>Up to 10MB</span>
                            </div>
                        </div>
                    ) : (
                        /* Selected File Stage */
                        <div className='study-upload-modal__selected-file'>
                            <div className='file-info'>
                                <div className='file-icon-box'>
                                    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='#54c6ff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                                        <polyline points='14 2 14 8 20 8' />
                                    </svg>
                                </div>
                                <div className='file-details'>
                                    <div className='file-name' title={file.name}>{file.name}</div>
                                    <div className='file-size'>{formatBytes(file.size)}</div>
                                </div>
                            </div>
                            {!uploading && (
                                <button
                                    type='button'
                                    className='file-remove-btn'
                                    onClick={() => setFile(null)}
                                    title='Remove file'
                                    aria-label='Remove file'
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='.pdf,.docx,.txt,.md'
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    {uploading && (
                        <div className='study-upload-modal__progress'>
                            <div className='progress-label'>
                                <span>{progressStage}</span>
                                <span className='percent'>{progress}%</span>
                            </div>
                            <div className='progress-track'>
                                <div className='progress-fill' style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                {!uploadedDoc && (
                    <div className='study-upload-modal__footer'>
                        <button
                            type='button'
                            className='study-toolbar__pill'
                            onClick={onClose}
                            disabled={uploading}
                        >
                            Cancel
                        </button>
                        <button
                            type='button'
                            className='study-hero__action-btn'
                            style={{ padding: '0.65rem 1.4rem', fontSize: '0.86rem' }}
                            onClick={handleStartUpload}
                            disabled={!file || uploading}
                        >
                            {uploading ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className='spinner-small' />
                                    Processing...
                                </span>
                            ) : (
                                'Upload & Index'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UploadModal
