'use client'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface HEAREntry {
  weekId: number
  verseRef: string
  verseText: string
  highlight: string   // H – which verse stood out
  explain: string     // E – what does it mean
  apply: string       // A – how to apply it
  respond: string     // R – prayer response
  completedAt: string | null
  updatedAt: string
}

export interface MemoryProgress {
  weekId: number
  stagesCompleted: number[]   // [1, 2, 3] means stages 1-3 done
  practiceCount: number
  lastPracticed: string | null
  translation: string
}

export interface WeekProgress {
  weekId: number
  readingComplete: boolean
  hearComplete: boolean
  memoryComplete: boolean
}

// ──────────────────────────────────────────────────────────────────────────────
// Keys
// ──────────────────────────────────────────────────────────────────────────────
const HEAR_KEY = (id: number) => `hear_${id}`
const MEMORY_KEY = (id: number) => `memory_${id}`
const PROGRESS_KEY = (id: number) => `progress_${id}`
const TRANSLATION_KEY = 'preferred_translation'
const STREAK_KEY = 'study_streak'

function safeGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HEAR
// ──────────────────────────────────────────────────────────────────────────────
export function getHEAR(weekId: number): HEAREntry | null {
  return safeGet<HEAREntry>(HEAR_KEY(weekId))
}

export function saveHEAR(entry: Partial<HEAREntry> & { weekId: number }): HEAREntry {
  const existing = getHEAR(entry.weekId) ?? {
    weekId: entry.weekId,
    verseRef: '',
    verseText: '',
    highlight: '',
    explain: '',
    apply: '',
    respond: '',
    completedAt: null,
    updatedAt: new Date().toISOString(),
  }
  const updated: HEAREntry = { ...existing, ...entry, updatedAt: new Date().toISOString() }
  safeSet(HEAR_KEY(entry.weekId), updated)
  return updated
}

export function markHEARComplete(weekId: number): void {
  const entry = getHEAR(weekId)
  if (entry) {
    safeSet(HEAR_KEY(weekId), { ...entry, completedAt: new Date().toISOString() })
  }
}

export function isHEARComplete(weekId: number): boolean {
  const entry = getHEAR(weekId)
  if (!entry) return false
  return Boolean(entry.highlight && entry.explain && entry.apply && entry.respond)
}

// ──────────────────────────────────────────────────────────────────────────────
// Memory Verse
// ──────────────────────────────────────────────────────────────────────────────
export function getMemoryProgress(weekId: number): MemoryProgress | null {
  return safeGet<MemoryProgress>(MEMORY_KEY(weekId))
}

export function saveMemoryProgress(weekId: number, stageCompleted: number): void {
  const existing = getMemoryProgress(weekId) ?? {
    weekId,
    stagesCompleted: [],
    practiceCount: 0,
    lastPracticed: null,
    translation: 'web',
  }
  const stages = new Set(existing.stagesCompleted)
  stages.add(stageCompleted)
  const updated: MemoryProgress = {
    ...existing,
    stagesCompleted: Array.from(stages).sort(),
    practiceCount: existing.practiceCount + 1,
    lastPracticed: new Date().toISOString(),
  }
  safeSet(MEMORY_KEY(weekId), updated)
}

export function isMemoryComplete(weekId: number): boolean {
  const p = getMemoryProgress(weekId)
  return Boolean(p && p.stagesCompleted.includes(4))
}

// ──────────────────────────────────────────────────────────────────────────────
// Week Progress
// ──────────────────────────────────────────────────────────────────────────────
export function getWeekProgress(weekId: number): WeekProgress {
  return (
    safeGet<WeekProgress>(PROGRESS_KEY(weekId)) ?? {
      weekId,
      readingComplete: false,
      hearComplete: false,
      memoryComplete: false,
    }
  )
}

export function updateWeekProgress(weekId: number, patch: Partial<WeekProgress>): void {
  const existing = getWeekProgress(weekId)
  safeSet(PROGRESS_KEY(weekId), { ...existing, ...patch })
}

// ──────────────────────────────────────────────────────────────────────────────
// Translation preference
// ──────────────────────────────────────────────────────────────────────────────
export function getTranslation(): string {
  return safeGet<string>(TRANSLATION_KEY) ?? 'web'
}

export function saveTranslation(t: string): void {
  safeSet(TRANSLATION_KEY, t)
}

// ──────────────────────────────────────────────────────────────────────────────
// Streak
// ──────────────────────────────────────────────────────────────────────────────
interface StreakData {
  count: number
  lastWeek: number
}

export function getStreak(): StreakData {
  return safeGet<StreakData>(STREAK_KEY) ?? { count: 0, lastWeek: 0 }
}

export function updateStreak(completedWeekId: number): void {
  const { count, lastWeek } = getStreak()
  const newCount = completedWeekId === lastWeek + 1 ? count + 1 : 1
  safeSet(STREAK_KEY, { count: newCount, lastWeek: completedWeekId })
}

/** Returns all week IDs that have full progress (reading + hear + memory) */
export function getCompletedWeeks(): number[] {
  if (typeof window === 'undefined') return []
  const completed: number[] = []
  for (let i = 1; i <= 51; i++) {
    const p = getWeekProgress(i)
    if (p.readingComplete && p.hearComplete && p.memoryComplete) {
      completed.push(i)
    }
  }
  return completed
}
