const { spawn } = require("child_process")
const path = require("path")

const RAG_PORT = process.env.RAG_PORT || 8001
const RAG_URL = process.env.RAG_ENGINE_URL || `http://127.0.0.1:${RAG_PORT}`

let pythonProcess = null
let startPromise = null

async function checkHealth() {
    try {
        const res = await fetch(`${RAG_URL}/health`, { method: "GET" })
        if (res.ok) {
            const data = await res.json()
            return data.status === "ok"
        }
        return false
    } catch {
        return false
    }
}

async function ensureRagEngineRunning() {
    // If already healthy, proceed immediately
    const isHealthy = await checkHealth()
    if (isHealthy) {
        return true
    }

    // Deduplicate concurrent startup requests
    if (startPromise) {
        return startPromise
    }

    startPromise = (async () => {
        console.log(`[Python Runner] Starting local RAG Engine on port ${RAG_PORT}...`)

        const scriptPath = path.resolve(__dirname, "../../rag_engine/main.py")
        const pythonCmd = process.platform === "win32" ? "python" : "python3"

        pythonProcess = spawn(pythonCmd, [ scriptPath ], {
            cwd: path.resolve(__dirname, "../../.."),
            env: {
                ...process.env,
                RAG_PORT: String(RAG_PORT),
                PYTHONUNBUFFERED: "1"
            },
            stdio: [ "ignore", "pipe", "pipe" ]
        })

        pythonProcess.stdout.on("data", (chunk) => {
            console.log(`[RAG Engine] ${chunk.toString().trim()}`)
        })

        pythonProcess.stderr.on("data", (chunk) => {
            console.error(`[RAG Engine] ${chunk.toString().trim()}`)
        })

        pythonProcess.on("exit", (code, signal) => {
            console.warn(`[Python Runner] RAG Engine exited with code ${code}, signal: ${signal}`)
            pythonProcess = null
            startPromise = null
        })

        // Poll until ready (up to 60 seconds for model loading)
        const startTime = Date.now()
        while (Date.now() - startTime < 60000) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            const ok = await checkHealth()
            if (ok) {
                console.log(`[Python Runner] RAG Engine is healthy and ready at ${RAG_URL}`)
                return true
            }
        }

        throw new Error("Local RAG Engine failed to start within 60 seconds.")
    })()

    try {
        return await startPromise
    } finally {
        startPromise = null
    }
}

function cleanupPythonProcess() {
    if (pythonProcess && !pythonProcess.killed) {
        try {
            if (process.platform === "win32") {
                spawn("taskkill", ["/pid", String(pythonProcess.pid), "/f", "/t"])
            } else {
                pythonProcess.kill("SIGTERM")
            }
        } catch {}
        pythonProcess = null
    }
}

process.on("exit", cleanupPythonProcess)
process.on("SIGINT", () => {
    cleanupPythonProcess()
    process.exit()
})
process.on("SIGTERM", () => {
    cleanupPythonProcess()
    process.exit()
})

module.exports = {
    RAG_URL,
    checkHealth,
    ensureRagEngineRunning
}
