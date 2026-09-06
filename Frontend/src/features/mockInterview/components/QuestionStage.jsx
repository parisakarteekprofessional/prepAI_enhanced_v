import React from "react";

export const QuestionStage = ({
    question,
    stage = "TECHNICAL",
    dsaProblemIndex = 1,
    totalDsaProblems = 2,
}) => {
    if (!question) {
        return (
            <div className="meet-question-stage">
                <p className="meet-q-loading">Preparing next interview question...</p>
            </div>
        );
    }

    const isDsa = question.category === "DSA" || stage === "DSA";
    const isFollowUp = question.isFollowUp;

    const getRoundLabel = () => {
        if (isFollowUp) return "FOLLOW-UP QUESTION";
        if (isDsa) return `DSA ROUND • Problem ${dsaProblemIndex} of ${totalDsaProblems}`;
        if (stage === "TECHNICAL") return "TECHNICAL ROUND";
        if (stage === "BEHAVIORAL") return "BEHAVIORAL ROUND";
        if (stage === "FINAL") return "CLOSING ROUND";
        return "ASSESSMENT QUESTION";
    };

    const getSourceLabel = () => {
        if (isFollowUp) return "AI Follow-up";
        if (isDsa) return question.dsaProblemTitle ? `Previously Solved: ${question.dsaProblemTitle}` : "Previously Solved Problem";
        return "From Interview Report";
    };

    return (
        <section className="meet-question-stage">
            {/* Meta Tags: Round & Source */}
            <div className="meet-q-meta-row">
                <span className={`meet-round-badge ${isDsa ? "dsa" : ""} ${isFollowUp ? "followup" : ""}`}>
                    {getRoundLabel()}
                </span>
                <span className="meet-source-badge">
                    {getSourceLabel()}
                </span>
            </div>

            {/* Verbatim Question Text - Dominant Typography */}
            <h1 className="meet-q-headline">
                {question.questionText}
            </h1>

            {/* Subtle Calm Helper Text */}
            <p className="meet-q-helper-text">
                Take your time. Answer when you're ready.
            </p>
        </section>
    );
};
export default QuestionStage;
