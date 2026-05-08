'use client'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface HEAREntry {
  weekId: number
  verseRef: string
  verseText: string
  highlight: string
  explain: string
  apply: string
  respond: string
  completedAt: string | null
  updatedAt: string
}

export interface MemoryProgress {
  weekId: number
  stagesCompleted: number[]
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
// localStorage helpers
// ──────────────────────────────────────────────────────────────────────────────

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
// User management (global — not namespaced)
// ──────────────────────────────────────────────────────────────────────────────

const CURRENT_USER_KEY = 'scripture_user'
const USERS_KEY = 'scripture_users'

export function normalizeUsername(raw: string): string {
  return raw.trim().split(/\s+/)[0].toLowerCase()
}

export function displayName(username: string): string {
  return username.charAt(0).toUpperCase() + username.slice(1)
}

export function getCurrentUser(): string {
  return safeGet<string>(CURRENT_USER_KEY) ?? 'jess'
}

export function setCurrentUser(name: string): void {
  safeSet(CURRENT_USER_KEY, normalizeUsername(name))
}

export function getUsers(): string[] {
  const stored = safeGet<string[]>(USERS_KEY)
  if (!stored || !stored.includes('jess')) {
    const list = stored ? [...new Set(['jess', ...stored])] : ['jess']
    safeSet(USERS_KEY, list)
    return list
  }
  return stored
}

/** Adds user if not exists. Returns normalized name. */
export function addUser(rawName: string): string {
  const name = normalizeUsername(rawName)
  const existing = getUsers()
  if (!existing.includes(name)) {
    safeSet(USERS_KEY, [...existing, name])
  }
  return name
}

// ──────────────────────────────────────────────────────────────────────────────
// Per-user key namespace
// ──────────────────────────────────────────────────────────────────────────────

function userKey(suffix: string): string {
  if (typeof window === 'undefined') return `jess:${suffix}`
  const user = localStorage.getItem(CURRENT_USER_KEY) ?? 'jess'
  return `${user}:${suffix}`
}

const HEAR_KEY    = (id: number) => userKey(`hear_${id}`)
const MEMORY_KEY  = (id: number) => userKey(`memory_${id}`)
const PROGRESS_KEY = (id: number) => userKey(`progress_${id}`)
const translationKey = () => userKey('translation')
const streakKey      = () => userKey('streak')

// ──────────────────────────────────────────────────────────────────────────────
// Owner initialisation — marks all weeks complete for jess (runs once)
// ──────────────────────────────────────────────────────────────────────────────

export function initializeOwnerProgress(currentWeekId: number): void {
  const initKey = 'jess_v1_initialized'
  if (safeGet<boolean>(initKey)) return
  for (let i = 1; i <= currentWeekId; i++) {
    const key = `jess:progress_${i}`
    if (!safeGet(key)) {
      safeSet(key, { weekId: i, readingComplete: true, hearComplete: true, memoryComplete: true })
    }
  }
  safeSet(initKey, true)
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
    translation: 'bba9f40183526463-01',
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
// Translation preference (per-user)
// ──────────────────────────────────────────────────────────────────────────────

const BSB_ID = 'bba9f40183526463-01'
const VALID_BIBLE_IDS = new Set([BSB_ID])

export function getTranslation(): string {
  const stored = safeGet<string>(translationKey())
  return stored && VALID_BIBLE_IDS.has(stored) ? stored : BSB_ID
}

export function saveTranslation(t: string): void {
  safeSet(translationKey(), t)
}

// ──────────────────────────────────────────────────────────────────────────────
// Streak (per-user)
// ──────────────────────────────────────────────────────────────────────────────

interface StreakData { count: number; lastWeek: number }

export function getStreak(): StreakData {
  return safeGet<StreakData>(streakKey()) ?? { count: 0, lastWeek: 0 }
}

export function updateStreak(completedWeekId: number): void {
  const { count, lastWeek } = getStreak()
  const newCount = completedWeekId === lastWeek + 1 ? count + 1 : 1
  safeSet(streakKey(), { count: newCount, lastWeek: completedWeekId })
}

export function getCompletedWeeks(): number[] {
  if (typeof window === 'undefined') return []
  const completed: number[] = []
  for (let i = 1; i <= 52; i++) {
    const p = getWeekProgress(i)
    if (p.readingComplete && p.hearComplete && p.memoryComplete) completed.push(i)
  }
  return completed
}
