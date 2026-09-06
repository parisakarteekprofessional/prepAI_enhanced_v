/**
 * @description Mistral LLM Provider for PrepAI Study Assistant.
 * Targets mistral-small-latest by default with seamless adaptive fallback
 * to Mistral Free tier models (open-mistral-nemo / open-mistral-7b) when
 * running on Mistral's Free tier mode (where mistral-small has 0 quota).
 */

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
const PRIMARY_MODEL = process.env.MISTRAL_MODEL || "open-mistral-nemo"
const FREE_TIER_FALLBACK_MODEL = "open-mistral-nemo"
let resolvedModel = PRIMARY_MODEL

async function sendMistralRequest({ apiKey, model, payloadMessages, temperature, maxTokens }) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model,
                messages: payloadMessages,
                temperature,
                max_tokens: maxTokens
            }),
            signal: controller.signal
        })

        clearTimeout(timeoutId)
        return response
    } catch (err) {
        clearTimeout(timeoutId)
        if (err.name === "AbortError") {
            throw new Error("AI service request timed out. Please try again.")
        }
        throw new Error(`AI service connection failed: ${err.message}`)
    }
}

async function generateCompletion({ systemPrompt, messages = [], temperature = 0.2, maxTokens = 1200 }) {
    const apiKey = process.env.MISTRAL_API_KEY

    if (!apiKey) {
        throw new Error("AI configuration error. MISTRAL_API_KEY is not configured on the server.")
    }

    const payloadMessages = []

    if (systemPrompt) {
        payloadMessages.push({
            role: "system",
            content: systemPrompt
        })
    }

    // Append conversation history & current user message
    for (const msg of messages) {
        if (msg.role && msg.content) {
            payloadMessages.push({
                role: msg.role === "assistant" ? "assistant" : "user",
                content: msg.content
            })
        }
    }

    let activeModel = resolvedModel
    let response = await sendMistralRequest({
        apiKey,
        model: activeModel,
        payloadMessages,
        temperature,
        maxTokens
    })

    // Adaptive Free Tier Fallback:
    // On Mistral's Free Tier, mistral-small has a 0 req/min limit (x-ratelimit-limit-req-minute: 0).
    // If detected, seamlessly retry with Mistral's official free tier model open-mistral-nemo (188 req/min).
    if (response.status === 429 && activeModel !== FREE_TIER_FALLBACK_MODEL) {
        const rateLimitHeader = response.headers.get("x-ratelimit-limit-req-minute")
        if (rateLimitHeader === "0" || !rateLimitHeader) {
            console.warn(
                `[Mistral Provider] Model '${activeModel}' has 0 quota on this key (Free tier mode). Seamlessly falling back to '${FREE_TIER_FALLBACK_MODEL}'...`
            )
            resolvedModel = FREE_TIER_FALLBACK_MODEL
            activeModel = resolvedModel
            response = await sendMistralRequest({
                apiKey,
                model: activeModel,
                payloadMessages,
                temperature,
                maxTokens
            })
        }
    }

    if (!response.ok) {
        const status = response.status
        let errBody = ""
        try {
            errBody = await response.text()
        } catch {
            errBody = ""
        }

        console.error(`[Mistral Provider] HTTP ${status} error on model ${activeModel}:`, errBody)

        if (status === 401) {
            throw new Error("AI configuration error. Please ensure MISTRAL_API_KEY is valid.")
        } else if (status === 429) {
            throw new Error("PrepAI is temporarily rate limited. Please try again shortly.")
        } else if (status === 402) {
            throw new Error("AI service usage is unavailable for the current account.")
        } else {
            throw new Error(`AI service returned error (HTTP ${status}). Please try again shortly.`)
        }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("AI service returned an empty response.")
    }

    return {
        content: content.trim(),
        model: activeModel,
        usage: data.usage || null
    }
}

module.exports = {
    generateCompletion,
    PRIMARY_MODEL,
    FREE_TIER_FALLBACK_MODEL
}
