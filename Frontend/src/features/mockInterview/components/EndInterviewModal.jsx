import React from "react";

export const EndInterviewModal = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className="meet-modal-backdrop" onClick={onClose}>
            <div className="meet-modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="meet-modal-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <h3>End Interview?</h3>
                <p>
                    Your completed answers will be evaluated, and your interview scores will be saved directly to your <strong>Interview Report</strong>.
                </p>
                <div className="meet-modal-actions">
                    <button
                        type="button"
                        className="btn-meet-modal-cancel"
                        onClick={onClose}
                    >
                        Continue Interview
                    </button>
                    <button
                        type="button"
                        className="btn-meet-modal-confirm"
                        onClick={onConfirm}
                    >
                        End Interview
                    </button>
                </div>
            </div>
        </div>
    );
};
export default EndInterviewModal;
