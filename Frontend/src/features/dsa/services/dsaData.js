import normalSheetData from "../data/normalSheet.json"
import companiesData from "../data/companies.json"
import companyProblemsData from "../data/companyProblems.json"
import canonicalProblemsData from "../data/canonicalProblems.json"

export const normalSheet = normalSheetData
export const companies = companiesData
export const companyProblems = companyProblemsData
export const canonicalProblems = canonicalProblemsData

/**
 * Get all 16 topics from Normal DSA Sheet
 */
export function getNormalSheet() {
    return normalSheet
}

/**
 * Get a specific topic by its slug/ID
 */
export function getTopicById(topicId) {
    if (!topicId) return null
    return normalSheet.find((t) => t.id === topicId) || null
}

/**
 * Get all companies
 */
export function getCompanies() {
    return companies
}

/**
 * Get popular companies (Google, Amazon, Microsoft, etc.)
 */
export function getPopularCompanies() {
    return companies.filter((c) => c.isPopular)
}

/**
 * Get a company by its ID
 */
export function getCompanyById(companyId) {
    if (!companyId) return null
    return companies.find((c) => c.id === companyId) || null
}

/**
 * Get list of problems for a company with joined canonical data & frequency
 */
export function getCompanyProblems(companyId) {
    if (!companyId) return []
    const records = companyProblems[companyId] || []

    return records.map((record, index) => {
        const canonical = canonicalProblems[record.problemId] || {}
        return {
            id: record.problemId,
            index: index + 1,
            title: canonical.title || record.problemId,
            difficulty: canonical.difficulty || "Medium",
            leetcodeUrl: canonical.leetcodeUrl || `https://leetcode.com/problems/${record.problemId}/`,
            topics: canonical.topics || [],
            acceptanceRate: record.acceptanceRate !== null && record.acceptanceRate !== undefined ? record.acceptanceRate : canonical.acceptanceRate,
            frequency: record.frequency,
            companies: canonical.companies || [],
            remarks: canonical.remarks || null
        }
    })
}

/**
 * Get canonical problem by ID
 */
export function getProblemById(problemId) {
    if (!problemId) return null
    const canonical = canonicalProblems[problemId]
    if (!canonical) return null
    return canonical
}

/**
 * Find adjacent problems for next/previous navigation
 */
export function getAdjacentProblems(problemId, contextTopicId = null, contextCompanyId = null) {
    let list = []

    if (contextTopicId) {
        const topic = getTopicById(contextTopicId)
        if (topic) {
            list = topic.questions.map((q) => q.id)
        }
    } else if (contextCompanyId) {
        const cp = companyProblems[contextCompanyId] || []
        list = cp.map((r) => r.problemId)
    }

    if (!list.length) {
        // Fallback to normal sheet flattened
        list = normalSheet.flatMap((t) => t.questions.map((q) => q.id))
    }

    const currentIndex = list.indexOf(problemId)
    if (currentIndex === -1) {
        return { prevId: null, nextId: null }
    }

    return {
        prevId: currentIndex > 0 ? list[currentIndex - 1] : null,
        nextId: currentIndex < list.length - 1 ? list[currentIndex + 1] : null
    }
}
