import React from "react";

export const InterviewTopBar = ({
    roleTitle = "Software Engineer",
    targetCompany,
    currentQuestionIndex = 1,
    totalQuestions = 9,
    stage = "TECHNICAL",
    isAiMuted = false,
    onToggleAiMute,
    onEndInterview,
}) => {
    const getStageName = (st) => {
        switch (st) {
            case "TECHNICAL": return "Technical Round";
            case "BEHAVIORAL": return "Behavioral Round";
            case "DSA": return "DSA Round";
            case "FINAL": return "Closing Round";
            default: return "Interview Round";
        }
    };

    // Render subtle progress dots
    const dotsCount = Math.max(1, Math.min(12, totalQuestions));
    const dots = Array.from({ length: dotsCount }, (_, i) => {
        const qNum = i + 1;
        const isCurrent = qNum === currentQuestionIndex;
        const isPassed = qNum < currentQuestionIndex;
        return (
            <span
                key={i}
                className={`meet-progress-dot ${isCurrent ? "active" : ""} ${isPassed ? "completed" : ""}`}
                title={`Question ${qNum}`}
            />
        );
    });

    return (
        <header className="meet-topbar">
            {/* Left: Branding & Role */}
            <div className="meet-topbar__left">
                <div className="meet-live-badge">
                    <span className="live-pulsing-dot" />
                    <span className="live-badge-text">LIVE AI INTERVIEW</span>
                </div>
                <div className="meet-role-tag">
                    <span className="meet-role-name">{roleTitle}</span>
                    {targetCompany && (
                        <span className="meet-company-pill">{targetCompany}</span>
                    )}
                </div>
            </div>

            {/* Center: Question Progress & Dots (NO countdown timer) */}
            <div className="meet-topbar__center">
                <div className="meet-progress-display">
                    <span className="meet-q-counter">
                        Question <strong>{currentQuestionIndex}</strong> of {totalQuestions}
                    </span>
                    <span className="meet-dots-strip">{dots}</span>
                    <span className="meet-stage-pill">{getStageName(stage)}</span>
                </div>
            </div>

            {/* Right: Audio Toggle & End Interview */}
            <div className="meet-topbar__right">
                <button
                    type="button"
                    className={`btn-meet-icon-toggle ${isAiMuted ? "muted" : ""}`}
                    onClick={onToggleAiMute}
                    title={isAiMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                >
                    {isAiMuted ? (
                        <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /></svg>
                            <span>Voice: Off</span>
                        </>
                    ) : (
                        <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                            <span>Voice: On</span>
                        </>
                    )}
                </button>

                <button
                    type="button"
                    className="btn-meet-exit"
                    onClick={onEndInterview}
                    title="Conclude interview early"
                >
                    End Interview
                </button>
            </div>
        </header>
    );
};
export default InterviewTopBar;
