import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AppHeader from "../../interview/components/AppHeader";
import { WebcamPreview } from "../components/WebcamPreview";
import { useWebcam } from "../hooks/useWebcam";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useMockInterview } from "../hooks/useMockInterview";
import { getInterviewReportById } from "../../interview/services/interview.api";
import "../style/mockInterview.scss";

const MockInterviewSetup = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const planId = searchParams.get("planId");

    const [roleTitle, setRoleTitle] = useState("");
    const [targetCompany, setTargetCompany] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [interviewType, setInterviewType] = useState("FULL");
    const [durationMinutes, setDurationMinutes] = useState(15);
    const [planLoadedNote, setPlanLoadedNote] = useState("");

    const { videoRef, isCameraOn, toggleCamera, startCamera, error: cameraError } = useWebcam();
    const { isMicMuted, toggleMicMute } = useSpeechRecognition();
    const { createAndStart, loading, error: interviewError } = useMockInterview();

    useEffect(() => {
        if (planId) {
            getInterviewReportById(planId)
                .then((data) => {
                    if (data?.title) {
                        setRoleTitle(data.title);
                        setPlanLoadedNote(`Connected to Interview Plan: "${data.title}"`);
                    }
                })
                .catch((err) => {
                    console.warn("Could not prefill from plan:", err.message);
                });
        }
    }, [planId]);

    const handleStart = async (e) => {
        e.preventDefault();
        const finalRole = roleTitle.trim() || "Full Stack Software Engineer";

        const session = await createAndStart({
            roleTitle: finalRole,
            targetCompany: targetCompany.trim(),
            difficulty,
            interviewType,
            durationMinutes: Number(durationMinutes) || 15,
            interviewPlanId: planId || null,
        });

        if (session?._id) {
            navigate(`/mock-interview/${session._id}`);
        }
    };

    return (
        <div className="mock-interview-page">
            <AppHeader eyebrow="Pre-flight Check" title="Interview Setup" />

            <div className="setup-container">
                <header style={{ marginBottom: "1.5rem" }}>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
                        Configure Your AI Mock Interview
                    </h1>
                    <p style={{ color: "#94a3b8", margin: 0 }}>
                        Set your target role and check your camera & microphone before starting the live room.
                    </p>
                </header>

                {planLoadedNote && (
                    <div style={{
                        padding: "0.75rem 1.25rem",
                        background: "rgba(236, 72, 153, 0.12)",
                        border: "1px solid rgba(236, 72, 153, 0.3)",
                        borderRadius: "10px",
                        color: "#f472b6",
                        marginBottom: "1.5rem",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem"
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        {planLoadedNote}
                    </div>
                )}

                <div className="setup-card">
                    {/* Left Side: Form Options */}
                    <form className="setup-card__form" onSubmit={handleStart}>
                        <div className="form-group">
                            <label htmlFor="roleTitle">Target Role / Position *</label>
                            <input
                                id="roleTitle"
                                type="text"
                                placeholder="e.g. Senior Frontend Engineer"
                                value={roleTitle}
                                onChange={(e) => setRoleTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="targetCompany">Target Company (Optional)</label>
                            <input
                                id="targetCompany"
                                type="text"
                                placeholder="e.g. Google, Meta, Stripe"
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="difficulty">Interview Difficulty</label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="easy">Easy (Foundational & Basic Problem Solving)</option>
                                <option value="medium">Medium (Standard Industry Level)</option>
                                <option value="hard">Hard (Rigorous Architecture & Complex Edge Cases)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="interviewType">Interview Scope</label>
                            <select
                                id="interviewType"
                                value={interviewType}
                                onChange={(e) => setInterviewType(e.target.value)}
                            >
                                <option value="FULL">Full Comprehensive (Resume + Tech + DSA + Behavioral)</option>
                                <option value="TECHNICAL_ONLY">Technical & Architecture Only</option>
                                <option value="DSA_FOCUSED">DSA & Algorithmic Problem Solving Focused</option>
                                <option value="BEHAVIORAL_ONLY">STAR Behavioral & Leadership Only</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="durationMinutes">Session Duration</label>
                            <select
                                id="durationMinutes"
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            >
                                <option value={10}>10 Minutes (Express Screening)</option>
                                <option value={15}>15 Minutes (Standard Technical Round)</option>
                                <option value={30}>30 Minutes (Deep Architectural & Coding Session)</option>
                            </select>
                        </div>

                        {interviewError && (
                            <p style={{ color: "#f87171", fontSize: "0.85rem", margin: 0 }}>
                                {interviewError}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ marginTop: "0.5rem" }}
                        >
                            {loading ? "Initializing Room..." : "Enter Live Interview Room →"}
                        </button>
                    </form>

                    {/* Right Side: Pre-flight Preview */}
                    <div className="setup-card__preflight">
                        <div>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
                                Hardware Pre-flight Check
                            </h3>
                            <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: "0 0 1rem" }}>
                                Ensure your camera is framed well and your microphone is unmuted.
                            </p>
                        </div>

                        <WebcamPreview
                            videoRef={videoRef}
                            isCameraOn={isCameraOn}
                            toggleCamera={toggleCamera}
                            isMicMuted={isMicMuted}
                            toggleMicMute={toggleMicMute}
                            startCamera={startCamera}
                            error={cameraError}
                        />

                        <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.4 }}>
                            <strong>Privacy Notice:</strong> Your video and voice are processed locally in your browser. No video recordings are stored on any server.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockInterviewSetup;
