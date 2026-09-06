import React, { useEffect } from "react";

export const CandidateVideo = ({
    videoRef,
    isCameraOn,
    toggleCamera,
    startCamera,
    isMicMuted,
    toggleMicMute,
    error,
}) => {
    useEffect(() => {
        if (typeof startCamera === "function") {
            try {
                const res = startCamera();
                if (res && typeof res.catch === "function") {
                    res.catch((err) => console.warn("[CandidateVideo] Init error:", err));
                }
            } catch (e) {
                console.warn("[CandidateVideo] Start error:", e);
            }
        }
    }, [startCamera]);

    return (
        <div className="meet-candidate-tile">
            <div className="meet-candidate-video-wrap">
                {/* Live mirrored video stream */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`meet-camera-stream ${!isCameraOn ? "is-hidden" : ""}`}
                />

                {/* Friendly off placeholder (clean participant card) */}
                {!isCameraOn && (
                    <div className="meet-camera-off-card">
                        <div className="candidate-initial-circle">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <span className="camera-off-tag">Camera is off</span>
                    </div>
                )}

                {/* Overlaid Badges: Participant Identifier */}
                <div className="meet-video-overlay-top">
                    <span className="meet-participant-badge">
                        You {isCameraOn ? "" : "• Camera Off"}
                    </span>
                    {isMicMuted && (
                        <span className="meet-mic-muted-badge">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /></svg>
                            Mic Muted
                        </span>
                    )}
                </div>

                {/* Floating Bottom Quick Controls */}
                <div className="meet-video-overlay-bottom">
                    <button
                        type="button"
                        className={`meet-cam-toggle-btn ${!isCameraOn ? "off" : ""}`}
                        onClick={toggleCamera}
                        title={isCameraOn ? "Turn camera off" : "Turn camera on"}
                    >
                        {isCameraOn ? (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                <span>Cam On</span>
                            </>
                        ) : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 15.5l-5-3.6" /><path d="M23 7v10" /><path d="M16 16v1a2 2 0 0 1-2 2H6m-4-4V7a2 2 0 0 1 2-2h1" /></svg>
                                <span>Cam Off</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className={`meet-cam-toggle-btn ${isMicMuted ? "off" : ""}`}
                        onClick={toggleMicMute}
                        title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
                    >
                        {isMicMuted ? (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /></svg>
                                <span>Mic Muted</span>
                            </>
                        ) : (
                            <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                <span>Mic On</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && <p className="meet-cam-error">{error}</p>}
        </div>
    );
};
export default CandidateVideo;
