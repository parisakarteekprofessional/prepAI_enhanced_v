import axios from "axios"

const api = axios.create({
    baseURL: "/",
    withCredentials: true
})

export async function getDsaDashboard() {
    const response = await api.get("/api/dsa/dashboard")
    return response.data
}

export async function getDsaProgress() {
    const response = await api.get("/api/dsa/progress")
    return response.data
}

export async function updateDsaProgress({ questionId, status, solved }) {
    const response = await api.patch("/api/dsa/progress", {
        questionId,
        status,
        solved
    })

    return response.data
}

export async function saveDsaNote({ questionId, note }) {
    const response = await api.post("/api/dsa/notes", {
        questionId,
        note
    })

    return response.data
}
