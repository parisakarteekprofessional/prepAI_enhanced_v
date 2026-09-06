import axios from "axios"

const api = axios.create({
    baseURL: "/",
    withCredentials: true
})

/**
 * @description Upload study document (PDF, DOCX, TXT, MD)
 */
export const uploadDocument = async (file, onUploadProgress) => {
    const formData = new FormData()
    formData.append("document", file)

    const response = await api.post("/api/study/documents", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        },
        onUploadProgress
    })
    return response.data
}

/**
 * @description Fetch user's documents with optional search and filters
 */
export const getUserDocuments = async ({ search = "", fileType = "all", status = "all" } = {}) => {
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (fileType && fileType !== "all") params.append("fileType", fileType)
    if (status && status !== "all") params.append("status", status)

    const response = await api.get(`/api/study/documents?${params.toString()}`)
    return response.data
}

/**
 * @description Get single document metadata
 */
export const getDocumentById = async (documentId) => {
    const response = await api.get(`/api/study/documents/${documentId}`)
    return response.data
}

/**
 * @description Delete document, vectors, and chat sessions
 */
export const deleteDocument = async (documentId) => {
    const response = await api.delete(`/api/study/documents/${documentId}`)
    return response.data
}

/**
 * @description Ask question with RAG pipeline
 */
export const sendChatMessage = async ({ documentId, question, sessionId }) => {
    const response = await api.post(`/api/study/documents/${documentId}/chat`, {
        question,
        sessionId
    })
    return response.data
}

/**
 * @description Get chat sessions for a document
 */
export const getDocumentSessions = async (documentId) => {
    const response = await api.get(`/api/study/documents/${documentId}/sessions`)
    return response.data
}

/**
 * @description Get messages for a chat session
 */
export const getSessionMessages = async (sessionId) => {
    const response = await api.get(`/api/study/sessions/${sessionId}/messages`)
    return response.data
}

/**
 * @description Delete a chat session
 */
export const deleteChatSession = async (sessionId) => {
    const response = await api.delete(`/api/study/sessions/${sessionId}`)
    return response.data
}

/**
 * @description Get recent study sessions for the dashboard
 */
export const getRecentSessions = async () => {
    const response = await api.get("/api/study/recent-sessions")
    return response.data
}
