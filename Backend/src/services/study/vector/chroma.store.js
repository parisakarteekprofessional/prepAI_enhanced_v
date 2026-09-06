/**
 * @description Abstracted ChromaDB store interface for PrepAI Study Assistant.
 * Communicates with the local persistent Chroma vector store via the RAG engine.
 */

const { RAG_URL, ensureRagEngineRunning } = require("../pythonRunner")

async function ingestDocument({ filePath, fileType, documentId, userId, originalFileName }) {
    await ensureRagEngineRunning()

    const res = await fetch(`${RAG_URL}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            filePath,
            fileType,
            documentId: String(documentId),
            userId: String(userId),
            originalFileName
        })
    })

    if (!res.ok) {
        let errDetail = "Failed to ingest document."
        try {
            const errJson = await res.json()
            if (errJson.detail) errDetail = errJson.detail
        } catch {
            errDetail = await res.text()
        }
        throw new Error(errDetail)
    }

    return await res.json()
}

async function queryRelevantChunks({ query, documentId, userId, topK = 5 }) {
    await ensureRagEngineRunning()

    const res = await fetch(`${RAG_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            documentId: String(documentId),
            userId: String(userId),
            topK
        })
    })

    if (!res.ok) {
        let errDetail = "Failed to query vector store."
        try {
            const errJson = await res.json()
            if (errJson.detail) errDetail = errJson.detail
        } catch {
            errDetail = await res.text()
        }
        throw new Error(errDetail)
    }

    const data = await res.json()
    return data.chunks || []
}

async function deleteDocumentVectors({ documentId, userId }) {
    await ensureRagEngineRunning()

    try {
        const res = await fetch(`${RAG_URL}/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                documentId: String(documentId),
                userId: String(userId)
            })
        })
        return res.ok
    } catch (err) {
        console.warn(`[Chroma Store] Warning: could not delete vectors for doc ${documentId}:`, err.message)
        return false
    }
}

module.exports = {
    ingestDocument,
    queryRelevantChunks,
    deleteDocumentVectors
}
