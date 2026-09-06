import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router";
import { useWebcam } from "../hooks/useWebcam";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useMockInterview } from "../hooks/useMockInterview";
import "../style/mockInterview.scss";

const MockInterviewRoom = () => {
    const { sessionId: routeSessionId, reportId: routeReportId } = useParams();
    const [searchParams] = useSearchParams();
    const queryReportId = searchParams.get("reportId");
    const querySessionId = searchParams.get("sessionId");

    // Strictly prioritize reportId to guarantee verbatim questions match the interview report
    const activeReportId = queryReportId || (routeReportId && routeReportId !== "live" ? routeReportId : null);
    const activeSessionId = querySessionId || routeSessionId;

    const navigate = useNavigate();

    const {
        session,
        currentQuestion,
        allQuestions,
        totalQuestionsCount,
        processingAnswer,
        loading,
        error: interviewError,
        loadSessionState,
        createAndStart,
        submitUserAnswer,
        skipCurrentQuestion,
        finishInterview,
    } = useMockInterview();

    const { videoRef, isCameraOn, toggleCamera, startCamera, error: cameraError } = useWebcam();

    // Auto-start camera on component mount
    useEffect(() => {
        startCamera();
    }, [startCamera]);
    const {
        isListening,
        transcript,
        interimTranscript,
        isMicMuted,
        startListening,
        stopListening,
        resetTranscript,
        toggleMicMute,
    } = useSpeechRecognition();

    const { isSpeaking, isMuted: isAiMuted, speak, stopSpeaking, toggleMute: toggleAiMute } = useSpeechSynthesis();

    // Mode: 'VOICE' | 'TEXT'
    const [inputMode, setInputMode] = useState("VOICE");
    const [manualText, setManualText] = useState("");
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);

    // Answer state: 'IDLE' | 'SPEAKING' | 'CAPTURED' | 'EVALUATING'
    const [answerState, setAnswerState] = useState("IDLE");

    const initializedRef = useRef(false);
    const lastSpokenQuestionIdRef = useRef(null);
    const optionsRef = useRef(null);

    // Close more options dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (optionsRef.current && !optionsRef.current.contains(e.target)) {
                setShowMoreOptions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 1. Initialize session strictly from reportId or existing sessionId
    useEffect(() => {
        if (initializedRef.current) return;

        if (activeReportId) {
            initializedRef.current = true;
            createAndStart({ interviewReportId: activeReportId }).then((sess) => {
                if (sess?._id) {
                    navigate(`/mock-interview/live?reportId=${activeReportId}&sessionId=${sess._id}`, { replace: true });
                }
            });
        } else if (activeSessionId) {
            initializedRef.current = true;
            loadSessionState(activeSessionId);
        }
    }, [activeReportId, activeSessionId, createAndStart, loadSessionState, navigate]);

    // 2. Question Speech & State Management (Verbatim AI speech)
    useEffect(() => {
        if (currentQuestion && currentQuestion._id !== lastSpokenQuestionIdRef.current) {
            lastSpokenQuestionIdRef.current = currentQuestion._id;
            resetTranscript();
            setManualText("");
            stopListening();
            setAnswerState("IDLE");

            // AI automatically speaks the question verbatim
            speak(currentQuestion.questionText, () => {
                // Auto-start listening once question finishes speaking
                startListening();
                setAnswerState("SPEAKING");
            });
        }
    }, [currentQuestion, speak, resetTranscript, stopListening]);

    // Handle Enter key to stop answering when listening in Voice mode
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Enter" && isListening && inputMode === "VOICE") {
                e.preventDefault();
                handleStopAnswering();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isListening, inputMode]);

    const targetReportId = activeReportId || session?.interviewReportId;

    // 3. Start Answering Handler
    const handleStartAnswering = () => {
        stopSpeaking();
        startListening();
        setAnswerState("SPEAKING");
    };

    // 4. Stop Answering Handler
    const handleStopAnswering = () => {
        stopListening();
        setAnswerState("CAPTURED");
    };

    // 5. Submit Handler (Evaluates and redirects on completion)
    const handleSubmit = async () => {
        const finalAnswer = (inputMode === "TEXT" ? manualText : transcript).trim();
        if (!finalAnswer) return;

        stopListening();
        stopSpeaking();
        setAnswerState("EVALUATING");

        const currentSessId = session?._id || activeSessionId;
        const result = await submitUserAnswer(currentSessId, finalAnswer);
        if (result?.isCompleted) {
            navigate(`/interview/${targetReportId}?tab=live-interview`, { replace: true });
        }
    };

    // 6. Skip Handler
    const handleSkip = async () => {
        setShowMoreOptions(false);
        stopListening();
        stopSpeaking();
        setAnswerState("EVALUATING");

        const currentSessId = session?._id || activeSessionId;
        const result = await skipCurrentQuestion(currentSessId);
        if (result?.isCompleted) {
            navigate(`/interview/${targetReportId}?tab=live-interview`, { replace: true });
        }
    };

    // 7. End Early Handler
    const handleConfirmEnd = async () => {
        stopListening();
        stopSpeaking();
        setShowEndModal(false);
        const currentSessId = session?._id || activeSessionId;
        await finishInterview(currentSessId);
        navigate(`/interview/${targetReportId}?tab=live-interview`, { replace: true });
    };

    // 8. Replay Question Audio
    const handleRepeatAudio = () => {
        if (currentQuestion?.questionText) {
            stopListening();
            setAnswerState("IDLE");
            speak(currentQuestion.questionText);
        }
    };

    // Question numbering and stage metadata
    const totalQ = totalQuestionsCount || session?.totalQuestions || (allQuestions ? allQuestions.length : 9);
    const currentQOrder = currentQuestion?.order || (session?.currentQuestionIndex !== undefined ? session.currentQuestionIndex + 1 : 1);
    const currentStage = currentQuestion?.stage || session?.currentStage || "TECHNICAL";

    const getStageName = (st) => {
        switch (st) {
            case "TECHNICAL": return "Technical Round";
            case "BEHAVIORAL": return "Behavioral Round";
            case "DSA": return "DSA Round";
            case "FINAL": return "Closing Round";
            default: return "Assessment Round";
        }
    };

    const getRoundTag = () => {
        if (currentQuestion?.isFollowUp) return "FOLLOW-UP";
        if (currentStage === "DSA") return "DSA ROUND";
        if (currentStage === "BEHAVIORAL") return "BEHAVIORAL ROUND";
        if (currentStage === "FINAL") return "CLOSING ROUND";
        return "TECHNICAL ROUND";
    };

    const getSourceTag = () => {
        if (currentQuestion?.isFollowUp) return "AI Follow-up";
        if (currentStage === "DSA" && currentQuestion?.dsaProblemTitle) {
            return `Previously Solved: ${currentQuestion.dsaProblemTitle}`;
        }
        return "From Interview Report";
    };

    // Progress dots (9 dots)
    const dotsCount = Math.max(1, Math.min(12, totalQ));
    const dots = Array.from({ length: dotsCount }, (_, i) => {
        const qNum = i + 1;
        const isCurrent = qNum === currentQOrder;
        const isPassed = qNum < currentQOrder;
        return (
            <span
                key={i}
                className={`progress-dot ${isCurrent ? "current" : ""} ${isPassed ? "completed" : ""}`}
            />
        );
    });

    const activeAnswer = inputMode === "TEXT" ? manualText : transcript;
    const hasAnswer = activeAnswer.trim().length > 0;
    const isEvaluating = processingAnswer || answerState === "EVALUATING";

    // GUARD: Only accessed via Interview Report
    if (!activeReportId && !activeSessionId) {
        return (
            <div className="prepai-interview-screen">
                <header className="screen-header">
                    <div className="brand-group">
                        <div className="brand-logo-icon">✦</div>
                        <span className="brand-name">PrepAI</span>
                    </div>
                    <Link to="/app" className="btn-end-interview" style={{ textDecoration: "none" }}>
                        Back to Planner
                    </Link>
                </header>
                <div className="screen-guard-card">
                    <h2>Accessed Via Interview Report Only</h2>
                    <p>
                        The Live AI Mock Interview can only be launched from an existing Interview Report. Please open your interview plan in the Interview Planner and select <strong>"Take Live AI Interview"</strong>.
                    </p>
                    <Link to="/app" className="btn-start-answering" style={{ textDecoration: "none", display: "inline-flex" }}>
                        Go to Interview Planner
                    </Link>
                </div>
            </div>
        );
    }

    if (loading && !session) {
        return (
            <div className="prepai-interview-screen">
                <header className="screen-header">
                    <div className="brand-group">
                        <div className="brand-logo-icon">✦</div>
                        <span className="brand-name">PrepAI</span>
                    </div>
                </header>
                <div className="screen-loading-stage">
                    <div className="screen-spinner" />
                    <h2>Preparing your interview room...</h2>
                    <p>Loading exact questions from your Interview Report & solved DSA problems...</p>
                </div>
            </div>
        );
    }

    if (interviewError && !session) {
        return (
            <div className="prepai-interview-screen">
                <header className="screen-header">
                    <div className="brand-group">
                        <div className="brand-logo-icon">✦</div>
                        <span className="brand-name">PrepAI</span>
                    </div>
                </header>
                <div className="screen-guard-card" style={{ borderColor: "rgba(239, 68, 68, 0.35)" }}>
                    <h2 style={{ color: "#f87171" }}>Could Not Connect to Interview Room</h2>
                    <p>{interviewError}</p>
                    <Link to={targetReportId ? `/interview/${targetReportId}` : "/app"} className="btn-start-answering" style={{ textDecoration: "none", display: "inline-flex" }}>
                        Return to Interview Report
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="prepai-interview-screen">
            {/* ── TOP HEADER ── */}
            <header className="screen-header">
                {/* Left: Logo & Role */}
                <div className="header-left">
                    <div className="brand-group">
                        <div className="brand-logo-icon">✦</div>
                        <span className="brand-name">PrepAI</span>
                    </div>

                    <div className="live-ai-badge">
                        <span className="live-dot" />
                        LIVE AI INTERVIEW
                    </div>

                    <div className="role-title-text">
                        {session?.roleTitle || "Software Engineer"}
                    </div>
                </div>

                {/* Center: Question Progress */}
                <div className="header-center">
                    <span className="q-progress-count">
                        Question <strong>{currentQOrder}</strong> of {totalQ}
                    </span>
                    <div className="q-dots-strip">{dots}</div>
                    <span className="round-badge-pill">{getStageName(currentStage)}</span>
                </div>

                {/* Right: Audio Toggle & End Interview */}
                <div className="header-right">
                    <button
                        type="button"
                        className={`btn-voice-toggle ${isAiMuted ? "muted" : ""}`}
                        onClick={toggleAiMute}
                    >
                        {isAiMuted ? (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /></svg>
                                <span>Voice: Off</span>
                            </>
                        ) : (
                            <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                                <span>Voice: On</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn-end-interview"
                        onClick={() => setShowEndModal(true)}
                    >
                        End Interview
                    </button>
                </div>
            </header>

            {/* ── TWO-COLUMN MAIN BODY ── */}
            <main className="screen-main-grid">
                {/* ── LEFT COLUMN (AI Interviewer + Candidate Video) ── */}
                <aside className="left-column">
                    {/* Card 1: AI Interviewer */}
                    <div className="ai-interviewer-card">
                        <div className="card-top-row">
                            <div className="interviewer-title">
                                <span className="sparkle-blue">✦</span>
                                <span>AI Interviewer</span>
                            </div>

                            <div className={`speaking-status-pill ${isSpeaking ? "is-speaking" : isListening ? "is-listening" : "is-ready"}`}>
                                <div className="mini-bars-wave">
                                    <span /><span /><span />
                                </div>
                                <span>
                                    {isSpeaking ? "Speaking..." : isListening ? "Listening..." : isEvaluating ? "Reviewing..." : "Ready"}
                                </span>
                            </div>
                        </div>

                        {/* Large Orb Avatar with Radial Aura */}
                        <div className="avatar-orb-wrapper">
                            <div className={`avatar-orb-outer-ring ${isSpeaking ? "pulse" : isListening ? "cyan-pulse" : ""}`}>
                                <div className={`avatar-orb-core ${isSpeaking ? "speaking" : isListening ? "listening" : ""}`}>
                                    <span className="orb-star">✦</span>
                                </div>
                            </div>
                        </div>

                        {/* 24-Bar Audio Waveform */}
                        <div className={`waveform-strip ${isSpeaking ? "active" : "dormant"}`}>
                            {Array.from({ length: 24 }).map((_, idx) => (
                                <span key={idx} className={`wf-bar bar-${(idx % 12) + 1}`} />
                            ))}
                        </div>

                        {/* Quote bubble pill at bottom */}
                        <div className="ai-quote-pill">
                            <span>
                                {isSpeaking
                                    ? `"${currentQuestion?.questionText?.slice(0, 42)}..."`
                                    : isListening
                                    ? '"Let me ask you a question..."'
                                    : isEvaluating
                                    ? '"Evaluating technical response..."'
                                    : '"Let me ask you a question..."'}
                            </span>
                        </div>
                    </div>

                    {/* Card 2: You (Candidate) Video Card */}
                    <div className="candidate-video-card">
                        <div className="card-top-row">
                            <div className="candidate-title">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                <span>You (Candidate)</span>
                            </div>

                            <div className="camera-status-tag">
                                <span className={`status-dot ${isCameraOn ? "green" : "gray"}`} />
                                <span>{isCameraOn ? "Camera On" : "Camera Off"}</span>
                            </div>
                        </div>

                        {/* Video / Webcam Preview with Overlay Action Buttons */}
                        <div className="video-viewport-wrap">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`candidate-video-feed ${!isCameraOn ? "hidden" : ""}`}
                            />

                            {!isCameraOn && (
                                <div className="candidate-off-fallback">
                                    <div className="avatar-silhouette-box">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </div>
                                    <span className="fallback-label">Camera is turned off</span>
                                </div>
                            )}

                            {/* Floating Glass Round Controls over Candidate Video */}
                            <div className="video-floating-toggles">
                                <button
                                    type="button"
                                    className={`round-video-toggle ${!isCameraOn ? "disabled" : ""}`}
                                    onClick={toggleCamera}
                                    title={isCameraOn ? "Turn camera off" : "Turn camera on"}
                                >
                                    {isCameraOn ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 15.5l-5-3.6" /><path d="M23 7v10" /><path d="M16 16v1a2 2 0 0 1-2 2H6m-4-4V7a2 2 0 0 1 2-2h1" /></svg>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    className={`round-video-toggle ${isMicMuted ? "disabled" : ""}`}
                                    onClick={toggleMicMute}
                                    title={isMicMuted ? "Unmute mic" : "Mute mic"}
                                >
                                    {isMicMuted ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── RIGHT COLUMN (Question Card + Answer/Controls Card) ── */}
                <section className="right-column">
                    {/* Card 1: Question Card */}
                    <div className="interview-question-card">
                        <div className="question-header-row">
                            <div className="tags-cluster">
                                <span className="tag-round-pink">
                                    {getRoundTag()}
                                </span>
                                <span className="tag-source-dark">
                                    {getSourceTag()}
                                </span>
                            </div>

                            <button
                                type="button"
                                className="btn-replay-audio-pill"
                                onClick={handleRepeatAudio}
                                title="Replay question speech"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                                <span>Replay Question Audio</span>
                            </button>
                        </div>

                        <h1 className="question-main-text">
                            {currentQuestion ? currentQuestion.questionText : "Loading question from interview report..."}
                        </h1>

                        <p className="question-sub-hint">
                            Take your time. Answer when you're ready. There is no time limit.
                        </p>
                    </div>

                    {/* Card 2: Candidate Answer & Interaction Console */}
                    <div className="interview-answer-card">
                        {/* Top Tab Bar: Voice Answer / Use Text Instead */}
                        <div className="answer-tabs-row">
                            <div className="tabs-left">
                                <button
                                    type="button"
                                    className={`tab-button ${inputMode === "VOICE" ? "active" : ""}`}
                                    onClick={() => setInputMode("VOICE")}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                    Voice Answer
                                </button>
                                <button
                                    type="button"
                                    className={`tab-button ${inputMode === "TEXT" ? "active" : ""}`}
                                    onClick={() => setInputMode("TEXT")}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                    Use Text Instead
                                </button>
                            </div>

                            <div className="tabs-right-status">
                                {isListening ? (
                                    <div className="listening-indicator">
                                        <span className="pulsing-red-dot" />
                                        <span>Listening...</span>
                                    </div>
                                ) : isEvaluating ? (
                                    <div className="evaluating-indicator">
                                        <span className="pulsing-amber-dot" />
                                        <span>Reviewing...</span>
                                    </div>
                                ) : (
                                    <div className="idle-indicator">
                                        <span className="dot" />
                                        <span>Ready</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Live Transcription Canvas / Text Fallback Area */}
                        <div className="response-canvas-body">
                            {inputMode === "TEXT" ? (
                                <textarea
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    placeholder="Type your response here. Explain your architecture, algorithms, and trade-offs in detail..."
                                    className="text-mode-textarea"
                                    rows={5}
                                    autoFocus
                                />
                            ) : (
                                <div className="voice-canvas-inner">
                                    <div className="speaker-tag-col">
                                        <span className="speaker-name">You</span>
                                        <div className={`speaker-dots ${isListening ? "animating" : ""}`}>
                                            <span /><span /><span /><span /><span />
                                        </div>
                                    </div>

                                    <div className="transcript-content-col">
                                        {transcript || interimTranscript ? (
                                            <p className="realtime-text">
                                                {transcript}
                                                <span className="interim-highlight"> {interimTranscript}</span>
                                                {isListening && <span className="blinking-cursor">|</span>}
                                            </p>
                                        ) : (
                                            <p className="transcript-placeholder">
                                                {isListening
                                                    ? "Listening to your voice... Speak clearly into your microphone."
                                                    : "Click 'Start Answering' below to speak your response. Your words will transcribe in real-time."}
                                                {isListening && <span className="blinking-cursor">|</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Central Start / Stop Answering Button */}
                            <div className="center-action-row">
                                {isListening ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn-stop-answering"
                                            onClick={handleStopAnswering}
                                        >
                                            <span className="stop-square" />
                                            Stop Answering
                                        </button>
                                        <span className="keyboard-hint">Press Enter to stop</span>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-start-answering"
                                        onClick={handleStartAnswering}
                                        disabled={isEvaluating}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                        <span>{hasAnswer ? "Continue Speaking" : "Start Answering"}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="answer-bottom-bar">
                            {/* Left toggles: Mic On, Camera On, More Options */}
                            <div className="bottom-left-toggles">
                                <button
                                    type="button"
                                    className={`btn-pill-toggle ${isMicMuted ? "disabled" : ""}`}
                                    onClick={toggleMicMute}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                    <span>{isMicMuted ? "Mic Muted" : "Mic On"}</span>
                                    {!isMicMuted && <span className="double-green-dots"><span /><span /></span>}
                                </button>

                                <button
                                    type="button"
                                    className={`btn-pill-toggle ${!isCameraOn ? "disabled" : ""}`}
                                    onClick={toggleCamera}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                    <span>{isCameraOn ? "Camera On" : "Camera Off"}</span>
                                    {isCameraOn && <span className="double-green-dots"><span /><span /></span>}
                                </button>

                                <div className="options-dropdown-wrap" ref={optionsRef}>
                                    <button
                                        type="button"
                                        className="btn-pill-toggle"
                                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                        <span>More Options</span>
                                    </button>

                                    {showMoreOptions && (
                                        <div className="options-popover-menu">
                                            <button
                                                type="button"
                                                className="menu-item-skip"
                                                onClick={handleSkip}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" /></svg>
                                                Skip this question
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Submit Answer & Next Button */}
                            <div className="bottom-right-submit">
                                <button
                                    type="button"
                                    className="btn-submit-answer"
                                    onClick={handleSubmit}
                                    disabled={!hasAnswer || isEvaluating}
                                >
                                    {isEvaluating ? (
                                        <>
                                            <span className="submit-spinner" />
                                            Evaluating...
                                        </>
                                    ) : (
                                        <>
                                            Submit Answer & Next
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── END INTERVIEW CONFIRMATION MODAL ── */}
            {showEndModal && (
                <div className="modal-backdrop-dark" onClick={() => setShowEndModal(false)}>
                    <div className="modal-card-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-alert-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                        </div>
                        <h3>End Interview?</h3>
                        <p>
                            Are you sure you want to conclude the interview now? Your completed answers will be evaluated, and your interview scores will be saved directly to your <strong>Interview Report</strong>.
                        </p>
                        <div className="modal-btn-row">
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setShowEndModal(false)}
                            >
                                Continue Interview
                            </button>
                            <button
                                type="button"
                                className="btn-modal-confirm"
                                onClick={handleConfirmEnd}
                            >
                                End Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockInterviewRoom;
