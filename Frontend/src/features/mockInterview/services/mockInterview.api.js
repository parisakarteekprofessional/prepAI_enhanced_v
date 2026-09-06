import axios from "axios";

const api = axios.create({
    baseURL: "/",
    withCredentials: true,
});

export const createSession = async (payload) => {
    const response = await api.post("/api/mock-interviews/session", payload);
    return response.data;
};

export const startInterview = async (sessionId) => {
    const response = await api.post(`/api/mock-interviews/session/${sessionId}/start`);
    return response.data;
};

export const getSessionState = async (sessionId) => {
    const response = await api.get(`/api/mock-interviews/session/${sessionId}`);
    return response.data;
};

export const submitAnswer = async (sessionId, { transcript, audioDurationSeconds = 0 }) => {
    const response = await api.post(`/api/mock-interviews/session/${sessionId}/answer`, {
        transcript,
        audioDurationSeconds,
    });
    return response.data;
};

export const skipQuestion = async (sessionId) => {
    const response = await api.post(`/api/mock-interviews/session/${sessionId}/skip`);
    return response.data;
};

export const endInterview = async (sessionId) => {
    const response = await api.post(`/api/mock-interviews/session/${sessionId}/end`);
    return response.data;
};

export const getInterviewReport = async (sessionId) => {
    const response = await api.get(`/api/mock-interviews/session/${sessionId}/report`);
    return response.data;
};

export const getInterviewHistory = async (reportId = null) => {
    const url = reportId ? `/api/mock-interviews/history?reportId=${reportId}` : "/api/mock-interviews/history";
    const response = await api.get(url);
    return response.data;
};

export const deleteInterviewSession = async (sessionId) => {
    const response = await api.delete(`/api/mock-interviews/session/${sessionId}`);
    return response.data;
};
