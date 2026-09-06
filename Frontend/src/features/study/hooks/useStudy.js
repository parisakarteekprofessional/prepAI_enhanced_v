import { useState, useEffect, useCallback, useRef } from "react"
import {
    getUserDocuments,
    getDocumentById,
    uploadDocument,
    deleteDocument,
    sendChatMessage,
    getDocumentSessions,
    getSessionMessages,
    deleteChatSession,
    getRecentSessions
} from "../services/study.api"

export const useStudy = (documentId = null) => {
    const [ documents, setDocuments ] = useState([])
    const [ activeDoc, setActiveDoc ] = useState(null)
    const [ sessions, setSessions ] = useState([])
    const [ activeSessionId, setActiveSessionId ] = useState(null)
    const [ messages, setMessages ] = useState([])
    const [ activeSources, setActiveSources ] = useState([])
    const [ recentSessions, setRecentSessions ] = useState([])

    const [ loading, setLoading ] = useState(false)
    const [ isSending, setIsSending ] = useState(false)
    const [ uploading, setUploading ] = useState(false)
    const [ uploadProgress, setUploadProgress ] = useState(0)
    const [ error, setError ] = useState(null)

    const pollTimerRef = useRef(null)

    // Fetch user documents library
    const fetchDocuments = useCallback(async (filters = {}) => {
        setLoading(true)
        setError(null)
        try {
            const data = await getUserDocuments(filters)
            const docs = Array.isArray(data?.documents) ? data.documents : []
            setDocuments(docs)
            return docs
        } catch (err) {
            console.error("Failed to fetch documents:", err)
            setError(err.response?.data?.message || "Failed to load study documents.")
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch recent study sessions
    const fetchRecentSessionsList = useCallback(async () => {
        try {
            const data = await getRecentSessions()
            const recents = Array.isArray(data?.sessions) ? data.sessions : []
            setRecentSessions(recents)
            return recents
        } catch (err) {
            console.error("Failed to fetch recent study sessions:", err)
            return []
        }
    }, [])

    // Fetch single document details
    const fetchDocument = useCallback(async (id) => {
        if (!id) return null
        setLoading(true)
        setError(null)
        try {
            const data = await getDocumentById(id)
            if (data?.document) {
                setActiveDoc(data.document)
                return data.document
            }
            return null
        } catch (err) {
            console.error("Failed to fetch document:", err)
            setError(err.response?.data?.message || "Document not found.")
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch sessions for active document
    const fetchSessions = useCallback(async (docId) => {
        if (!docId) return []
        try {
            const data = await getDocumentSessions(docId)
            const sessList = Array.isArray(data?.sessions) ? data.sessions : []
            setSessions(sessList)
            return sessList
        } catch (err) {
            console.error("Failed to fetch sessions:", err)
            return []
        }
    }, [])

    // Fetch messages for a session
    const fetchMessages = useCallback(async (sessId) => {
        if (!sessId) return []
        try {
            const data = await getSessionMessages(sessId)
            const msgList = Array.isArray(data?.messages) ? data.messages : []
            setMessages(msgList)

            // Auto-select latest assistant sources if available
            const lastAssistantMsg = [ ...msgList ].reverse().find((m) => m.role === "assistant" && m.sources?.length > 0)
            if (lastAssistantMsg) {
                setActiveSources(lastAssistantMsg.sources)
            } else {
                setActiveSources([])
            }
            return msgList
        } catch (err) {
            console.error("Failed to fetch messages:", err)
            return []
        }
    }, [])

    // Upload document
    const uploadFile = async (file) => {
        setUploading(true)
        setUploadProgress(0)
        setError(null)
        try {
            const data = await uploadDocument(file, (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    setUploadProgress(percent)
                }
            })

            const newDoc = data?.document
            if (newDoc) {
                setDocuments((prev) => [ newDoc, ...prev ])
            }
            return newDoc
        } catch (err) {
            console.error("Upload error:", err)
            const msg = err.response?.data?.message || err.message || "Failed to upload document."
            setError(msg)
            throw new Error(msg)
        } finally {
            setUploading(false)
        }
    }

    // Delete document
    const removeDocument = async (id) => {
        try {
            await deleteDocument(id)
            setDocuments((prev) => prev.filter((d) => d._id !== id))
            if (activeDoc?._id === id) {
                setActiveDoc(null)
                setMessages([])
                setSessions([])
            }
            return true
        } catch (err) {
            console.error("Delete error:", err)
            throw new Error(err.response?.data?.message || "Failed to delete document.")
        }
    }

    // Ask a question in current chat
    const askQuestion = async (question) => {
        if (!activeDoc || !question.trim()) return null

        setIsSending(true)
        setError(null)

        const optimisticUserMsg = {
            _id: `temp-${Date.now()}`,
            role: "user",
            content: question,
            createdAt: new Date().toISOString()
        }

        setMessages((prev) => [ ...prev, optimisticUserMsg ])

        try {
            const response = await sendChatMessage({
                documentId: activeDoc._id,
                question: question.trim(),
                sessionId: activeSessionId
            })

            if (response?.sessionId && (!activeSessionId || activeSessionId !== response.sessionId)) {
                setActiveSessionId(response.sessionId)
                fetchSessions(activeDoc._id)
            }

            const assistantMsg = {
                _id: response.messageId || `asst-${Date.now()}`,
                role: "assistant",
                content: response.answer,
                sources: response.sources || [],
                createdAt: new Date().toISOString()
            }

            setMessages((prev) => [ ...prev, assistantMsg ])

            if (response.sources && response.sources.length > 0) {
                setActiveSources(response.sources)
            }

            return response
        } catch (err) {
            console.error("Chat error:", err)
            const errMsg = err.response?.data?.message || err.message || "Failed to get AI response."
            setError(errMsg)

            // Display error bubble in chat
            setMessages((prev) => [
                ...prev,
                {
                    _id: `err-${Date.now()}`,
                    role: "assistant",
                    content: `⚠️ ${errMsg}`,
                    sources: [],
                    isError: true,
                    createdAt: new Date().toISOString()
                }
            ])
            return null
        } finally {
            setIsSending(false)
        }
    }

    // Start a new session
    const startNewSession = () => {
        setActiveSessionId(null)
        setMessages([])
        setActiveSources([])
    }

    // Select existing session
    const selectSession = (sessId) => {
        setActiveSessionId(sessId)
        fetchMessages(sessId)
    }

    // Delete existing session
    const removeSession = async (sessId) => {
        try {
            await deleteChatSession(sessId)
            setSessions((prev) => prev.filter((s) => s._id !== sessId))
            if (activeSessionId === sessId) {
                startNewSession()
            }
            return true
        } catch (err) {
            console.error("Delete session error:", err)
            return false
        }
    }

    // Real-time polling for PROCESSING documents
    useEffect(() => {
        const hasProcessingDoc =
            documents.some((d) => d.status === "PROCESSING" || d.status === "UPLOADING") ||
            (activeDoc && (activeDoc.status === "PROCESSING" || activeDoc.status === "UPLOADING"))

        if (hasProcessingDoc) {
            pollTimerRef.current = setInterval(async () => {
                if (activeDoc && (activeDoc.status === "PROCESSING" || activeDoc.status === "UPLOADING")) {
                    const updated = await fetchDocument(activeDoc._id)
                    if (updated && updated.status !== "PROCESSING" && updated.status !== "UPLOADING") {
                        setDocuments((prev) =>
                            prev.map((d) => (d._id === updated._id ? { ...d, ...updated } : d))
                        )
                    }
                } else {
                    fetchDocuments()
                }
            }, 2500)
        } else if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }

        return () => {
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current)
                pollTimerRef.current = null
            }
        }
    }, [ documents, activeDoc, fetchDocument, fetchDocuments ])

    // Initial load when documentId is provided
    useEffect(() => {
        if (documentId) {
            (async () => {
                const doc = await fetchDocument(documentId)
                if (doc) {
                    const sessList = await fetchSessions(documentId)
                    if (sessList && sessList.length > 0) {
                        setActiveSessionId(sessList[0]._id)
                        await fetchMessages(sessList[0]._id)
                    }
                }
            })()
        }
    }, [ documentId, fetchDocument, fetchSessions, fetchMessages ])

    return {
        documents,
        activeDoc,
        sessions,
        activeSessionId,
        messages,
        activeSources,
        recentSessions,
        loading,
        isSending,
        uploading,
        uploadProgress,
        error,
        setError,
        setActiveSources,
        fetchDocuments,
        fetchRecentSessionsList,
        fetchDocument,
        uploadFile,
        removeDocument,
        askQuestion,
        startNewSession,
        selectSession,
        removeSession
    }
}
