import React from "react";

export const AvatarWaveform = ({ state = "IDLE", isMuted = false }) => {
    // state: 'AI_SPEAKING' | 'LISTENING' | 'PROCESSING' | 'IDLE'

    const getStatusText = () => {
        if (state === "AI_SPEAKING") return "AI Speaking...";
        if (state === "LISTENING") return "Listening to your answer...";
        if (state === "PROCESSING") return "Analyzing response...";
        return "Interviewer Ready";
    };

    const getStatusColor = () => {
        if (state === "AI_SPEAKING") return "status--speaking";
        if (state === "LISTENING") return "status--listening";
        if (state === "PROCESSING") return "status--processing";
        return "status--idle";
    };

    return (
        <div className="avatar-waveform-card">
            <div className="avatar-waveform-visual">
                {/* Outer concentric pulsing rings */}
                <div className={`avatar-ring ring-3 ${state.toLowerCase()}`} />
                <div className={`avatar-ring ring-2 ${state.toLowerCase()}`} />
                <div className={`avatar-ring ring-1 ${state.toLowerCase()}`} />

                {/* Core Avatar Sphere */}
                <div className={`avatar-core ${state.toLowerCase()}`}>
                    {state === "PROCESSING" ? (
                        <div className="avatar-spinner" />
                    ) : (
                        <div className="avatar-bars">
                            <span className="wave-bar bar-1" />
                            <span className="wave-bar bar-2" />
                            <span className="wave-bar bar-3" />
                            <span className="wave-bar bar-4" />
                            <span className="wave-bar bar-5" />
                        </div>
                    )}
                </div>
            </div>

            <div className="avatar-waveform-info">
                <span className={`avatar-status-pill ${getStatusColor()}`}>
                    <span className="status-dot" />
                    {getStatusText()}
                </span>
                {isMuted && <span className="avatar-muted-pill">Voice Muted</span>}
            </div>
        </div>
    );
};
