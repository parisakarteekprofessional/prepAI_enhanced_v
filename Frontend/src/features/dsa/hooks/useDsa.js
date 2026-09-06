import { useState, useEffect, useCallback, useMemo } from "react"
import { getDsaProgress, updateDsaProgress, saveDsaNote } from "../services/dsa.api"
import { normalSheet, companies, companyProblems, canonicalProblems, getProblemById } from "../services/dsaData"

const STORAGE_KEY_SOLVED = "prepai_dsa_solved"
const STORAGE_KEY_ATTEMPTED = "prepai_dsa_attempted"
const STORAGE_KEY_NOTES = "prepai_dsa_notes"
const STORAGE_KEY_LAST_ID = "prepai_dsa_last_id"
const STORAGE_KEY_LAST_AT = "prepai_dsa_last_at"

export function useDsa() {
    const [solvedSet, setSolvedSet] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SOLVED)
            return new Set(raw ? JSON.parse(raw) : [])
        } catch {
            return new Set()
        }
    })

    const [attemptedSet, setAttemptedSet] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTED)
            return new Set(raw ? JSON.parse(raw) : [])
        } catch {
            return new Set()
        }
    })

    const [notes, setNotes] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_NOTES)
            return raw ? JSON.parse(raw) : {}
        } catch {
            return {}
        }
    })

    const [lastProblemId, setLastProblemId] = useState(() => {
        return localStorage.getItem(STORAGE_KEY_LAST_ID) || "maximum-and-minimum-element-in-an-array"
    })

    const [lastSolvedAt, setLastSolvedAt] = useState(() => {
        return localStorage.getItem(STORAGE_KEY_LAST_AT) || null
    })

    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState("")

    // Initial sync with backend
    useEffect(() => {
        let isMounted = true

        async function fetchProgress() {
            try {
                const res = await getDsaProgress()
                if (isMounted && res?.progress) {
                    const { solvedQuestionIds, attemptedQuestionIds, notes: serverNotes, lastSolvedAt: serverLastSolved } = res.progress
                    
                    const newSolved = new Set(solvedQuestionIds || [])
                    const newAttempted = new Set(attemptedQuestionIds || [])
                    const mergedNotes = { ...(serverNotes || {}) }

                    setSolvedSet(newSolved)
                    setAttemptedSet(newAttempted)
                    setNotes((prev) => ({ ...prev, ...mergedNotes }))
                    if (serverLastSolved) setLastSolvedAt(serverLastSolved)

                    localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify([ ...newSolved ]))
                    localStorage.setItem(STORAGE_KEY_ATTEMPTED, JSON.stringify([ ...newAttempted ]))
                    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(mergedNotes))
                }
            } catch (err) {
                // Offline or unauthenticated fallback — keep localStorage data
                console.warn("DSA backend progress sync unavailable, running in local/cached mode.")
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchProgress()
        return () => { isMounted = false }
    }, [])

    const getStatus = useCallback((problemId) => {
        if (!problemId) return "NOT_STARTED"
        if (solvedSet.has(problemId)) return "SOLVED"
        if (attemptedSet.has(problemId)) return "ATTEMPTED"
        return "NOT_STARTED"
    }, [solvedSet, attemptedSet])

    const setStatus = useCallback(async (problemId, status) => {
        if (!problemId || !["NOT_STARTED", "ATTEMPTED", "SOLVED"].includes(status)) return

        // Update local state optimistically
        setSolvedSet((prev) => {
            const next = new Set(prev)
            if (status === "SOLVED") {
                next.add(problemId)
            } else {
                next.delete(problemId)
            }
            localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify([ ...next ]))
            return next
        })

        setAttemptedSet((prev) => {
            const next = new Set(prev)
            if (status === "ATTEMPTED") {
                next.add(problemId)
            } else {
                next.delete(problemId)
            }
            localStorage.setItem(STORAGE_KEY_ATTEMPTED, JSON.stringify([ ...next ]))
            return next
        })

        setLastProblemId(problemId)
        localStorage.setItem(STORAGE_KEY_LAST_ID, problemId)

        if (status === "SOLVED") {
            const now = new Date().toISOString()
            setLastSolvedAt(now)
            localStorage.setItem(STORAGE_KEY_LAST_AT, now)
        }

        // Sync with backend asynchronously
        try {
            setSyncing(true)
            await updateDsaProgress({ questionId: problemId, status })
        } catch (err) {
            // Error silently handled by local storage
        } finally {
            setSyncing(false)
        }
    }, [])

    const toggleSolved = useCallback(async (problemId) => {
        const current = getStatus(problemId)
        const next = current === "SOLVED" ? "NOT_STARTED" : "SOLVED"
        await setStatus(problemId, next)
    }, [getStatus, setStatus])

    const getNote = useCallback((problemId) => {
        return notes[problemId] || ""
    }, [notes])

    const saveNote = useCallback(async (problemId, noteText) => {
        if (!problemId) return

        setNotes((prev) => {
            const next = { ...prev, [problemId]: noteText }
            localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(next))
            return next
        })

        try {
            await saveDsaNote({ questionId: problemId, note: noteText })
        } catch (err) {
            // LocalStorage preserved
        }
    }, [])

    // Calculate Normal Sheet Stats
    const normalStats = useMemo(() => {
        const allNormalQuestions = normalSheet.flatMap((t) => t.questions)
        const total = allNormalQuestions.length
        let solved = 0
        let attempted = 0
        const difficultyMap = {
            Easy: { total: 0, solved: 0 },
            Medium: { total: 0, solved: 0 },
            Hard: { total: 0, solved: 0 }
        }

        for (const q of allNormalQuestions) {
            const diff = q.difficulty || "Medium"
            if (!difficultyMap[diff]) difficultyMap[diff] = { total: 0, solved: 0 }
            difficultyMap[diff].total++

            if (solvedSet.has(q.id)) {
                solved++
                difficultyMap[diff].solved++
            } else if (attemptedSet.has(q.id)) {
                attempted++
            }
        }

        const rate = total > 0 ? Math.round((solved / total) * 100) : 0

        return {
            total,
            solved,
            attempted,
            rate,
            difficultyMap
        }
    }, [solvedSet, attemptedSet])

    // Calculate Topic Stats
    const getTopicStats = useCallback((topicId) => {
        const topic = normalSheet.find((t) => t.id === topicId)
        if (!topic) return { total: 0, solved: 0, attempted: 0, rate: 0, difficultyMap: {} }

        let solved = 0
        let attempted = 0
        const difficultyMap = {
            Easy: { total: 0, solved: 0 },
            Medium: { total: 0, solved: 0 },
            Hard: { total: 0, solved: 0 }
        }

        for (const q of topic.questions) {
            const diff = q.difficulty || "Medium"
            if (!difficultyMap[diff]) difficultyMap[diff] = { total: 0, solved: 0 }
            difficultyMap[diff].total++

            if (solvedSet.has(q.id)) {
                solved++
                difficultyMap[diff].solved++
            } else if (attemptedSet.has(q.id)) {
                attempted++
            }
        }

        const total = topic.questions.length
        const rate = total > 0 ? Math.round((solved / total) * 100) : 0

        return { total, solved, attempted, rate, difficultyMap }
    }, [solvedSet, attemptedSet])

    // Calculate Company Stats
    const getCompanyStats = useCallback((companyId) => {
        const records = companyProblems[companyId] || []
        const total = records.length
        let solved = 0
        let attempted = 0

        for (const r of records) {
            if (solvedSet.has(r.problemId)) {
                solved++
            } else if (attemptedSet.has(r.problemId)) {
                attempted++
            }
        }

        const rate = total > 0 ? Math.round((solved / total) * 100) : 0
        return { total, solved, attempted, rate }
    }, [solvedSet, attemptedSet])

    // Total Overall Stats across all 2,113 canonical problems
    const overallStats = useMemo(() => {
        const allProblems = Object.values(canonicalProblems)
        const total = allProblems.length
        let solved = 0
        let attempted = 0

        const difficultyMap = {
            Easy: { total: 0, solved: 0 },
            Medium: { total: 0, solved: 0 },
            Hard: { total: 0, solved: 0 }
        }

        for (const p of allProblems) {
            const diff = p.difficulty || "Medium"
            if (!difficultyMap[diff]) difficultyMap[diff] = { total: 0, solved: 0 }
            difficultyMap[diff].total++

            if (solvedSet.has(p.id)) {
                solved++
                difficultyMap[diff].solved++
            } else if (attemptedSet.has(p.id)) {
                attempted++
            }
        }

        const rate = total > 0 ? Math.round((solved / total) * 100) : 0

        return {
            total,
            solved,
            attempted,
            rate,
            difficultyMap
        }
    }, [solvedSet, attemptedSet])

    // Get Continue Practicing / Recommended Problem
    const continueProblem = useMemo(() => {
        if (lastProblemId) {
            const p = getProblemById(lastProblemId)
            if (p) {
                return {
                    ...p,
                    status: getStatus(p.id)
                }
            }
        }

        // Fallback: first unsolved problem in Normal Sheet
        for (const topic of normalSheet) {
            for (const q of topic.questions) {
                if (!solvedSet.has(q.id)) {
                    const full = getProblemById(q.id)
                    return {
                        ...(full || q),
                        status: getStatus(q.id)
                    }
                }
            }
        }

        const first = normalSheet[0]?.questions[0]
        return first ? { ...first, status: getStatus(first.id) } : null
    }, [lastProblemId, getStatus, solvedSet])

    return {
        solvedSet,
        attemptedSet,
        getStatus,
        setStatus,
        toggleSolved,
        getNote,
        saveNote,
        normalStats,
        getTopicStats,
        getCompanyStats,
        overallStats,
        continueProblem,
        lastSolvedAt,
        loading,
        syncing,
        error
    }
}
