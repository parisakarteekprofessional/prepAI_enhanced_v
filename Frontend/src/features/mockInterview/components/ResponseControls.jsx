import React, { useState } from "react";

export const ResponseControls = ({
    roomState = "YOUR_TURN", // 'AI_SPEAKING' | 'YOUR_TURN' | 'LISTENING' | 'ANSWER_READY' | 'EVALUATING' | 'TEXT_MODE'
    transcript = "",
    interimTranscript = "",
    onStartAnswer,
    onStopAnswer,
    onSubmitAnswer,
    onRetakeAnswer,
    onSkipQuestion,
    isProcessing = false,
}) => {
    const [isTextMode, setIsTextMode] = useState(false);
    const [manualText, setManualText] = useState("");

    const isAiSpeaking = roomState === "AI_SPEAKING";
    const isListening = roomState === "LISTENING";
    const isAnswerReady = roomState === "ANSWER_READY";
    const isEvaluating = isProcessing || roomState === "EVALUATING";

    const activeText = isTextMode ? manualText : transcript;
    const hasContent = activeText.trim().length > 0;

    const handleTextSubmit = () => {
        if (hasContent && !isEvaluating) {
            onSubmitAnswer(manualText.trim());
        }
    };

    const handleVoiceSubmit = () => {
        if (hasContent && !isEvaluating) {
            onSubmitAnswer(transcript.trim());
        }
    };

    return (
        <section className="meet-response-container">
            {/* Live Transcript or Text Input Surface */}
            {isTextMode ? (
                <div className="meet-text-mode-wrap">
                    <textarea
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Type your response here. Walk through your system design, technical decisions, and trade-offs..."
                        className="meet-text-input"
                        rows={3}
                        autoFocus
                    />
                    <div className="meet-text-mode-actions">
                        <button
                            type="button"
                            className="btn-meet-secondary"
                            onClick={() => setIsTextMode(false)}
                            disabled={isEvaluating}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
                            Switch to Voice
                        </button>
                        <button
                            type="button"
                            className="btn-meet-primary"
                            onClick={handleTextSubmit}
                            disabled={!hasContent || isEvaluating}
                        >
                            {isEvaluating ? "Reviewing..." : "Submit Answer →"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Compact Transcript Display - Only surfaces when listening or answer is ready */}
                    {(isListening || isAnswerReady || transcript) && (
                        <div className="meet-transcript-surface">
                            <div className="meet-transcript-header">
                                <div className="transcript-status-tag">
                                    {isListening ? (
                                        <>
                                            <span className="live-mic-radar-dot" />
                                            <span>Listening to your voice...</span>
                                        </>
                                    ) : isAnswerReady ? (
                                        <>
                                            <span className="check-captured-dot">✓</span>
                                            <span>Answer captured</span>
                                        </>
                                    ) : null}
                                </div>

                                {isAnswerReady && (
                                    <div className="transcript-edit-actions">
                                        <button
                                            type="button"
                                            className="btn-subtle-link"
                                            onClick={onStartAnswer}
                                            title="Add more to your answer"
                                        >
                                            + Add more
                                        </button>
                                        <span className="dot-sep">&bull;</span>
                                        <button
                                            type="button"
                                            className="btn-subtle-link"
                                            onClick={onRetakeAnswer}
                                            title="Clear and re-record"
                                        >
                                            Retake
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="meet-transcript-body">
                                <p className="transcript-words">
                                    {transcript}
                                    {interimTranscript && (
                                        <span className="transcript-interim"> {interimTranscript}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Primary Central Conversational Action Bar */}
                    <div className="meet-controls-bar">
                        {/* STATE A: Ready to Speak (or AI Speaking) */}
                        {!isListening && !isAnswerReady && (
                            <div className="controls-group central-flow">
                                <button
                                    type="button"
                                    className="btn-meet-cta-start"
                                    onClick={onStartAnswer}
                                    disabled={isEvaluating}
                                >
                                    <span className="cta-mic-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                                    </span>
                                    <span className="cta-text">
                                        {isAiSpeaking ? "Answer Question Now" : "Start Answer"}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="btn-meet-text-fallback"
                                    onClick={() => setIsTextMode(true)}
                                    disabled={isEvaluating}
                                >
                                    Use text instead
                                </button>
                            </div>
                        )}

                        {/* STATE B: Candidate is Speaking (Listening) */}
                        {isListening && (
                            <div className="controls-group central-flow">
                                <button
                                    type="button"
                                    className="btn-meet-cta-stop"
                                    onClick={onStopAnswer}
                                >
                                    <span className="cta-stop-square" />
                                    <span className="cta-text">Done Speaking</span>
                                </button>
                            </div>
                        )}

                        {/* STATE C: Answer Captured, Candidate Reviews & Submits */}
                        {isAnswerReady && (
                            <div className="controls-group central-flow submit-row">
                                <button
                                    type="button"
                                    className="btn-meet-cta-submit"
                                    onClick={handleVoiceSubmit}
                                    disabled={!hasContent || isEvaluating}
                                >
                                    {isEvaluating ? (
                                        <>
                                            <span className="meet-btn-spinner" />
                                            Reviewing your response...
                                        </>
                                    ) : (
                                        <>
                                            Submit Answer
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Subtle Skip Question Action (Removed from primary CTA row) */}
            {onSkipQuestion && !isEvaluating && (
                <div className="meet-skip-row">
                    <button
                        type="button"
                        className="btn-subtle-skip"
                        onClick={onSkipQuestion}
                        title="Skip this question"
                    >
                        Skip this question
                    </button>
                </div>
            )}
        </section>
    );
};
export default ResponseControls;
