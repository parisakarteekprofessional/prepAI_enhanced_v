import React, { useEffect } from "react";

export const WebcamPreview = ({
    videoRef,
    isCameraOn,
    toggleCamera,
    onToggleCamera,
    isMicMuted,
    toggleMicMute,
    startCamera,
    onStartCamera,
    error
}) => {
    const handleStart = startCamera || onStartCamera;
    const handleToggle = toggleCamera || onToggleCamera;

    useEffect(() => {
        if (typeof handleStart === "function") {
            try {
                const res = handleStart();
                if (res && typeof res.catch === "function") {
                    res.catch((err) => console.warn("[WebcamPreview] Camera init error:", err));
                }
            } catch (e) {
                console.warn("[WebcamPreview] Camera execution error:", e);
            }
        }
    }, [handleStart]);

    return (
        <div className="webcam-preview-container">
            <div className="webcam-video-wrap">
                {/* Mirrored Local Video */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`webcam-video ${!isCameraOn ? "is-hidden" : ""}`}
                />

                {!isCameraOn && (
                    <div className="webcam-off-placeholder">
                        <div className="avatar-silhouette">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <p className="webcam-off-text">Camera is turned off</p>
                    </div>
                )}

                {/* Overlaid Badges */}
                <div className="webcam-overlay-top">
                    <span className="webcam-badge candidate-tag">You (Candidate)</span>
                    {isMicMuted && (
                        <span className="webcam-badge mic-muted-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /></svg>
                            Mic Muted
                        </span>
                    )}
                </div>

                {/* Overlaid Quick Controls */}
                <div className="webcam-overlay-bottom">
                    <button
                        type="button"
                        className={`webcam-toggle-btn ${!isCameraOn ? "is-off" : ""}`}
                        onClick={handleToggle}
                        title={isCameraOn ? "Turn camera off" : "Turn camera on"}
                    >
                        {isCameraOn ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 15.5l-5-3.6" /><path d="M23 7v10" /><path d="M16 16v1a2 2 0 0 1-2 2H6m-4-4V7a2 2 0 0 1 2-2h1" /></svg>
                        )}
                        <span>{isCameraOn ? "Cam On" : "Cam Off"}</span>
                    </button>

                    <button
                        type="button"
                        className={`webcam-toggle-btn ${isMicMuted ? "is-off" : ""}`}
                        onClick={toggleMicMute}
                        title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
                    >
                        {isMicMuted ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                        )}
                        <span>{isMicMuted ? "Unmute" : "Mute"}</span>
                    </button>
                </div>
            </div>

            {error && <p className="webcam-error-note">{error}</p>}
        </div>
    );
};
