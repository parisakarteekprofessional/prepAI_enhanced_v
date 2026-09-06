const documentModel = require("../../models/document.model")
const messageModel = require("../../models/message.model")
const chatSessionModel = require("../../models/chatSession.model")
const chromaStore = require("./vector/chroma.store")
const mistralProvider = require("./llm/mistral.provider")
const { getOrCreateSession } = require("./chat.service")

const SIMILARITY_THRESHOLD = parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.22")

const GROUNDED_SYSTEM_PROMPT = `You are PrepAI Study Assistant.

Answer the user's question directly, clearly, and naturally using ONLY the provided DOCUMENT CONTEXT.

Return clean Markdown suitable for rendering inside a modern conversational UI.

FORMATTING RULES:
- Use headings (## or ###) only when they improve organization for complex answers.
- Keep paragraphs short and scannable.
- Use bullet points for concepts, features, or lists of items.
- Use numbered lists for sequential steps or procedures.
- Use bold only for important terms and key takeaways.
- Do NOT use unnecessary horizontal rules (---).
- Do NOT repeat the user's question.
- Do NOT add generic introductory filler such as "Here's a structured summary...", "Certainly!", "Based on the provided document...", or "In this document...". Get straight to the useful answer.
- Do NOT add unnecessary concluding filler like "Hope this helps!", "Let me know if you need anything else!", or generic wrap-ups.
- Do NOT over-format simple answers. For a simple question, give a direct, concise answer.
- For detailed questions, organize the answer logically with clear sections and bullets.
- Do NOT output raw HTML.
- Do NOT include citation URLs or manual footnote citations like "*(Source: Page 1, Section 2)*" or "[Source #1]". Citations are automatically handled by the application's dedicated citation interface.

GROUNDING & INTEGRITY:
1. Answer using ONLY the supplied DOCUMENT CONTEXT and active conversation context.
2. If the answer cannot be found in or directly inferred from the supplied document context, state clearly and politely: "I couldn't find information about this in your uploaded document."
3. Never invent facts, formulas, or definitions absent from the document context.`


function buildContextText(chunks) {
    return chunks.map((c, i) => {
        const page = c.pageNumber || 1
        const section = c.section || "Excerpt"
        const file = c.sourceFileName || "Document"
        return `[Source #${i + 1} | File: ${file} | Page ${page} | Section: ${section}]\n${c.text}`
    }).join("\n\n---\n\n")
}

async function handleUserQuery({ documentId, userId, sessionId, question }) {
    const cleanQuestion = question ? question.trim() : ""
    if (!cleanQuestion) {
        throw new Error("Question cannot be empty.")
    }

    // 1. Verify document exists, belongs to user, and is READY
    const doc = await documentModel.findOne({ _id: documentId, userId })
    if (!doc) {
        throw new Error("Document not found or unauthorized.")
    }

    if (doc.status !== "READY") {
        throw new Error(`This document is currently ${doc.status.toLowerCase()}. Please wait until indexing completes.`)
    }

    // 2. Ensure active chat session
    const session = await getOrCreateSession({
        documentId,
        userId,
        sessionId
    })

    // 3. Retrieve relevant chunks from Chroma with user isolation
    const rawChunks = await chromaStore.queryRelevantChunks({
        query: cleanQuestion,
        documentId: doc._id.toString(),
        userId: userId.toString(),
        topK: 5
    })

    // Filter by similarity threshold
    const relevantChunks = rawChunks.filter((c) => (c.similarity || 0) >= SIMILARITY_THRESHOLD)

    // 4. If no relevant chunks meet threshold, avoid calling LLM to prevent hallucinations
    if (relevantChunks.length === 0) {
        const fallbackAnswer = "I couldn't find enough information about that in your uploaded material. Try asking about a topic covered in the document."

        // Save user message
        await messageModel.create({
            sessionId: session._id,
            documentId: doc._id,
            userId,
            role: "user",
            content: cleanQuestion,
            sources: []
        })

        // Save assistant message
        const assistantMsg = await messageModel.create({
            sessionId: session._id,
            documentId: doc._id,
            userId,
            role: "assistant",
            content: fallbackAnswer,
            sources: []
        })

        session.lastQuestion = cleanQuestion
        await session.save()

        return {
            answer: fallbackAnswer,
            sources: [],
            sessionId: session._id,
            messageId: assistantMsg._id
        }
    }

    // 5. Construct multi-turn context
    const recentHistory = await messageModel
        .find({ sessionId: session._id })
        .sort({ createdAt: -1 })
        .limit(6)

    recentHistory.reverse()

    const contextBlock = buildContextText(relevantChunks)

    const conversationMessages = recentHistory.map((m) => ({
        role: m.role,
        content: m.content
    }))

    // Add current query augmented with retrieved document context
    conversationMessages.push({
        role: "user",
        content: `DOCUMENT CONTEXT:\n${contextBlock}\n\nUSER QUESTION:\n${cleanQuestion}`
    })

    // 6. Call Mistral Small LLM
    const completion = await mistralProvider.generateCompletion({
        systemPrompt: GROUNDED_SYSTEM_PROMPT,
        messages: conversationMessages,
        temperature: 0.2
    })

    const answer = completion.content

    // 7. Format structured source citations
    const sources = relevantChunks.map((c) => ({
        pageNumber: c.pageNumber || 1,
        chunkIndex: c.chunkIndex || 0,
        section: c.section || "General",
        sourceFileName: c.sourceFileName || doc.originalFileName,
        previewText: c.text.length > 240 ? c.text.substring(0, 240) + "..." : c.text,
        similarity: c.similarity || 0
    }))

    // 8. Save user and assistant messages to database
    await messageModel.create({
        sessionId: session._id,
        documentId: doc._id,
        userId,
        role: "user",
        content: cleanQuestion,
        sources: []
    })

    const assistantMsg = await messageModel.create({
        sessionId: session._id,
        documentId: doc._id,
        userId,
        role: "assistant",
        content: answer,
        sources
    })

    session.lastQuestion = cleanQuestion
    await session.save()

    return {
        answer,
        sources,
        sessionId: session._id,
        messageId: assistantMsg._id
    }
}

module.exports = {
    handleUserQuery,
    GROUNDED_SYSTEM_PROMPT,
    SIMILARITY_THRESHOLD
}
