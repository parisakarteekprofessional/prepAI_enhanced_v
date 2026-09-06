import React from "react";

export const AIInterviewer = ({
    state = "IDLE", // 'AI_SPEAKING' | 'YOUR_TURN' | 'LISTENING' | 'ANSWER_READY' | 'EVALUATING' | 'IDLE'
    isSpeaking = false,
    isMuted = false,
    onRepeatAudio,
}) => {
    const getStateLabel = () => {
        switch (state) {
            case "AI_SPEAKING":
                return "AI Interviewer is speaking";
            case "YOUR_TURN":
                return "Your turn • Answer when ready";
            case "LISTENING":
                return "Listening to your answer...";
            case "ANSWER_READY":
                return "Answer captured • Ready to submit";
            case "EVALUATING":
                return "Reviewing your response...";
            case "NEXT_QUESTION":
                return "Preparing next question...";
            default:
                return "Take your time.";
        }
    };

    const isAiSpeaking = isSpeaking || state === "AI_SPEAKING";

    return (
        <div className="meet-ai-stage">
            {/* Visual AI Avatar with Ambient Ring */}
            <div className="meet-avatar-container">
                {/* Outer Breathing Halo */}
                <div className={`meet-avatar-halo ${state.toLowerCase()} ${isAiSpeaking ? "speaking" : ""}`} />
                <div className={`meet-avatar-ring ${state.toLowerCase()} ${isAiSpeaking ? "speaking" : ""}`} />

                {/* Central Gradient Orb */}
                <div className={`meet-avatar-orb ${state.toLowerCase()} ${isAiSpeaking ? "speaking" : ""}`}>
                    {state === "EVALUATING" ? (
                        <div className="meet-avatar-spinner" />
                    ) : (
                        <div className="meet-avatar-core">
                            <span className="meet-avatar-sparkle">✦</span>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Status Text */}
            <div className="meet-ai-status-row">
                <span className={`meet-ai-status-badge ${state.toLowerCase()}`}>
                    {isAiSpeaking && <span className="status-voice-wave-dot" />}
                    {state === "LISTENING" && <span className="status-mic-pulse-dot" />}
                    {getStateLabel()}
                </span>
            </div>

            {/* Audio Waveform underneath avatar */}
            <div className={`meet-waveform-bar-strip ${isAiSpeaking ? "active" : "dormant"}`}>
                <span className="wave-bar bar-1" />
                <span className="wave-bar bar-2" />
                <span className="wave-bar bar-3" />
                <span className="wave-bar bar-4" />
                <span className="wave-bar bar-5" />
                <span className="wave-bar bar-6" />
                <span className="wave-bar bar-7" />
                <span className="wave-bar bar-8" />
                <span className="wave-bar bar-9" />
                <span className="wave-bar bar-10" />
                <span className="wave-bar bar-11" />
                <span className="wave-bar bar-12" />
                <span className="wave-bar bar-13" />
                <span className="wave-bar bar-14" />
            </div>

            {/* Discreet Replay Question Audio shortcut */}
            {onRepeatAudio && !isAiSpeaking && (
                <button
                    type="button"
                    className="btn-replay-subtle"
                    onClick={onRepeatAudio}
                    title="Replay question audio"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                    <span>Replay Question Audio</span>
                </button>
            )}
        </div>
    );
};
export default AIInterviewer;
