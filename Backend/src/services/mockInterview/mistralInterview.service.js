const { generateCompletion } = require("../study/llm/mistral.provider");

function sanitizeJsonString(str) {
    let inString = false;
    let escaped = false;
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && !escaped) {
            inString = !inString;
            result += char;
        } else if (inString) {
            if (char === '\n') {
                result += '\\n';
            } else if (char === '\r') {
                result += '\\r';
            } else if (char === '\t') {
                result += '\\t';
            } else if (char.charCodeAt(0) < 32) {
                result += ' ';
            } else {
                result += char;
            }
        } else {
            result += char;
        }
        escaped = (char === '\\' && !escaped);
    }
    return result;
}

function cleanJsonString(raw) {
    if (!raw) return "{}";
    let text = raw.trim();
    if (text.startsWith("```json")) {
        text = text.substring(7);
    } else if (text.startsWith("```")) {
        text = text.substring(3);
    }
    if (text.endsWith("```")) {
        text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const firstOpen = text.indexOf("{");
    const lastClose = text.lastIndexOf("}");
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        text = text.substring(firstOpen, lastClose + 1);
    }
    return sanitizeJsonString(text);
}

const SYSTEM_INTERVIEWER_PROMPT = `You are a professional, calm, concise, and realistic senior engineering interviewer at a top technology company.
Conduct an authentic face-to-face technical interview.
- Ask one question at a time.
- Avoid repetitive generic filler like "Great answer!", "Excellent!", or "That is amazing!".
- Ask meaningful follow-ups only when there is a clear gap in correctness, complexity, edge-case reasoning, or optimization.
- Never reveal the solution before the candidate answers.
- Never expose internal chain-of-thought or scoring rubrics.
- Output strictly valid JSON with no markdown wrapping.`;

async function evaluateAnswer({
    questionText,
    category,
    expectedPoints = [],
    transcript,
    difficulty = "medium"
}) {
    if (!transcript || transcript.trim().length < 4) {
        return {
            score: 2,
            correctness: 2,
            technicalDepth: 2,
            problemSolving: 2,
            communication: 4,
            strengths: ["Attempted to respond"],
            weaknesses: ["Answer was too brief to assess technical capability"],
            missingConcepts: ["Core explanation and trade-offs"],
            feedback: "Please provide a more complete explanation covering your architectural decisions and reasoning.",
            needsFollowUp: false,
            followUpReason: "",
            suggestedFollowupQuestion: "",
            followupPurpose: ""
        };
    }

    const isDsa = category === "DSA";

    const prompt = `${SYSTEM_INTERVIEWER_PROMPT}

You are evaluating a candidate's spoken response.
Question Asked: "${questionText}"
Category: ${category}
Difficulty: ${difficulty}
Expected Concepts: ${JSON.stringify(expectedPoints)}
Candidate Transcript: "${transcript}"

Score the answer from 1 to 10.
Decide if a follow-up question is necessary.
A follow-up is necessary ONLY if:
1. The approach is partially correct but lacks depth.
2. Time or space complexity is missing or unexplained.
3. Critical edge cases are overlooked.
4. An optimization is clearly possible.
If the candidate's answer is already sound, set needsFollowUp to false.

Return JSON schema:
{
  "score": number (1-10),
  "correctness": number (1-10),
  "technicalDepth": number (1-10),
  "problemSolving": number (1-10),
  "communication": number (1-10),
  "timeComplexity": number (1-10),
  "spaceComplexity": number (1-10),
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "missingConcepts": ["string"],
  "feedback": "2 sentences of constructive, professional feedback.",
  "needsFollowUp": boolean,
  "followUpReason": "Reason why follow-up is needed, else empty",
  "suggestedFollowupQuestion": "The exact wording of the follow-up question to speak next, else empty",
  "followupPurpose": "OPTIMIZATION | TIME_COMPLEXITY | SPACE_COMPLEXITY | EDGE_CASES | ALTERNATIVE_APPROACH | REASONING | IMPLEMENTATION | empty"
}`;

    try {
        const response = await generateCompletion({
            systemPrompt: SYSTEM_INTERVIEWER_PROMPT,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            maxTokens: 750
        });

        const parsed = JSON.parse(cleanJsonString(response.content));
        return {
            score: Math.min(10, Math.max(1, Number(parsed.score) || 6)),
            correctness: Math.min(10, Math.max(1, Number(parsed.correctness) || 6)),
            technicalDepth: Math.min(10, Math.max(1, Number(parsed.technicalDepth) || 6)),
            problemSolving: Math.min(10, Math.max(1, Number(parsed.problemSolving) || 6)),
            communication: Math.min(10, Math.max(1, Number(parsed.communication) || 7)),
            timeComplexity: Math.min(10, Math.max(1, Number(parsed.timeComplexity) || 6)),
            spaceComplexity: Math.min(10, Math.max(1, Number(parsed.spaceComplexity) || 6)),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : ["Good problem framing"],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 3) : ["Could delve deeper into trade-offs"],
            missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts.slice(0, 2) : [],
            feedback: parsed.feedback || "Solid response demonstrating core understanding.",
            needsFollowUp: Boolean(parsed.needsFollowUp && (parsed.score < 8)),
            followUpReason: parsed.followUpReason || "",
            suggestedFollowupQuestion: parsed.suggestedFollowupQuestion || "",
            followupPurpose: parsed.followupPurpose || (isDsa ? "TIME_COMPLEXITY" : "REASONING")
        };
    } catch (err) {
        console.error("[Mistral Interview] evaluateAnswer error:", err.message);
        return {
            score: 6,
            correctness: 6,
            technicalDepth: 6,
            problemSolving: 6,
            communication: 7,
            timeComplexity: 6,
            spaceComplexity: 6,
            strengths: ["Communicated general approach"],
            weaknesses: ["Trade-off analysis could be sharper"],
            missingConcepts: [],
            feedback: "Reasonable baseline explanation. Delving deeper into complexities will strengthen your response.",
            needsFollowUp: false,
            followUpReason: "",
            suggestedFollowupQuestion: "",
            followupPurpose: ""
        };
    }
}

async function generateDsaQuestionPresentation({ problemTitle, difficulty = "Medium" }) {
    const prompt = `${SYSTEM_INTERVIEWER_PROMPT}

You are presenting an algorithmic coding problem to a candidate in an interview.
Problem Title: "${problemTitle}"
Difficulty: ${difficulty}

Formulate the question naturally, as an interviewer would introduce it.
Do NOT reveal the algorithm, code, or complexity.
State the problem scenario clearly and ask the candidate to explain their approach, data structure choice, and time/space complexity.

Return JSON schema:
{
  "questionText": "Natural verbal introduction to the problem.",
  "expectedKeyPoints": ["Optimal algorithm/pattern", "Time complexity", "Space complexity", "Key edge cases"]
}`;

    try {
        const response = await generateCompletion({
            systemPrompt: SYSTEM_INTERVIEWER_PROMPT,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            maxTokens: 500
        });

        const parsed = JSON.parse(cleanJsonString(response.content));
        return {
            questionText: parsed.questionText || `Let's look at the "${problemTitle}" problem. Could you explain how you would solve this problem, including your algorithmic approach and complexity analysis?`,
            expectedKeyPoints: Array.isArray(parsed.expectedKeyPoints) ? parsed.expectedKeyPoints : ["Optimal approach", "Complexity analysis", "Edge cases"]
        };
    } catch (err) {
        return {
            questionText: `Let's look at the "${problemTitle}" problem. Walk me through your approach to solving this, including the data structures you would use and your time and space complexity.`,
            expectedKeyPoints: ["Optimal approach", "Complexity analysis", "Edge cases"]
        };
    }
}

async function generateFinalDebrief({ session, responses, scores }) {
    const questionsSummary = responses.map((r, i) => ({
        index: i + 1,
        question: r.question?.questionText,
        category: r.question?.category,
        source: r.question?.source,
        score: r.evaluation?.score || r.evaluation?.overallScore,
        strengths: r.evaluation?.strengths,
        weaknesses: r.evaluation?.weaknesses
    }));

    const prompt = `${SYSTEM_INTERVIEWER_PROMPT}

Summarize this mock interview performance into an executive debrief report.
Role: ${session.roleTitle}
Scores: Technical=${scores.technical}, Behavioral=${scores.behavioral}, DSA=${scores.dsa}, ProblemSolving=${scores.problemSolving}, Communication=${scores.communication}, Overall=${scores.overall}
Questions and Evaluations: ${JSON.stringify(questionsSummary)}

Return JSON schema:
{
  "summary": "3-4 concise sentences evaluating their readiness, communication, and technical depth.",
  "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
  "weaknesses": ["Key weakness 1", "Key weakness 2", "Key weakness 3"],
  "recommendedDsaTopics": ["Topic 1", "Topic 2"],
  "recommendedStudyTopics": ["Concept 1", "Concept 2"]
}`;

    try {
        const response = await generateCompletion({
            systemPrompt: SYSTEM_INTERVIEWER_PROMPT,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
            maxTokens: 750
        });

        const parsed = JSON.parse(cleanJsonString(response.content));
        return {
            summary: parsed.summary || `The candidate showed solid foundational capability for ${session.roleTitle} with actionable areas for improvement in complexity and depth.`,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Structured problem solving", "Clear verbal communication"],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : ["Edge case analysis", "Production scalability reasoning"],
            recommendedDsaTopics: Array.isArray(parsed.recommendedDsaTopics) ? parsed.recommendedDsaTopics : ["Graph Traversal", "Dynamic Programming"],
            recommendedStudyTopics: Array.isArray(parsed.recommendedStudyTopics) ? parsed.recommendedStudyTopics : ["System Design", "Concurrency"]
        };
    } catch (err) {
        return {
            summary: `The candidate demonstrated good domain knowledge for ${session.roleTitle} with areas for further growth in complexity analysis.`,
            strengths: ["Clear communication", "Structured approach"],
            weaknesses: ["Deepening edge case analysis", "Justifying complexity bounds"],
            recommendedDsaTopics: ["Dynamic Programming", "Trees & Graphs"],
            recommendedStudyTopics: ["System Architecture", "Performance Optimization"]
        };
    }
}

module.exports = {
    evaluateAnswer,
    generateDsaQuestionPresentation,
    generateFinalDebrief
};
