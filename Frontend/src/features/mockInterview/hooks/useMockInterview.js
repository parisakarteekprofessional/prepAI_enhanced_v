import { useState, useEffect, useCallback, useRef } from "react";
import {
    createSession as apiCreateSession,
    startInterview as apiStartInterview,
    getSessionState as apiGetSessionState,
    submitAnswer as apiSubmitAnswer,
    skipQuestion as apiSkipQuestion,
    endInterview as apiEndInterview,
    getInterviewReport as apiGetInterviewReport,
    getInterviewHistory as apiGetInterviewHistory,
    deleteInterviewSession as apiDeleteInterviewSession,
} from "../services/mockInterview.api";

export const useMockInterview = () => {
    const [session, setSession] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [responses, setResponses] = useState([]);
    const [allQuestions, setAllQuestions] = useState([]);
    const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(999999);
    const [loading, setLoading] = useState(false);
    const [processingAnswer, setProcessingAnswer] = useState(false);
    const [error, setError] = useState(null);
    const [lastEvaluation, setLastEvaluation] = useState(null);
    const timerIntervalRef = useRef(null);

    // Track elapsed time (untimed session)
    useEffect(() => {
        if (session?.status === "IN_PROGRESS") {
            timerIntervalRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }

        return () => clearInterval(timerIntervalRef.current);
    }, [session?.status]);

    const loadSessionState = useCallback(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiGetSessionState(sessionId);
            setSession(data.session);
            setCurrentQuestion(data.currentQuestion);
            setResponses(data.responses || []);
            setAllQuestions(data.allQuestions || []);
            setTotalQuestionsCount(data.totalQuestionsCount || (data.allQuestions ? data.allQuestions.length : 0));
            setRemainingSeconds(data.session.remainingSeconds || 0);
            return data;
        } catch (err) {
            console.error("[useMockInterview] loadSessionState error:", err);
            setError(err.response?.data?.message || "Failed to load session state.");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createAndStart = useCallback(async (config) => {
        setLoading(true);
        setError(null);
        try {
            const createRes = await apiCreateSession(config);
            const sessionId = createRes.session._id;
            const startRes = await apiStartInterview(sessionId);
            setSession(startRes.session);
            setCurrentQuestion(startRes.currentQuestion);
            setResponses(startRes.responses || []);
            setAllQuestions(startRes.allQuestions || []);
            setTotalQuestionsCount(startRes.totalQuestionsCount || (startRes.allQuestions ? startRes.allQuestions.length : 0));
            setRemainingSeconds(startRes.session.remainingSeconds || 900);
            return startRes.session;
        } catch (err) {
            console.error("[useMockInterview] createAndStart error:", err);
            setError(err.response?.data?.message || "Failed to start interview.");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const submitUserAnswer = useCallback(async (sessionId, transcript) => {
        setProcessingAnswer(true);
        setError(null);
        try {
            const res = await apiSubmitAnswer(sessionId, { transcript });
            setLastEvaluation(res.evaluation);

            if (res.isCompleted) {
                setSession(res.session);
                return { isCompleted: true, session: res.session };
            }

            if (res.nextQuestion) {
                setCurrentQuestion(res.nextQuestion);
            }

            // Refresh full state
            await loadSessionState(sessionId);
            return res;
        } catch (err) {
            console.error("[useMockInterview] submitUserAnswer error:", err);
            setError(err.response?.data?.message || "Failed to submit answer.");
            return null;
        } finally {
            setProcessingAnswer(false);
        }
    }, [loadSessionState]);

    const skipCurrentQuestion = useCallback(async (sessionId) => {
        setProcessingAnswer(true);
        setError(null);
        try {
            const res = await apiSkipQuestion(sessionId);
            if (res.isCompleted) {
                setSession(res.session);
                return { isCompleted: true, session: res.session };
            }
            if (res.nextQuestion) {
                setCurrentQuestion(res.nextQuestion);
            }
            await loadSessionState(sessionId);
            return res;
        } catch (err) {
            console.error("[useMockInterview] skipCurrentQuestion error:", err);
            setError(err.response?.data?.message || "Failed to skip question.");
            return null;
        } finally {
            setProcessingAnswer(false);
        }
    }, [loadSessionState]);

    const finishInterview = useCallback(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiEndInterview(sessionId);
            setSession(res.session);
            return res.session;
        } catch (err) {
            console.error("[useMockInterview] finishInterview error:", err);
            setError(err.response?.data?.message || "Failed to end interview.");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchReport = useCallback(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGetInterviewReport(sessionId);
            setSession(res.session);
            setResponses(res.responses || []);
            return res;
        } catch (err) {
            console.error("[useMockInterview] fetchReport error:", err);
            setError(err.response?.data?.message || "Failed to fetch interview report.");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGetInterviewHistory();
            return res.sessions || [];
        } catch (err) {
            console.error("[useMockInterview] fetchHistory error:", err);
            setError(err.response?.data?.message || "Failed to fetch interview history.");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteSession = useCallback(async (sessionId) => {
        try {
            await apiDeleteInterviewSession(sessionId);
            return true;
        } catch (err) {
            console.error("[useMockInterview] deleteSession error:", err);
            return false;
        }
    }, []);

    return {
        session,
        currentQuestion,
        responses,
        allQuestions,
        totalQuestionsCount,
        elapsedSeconds,
        remainingSeconds,
        loading,
        processingAnswer,
        error,
        lastEvaluation,
        loadSessionState,
        createAndStart,
        submitUserAnswer,
        skipCurrentQuestion,
        finishInterview,
        fetchReport,
        fetchHistory,
        deleteSession,
    };
};
