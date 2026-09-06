/**
 * @description Deterministic weighted scoring service for Live AI Mock Interview.
 * Formula: overallScore = round(technical * 0.25 + dsa * 0.25 + problemSolving * 0.20 + communication * 0.15 + behavioral * 0.15)
 */
function computeDeterministicScores(responses = []) {
    if (!responses || responses.length === 0) {
        return {
            overall: 50,
            technical: 50,
            behavioral: 50,
            dsa: 50,
            problemSolving: 50,
            communication: 50,
            hiringRecommendation: "LEANING_NO_HIRE"
        };
    }

    const technicalValues = [];
    const behavioralValues = [];
    const dsaValues = [];
    const problemSolvingValues = [];
    const communicationValues = [];

    for (const r of responses) {
        const ev = r.evaluation || {};
        const cat = r.question?.category || "TECHNICAL";

        const correctness = Number(ev.correctness || ev.score || ev.correctnessScore) || 5;
        const depth = Number(ev.technicalDepth || ev.depthScore) || 5;
        const ps = Number(ev.problemSolving) || correctness;
        const comm = Number(ev.communication || ev.communicationScore) || 6;

        communicationValues.push(comm);

        if (cat === "DSA") {
            const timeComp = Number(ev.timeComplexity) || correctness;
            const spaceComp = Number(ev.spaceComplexity) || correctness;
            const dsaWeighted = (correctness * 0.4 + depth * 0.2 + timeComp * 0.2 + spaceComp * 0.2) * 10;
            dsaValues.push(dsaWeighted);
            problemSolvingValues.push((ps * 0.6 + correctness * 0.4) * 10);
        } else if (cat === "TECHNICAL") {
            technicalValues.push((correctness * 0.6 + depth * 0.4) * 10);
            problemSolvingValues.push((ps * 0.5 + depth * 0.5) * 10);
        } else if (cat === "BEHAVIORAL") {
            behavioralValues.push((correctness * 0.5 + depth * 0.5) * 10);
        } else {
            technicalValues.push((correctness * 0.5 + depth * 0.5) * 10);
        }
    }

    const avg = (arr, fallback = 65) => {
        if (!arr.length) return fallback;
        const sum = arr.reduce((acc, v) => acc + v, 0);
        return Math.round(sum / arr.length);
    };

    const technical = Math.min(100, Math.max(20, avg(technicalValues)));
    const behavioral = Math.min(100, Math.max(20, avg(behavioralValues, technical)));
    const dsa = Math.min(100, Math.max(20, avg(dsaValues, technical)));
    const problemSolving = Math.min(100, Math.max(20, avg(problemSolvingValues, Math.round((technical + dsa) / 2))));
    const commAvgRaw = avg(communicationValues, 7);
    const communication = Math.min(100, Math.max(20, commAvgRaw <= 10 ? commAvgRaw * 10 : commAvgRaw));

    // Exact Weighted Formula:
    // overall = technical * 0.25 + dsa * 0.25 + problemSolving * 0.20 + communication * 0.15 + behavioral * 0.15
    const overall = Math.round(
        technical * 0.25 +
        dsa * 0.25 +
        problemSolving * 0.20 +
        communication * 0.15 +
        behavioral * 0.15
    );

    let hiringRecommendation = "LEANING_NO_HIRE";
    if (overall >= 85) {
        hiringRecommendation = "STRONG_HIRE";
    } else if (overall >= 72) {
        hiringRecommendation = "HIRE";
    } else if (overall >= 60) {
        hiringRecommendation = "LEANING_HIRE";
    } else if (overall >= 45) {
        hiringRecommendation = "LEANING_NO_HIRE";
    } else {
        hiringRecommendation = "NO_HIRE";
    }

    return {
        overall,
        technical,
        behavioral,
        dsa,
        problemSolving,
        communication,
        hiringRecommendation
    };
}

module.exports = {
    computeDeterministicScores
};
