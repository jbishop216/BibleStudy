// ─── Translation options ──────────────────────────────────────────────────────
// Uses scripture.api.bible (API.Bible).  NIV is not on the free tier.

export type Translation = string   // API.Bible bibleId

export interface TranslationOption {
  id: Translation
  name: string
  shortName: string
}

export const TRANSLATIONS: TranslationOption[] = [
  {
    id: 'bba9f40183526463-01',
    name: 'Berean Standard Bible (BSB)',
    shortName: 'BSB',
  },
]

export const DEFAULT_TRANSLATION: Translation = 'bba9f40183526463-01'

// ─── Output interfaces ────────────────────────────────────────────────────────

export interface BibleVerse {
  verse: number
  text: string
}

export interface BibleResponse {
  reference: string
  bookName: string
  verses: BibleVerse[]
  text: string              // full concatenated text (for memory verse / HEAR)
  translation_id: Translation
  translation_name: string
}

// ─── OSIS book ID mapping ─────────────────────────────────────────────────────
// Keys are lowercase book names as they appear in the schedule or user input.

const BOOK_IDS: Record<string, string> = {
  // OT (a few common ones in case users look them up in HEAR)
  'genesis': 'GEN', 'exodus': 'EXO', 'leviticus': 'LEV', 'numbers': 'NUM',
  'deuteronomy': 'DEU', 'joshua': 'JOS', 'judges': 'JDG', 'ruth': 'RUT',
  '1 samuel': '1SA', '2 samuel': '2SA', '1 kings': '1KI', '2 kings': '2KI',
  '1 chronicles': '1CH', '2 chronicles': '2CH', 'ezra': 'EZR', 'nehemiah': 'NEH',
  'esther': 'EST', 'job': 'JOB', 'psalm': 'PSA', 'psalms': 'PSA',
  'proverbs': 'PRO', 'ecclesiastes': 'ECC', 'song of solomon': 'SNG',
  'isaiah': 'ISA', 'jeremiah': 'JER', 'lamentations': 'LAM', 'ezekiel': 'EZK',
  'daniel': 'DAN', 'hosea': 'HOS', 'joel': 'JOL', 'amos': 'AMO',
  'obadiah': 'OBA', 'jonah': 'JON', 'micah': 'MIC', 'nahum': 'NAH',
  'habakkuk': 'HAB', 'zephaniah': 'ZEP', 'haggai': 'HAG', 'zechariah': 'ZEC',
  'malachi': 'MAL',
  // NT — Gospels & Acts
  'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN', 'acts': 'ACT',
  // Paul's letters
  'romans': 'ROM',
  '1 corinthians': '1CO', '1corinthians': '1CO',
  '2 corinthians': '2CO', '2corinthians': '2CO',
  'galatians': 'GAL', 'ephesians': 'EPH', 'philippians': 'PHP',
  'colossians': 'COL',
  '1 thessalonians': '1TH', '1thessalonians': '1TH',
  '2 thessalonians': '2TH', '2thessalonians': '2TH',
  '1 timothy': '1TI', '1timothy': '1TI',
  '2 timothy': '2TI', '2timothy': '2TI',
  'titus': 'TIT', 'philemon': 'PHM', 'hebrews': 'HEB',
  // General epistles
  'james': 'JAS',
  '1 peter': '1PE', '1peter': '1PE',
  '2 peter': '2PE', '2peter': '2PE',
  '1 john': '1JN', '1john': '1JN',
  '2 john': '2JN', '2john': '2JN',
  '3 john': '3JN', '3john': '3JN',
  'jude': 'JUD', 'revelation': 'REV',
}

// ─── Reference converters ─────────────────────────────────────────────────────

/**
 * Convert a chapter ref like "Luke 1" or "Philemon" to an API.Bible chapterId.
 * Single-chapter books (Philemon, 2 John, 3 John, Jude) may omit the chapter number.
 */
function refToChapterId(ref: string): string {
  const trimmed = ref.trim()

  // Try: BookName [space] ChapterNumber  e.g. "Luke 1", "1 Corinthians 14"
  const match = trimmed.match(/^(.+?)\s+(\d+)$/)
  if (match) {
    const bookKey = match[1].toLowerCase()
    const bookId = BOOK_IDS[bookKey]
    if (!bookId) throw new Error(`Unknown book: "${match[1]}"`)
    return `${bookId}.${match[2]}`
  }

  // No chapter number — must be a single-chapter book
  const bookKey = trimmed.toLowerCase()
  const bookId = BOOK_IDS[bookKey]
  if (!bookId) throw new Error(`Unknown book: "${trimmed}"`)
  return `${bookId}.1`
}

/**
 * Convert a verse ref like "Matthew 5:1-2" or "John 3:16" to an API.Bible passageId.
 */
function refToPassageId(ref: string): string {
  const trimmed = ref.trim()

  // Match: BookName Chapter:VerseStart[-VerseEnd]
  const match = trimmed.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/)
  if (!match) throw new Error(`Could not parse verse reference: "${ref}"`)

  const [, bookName, chNum, verseStart, verseEnd] = match
  const bookId = BOOK_IDS[bookName.toLowerCase()]
  if (!bookId) throw new Error(`Unknown book: "${bookName}"`)

  const start = `${bookId}.${chNum}.${verseStart}`
  return verseEnd ? `${start}-${bookId}.${chNum}.${verseEnd}` : start
}

// ─── API.Bible JSON content parser ───────────────────────────────────────────

interface ContentNode {
  type: string
  name?: string
  text?: string
  attrs?: Record<string, string>
  items?: ContentNode[]
}

/**
 * Walk API.Bible's nested JSON content tree and collect verse text.
 * Text nodes carry an attrs.verseId like "JHN 3:1" that identifies the verse.
 */
function extractVerses(nodes: ContentNode[]): BibleVerse[] {
  const verseMap = new Map<number, string>()

  function walk(node: ContentNode) {
    if (node.type === 'text' && node.attrs?.verseId && node.text) {
      const m = node.attrs.verseId.match(/\.(\d+)$/)
      if (m) {
        const verseNum = parseInt(m[1], 10)
        const existing = verseMap.get(verseNum)
        verseMap.set(verseNum, existing ? `${existing} ${node.text}` : node.text)
      }
    }
    for (const child of node.items ?? []) {
      walk(child)
    }
  }

  for (const node of nodes) {
    walk(node)
  }

  return Array.from(verseMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([verse, text]) => ({ verse, text: text.trim() }))
}

// ─── Extract book name from a human-readable reference ────────────────────────
// e.g. "Luke 1" → "Luke", "1 Corinthians 14" → "1 Corinthians", "Matthew 5:1-2" → "Matthew"

function bookNameFromRef(ref: string): string {
  // Everything before the last space-delimited token that starts with a digit
  const parts = ref.trim().split(' ')
  const lastNumericIdx = parts.map((p, i) => ({ p, i })).reverse().find(({ p }) => /^\d/.test(p))?.i ?? parts.length - 1
  return parts.slice(0, lastNumericIdx).join(' ') || ref
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

const API_BASE = 'https://api.scripture.api.bible/v1'

async function apiFetch(path: string): Promise<Record<string, unknown>> {
  const key = process.env.NEXT_PUBLIC_API_BIBLE_KEY
  if (!key) throw new Error('NEXT_PUBLIC_API_BIBLE_KEY is not configured')

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'api-key': key },
    next: { revalidate: 86400 },   // 24-hour server-side cache
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API.Bible ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<Record<string, unknown>>
}

// ─── Public fetch functions ───────────────────────────────────────────────────

/**
 * Fetch an entire chapter.
 * chapterRef: "Luke 1", "1 Corinthians 14", "Philemon", "2 John", "Jude", etc.
 */
export async function fetchChapter(
  chapterRef: string,
  translation: Translation = DEFAULT_TRANSLATION
): Promise<BibleResponse> {
  const chapterId = refToChapterId(chapterRef)
  const json = await apiFetch(
    `/bibles/${translation}/chapters/${chapterId}` +
    `?content-type=json&include-verse-numbers=true&include-titles=false&include-notes=false`
  )

  const data = json.data as Record<string, unknown>
  const content = (data.content as ContentNode[] | undefined) ?? []
  const verses = extractVerses(content)
  const text = verses.map(v => v.text).join(' ')
  const reference = (data.reference as string) ?? chapterRef
  const bookName = bookNameFromRef(reference)
  const translationName = TRANSLATIONS.find(t => t.id === translation)?.name ?? 'BSB'

  return { reference, bookName, verses, text, translation_id: translation, translation_name: translationName }
}

/**
 * Fetch a verse or short passage.
 * ref: "John 3:16", "Matthew 5:1-2", "Romans 8:28-29", etc.
 */
export async function fetchVerse(
  ref: string,
  translation: Translation = DEFAULT_TRANSLATION
): Promise<BibleResponse> {
  const passageId = refToPassageId(ref)
  const json = await apiFetch(
    `/bibles/${translation}/passages/${passageId}` +
    `?content-type=json&include-verse-numbers=true&include-titles=false&include-notes=false`
  )

  const data = json.data as Record<string, unknown>
  const content = (data.content as ContentNode[] | undefined) ?? []
  const verses = extractVerses(content)
  const text = verses.map(v => v.text).join(' ')
  const reference = (data.reference as string) ?? ref
  const bookName = bookNameFromRef(reference)
  const translationName = TRANSLATIONS.find(t => t.id === translation)?.name ?? 'BSB'

  return { reference, bookName, verses, text, translation_id: translation, translation_name: translationName }
}

// ─── Memory verse helpers (unchanged) ────────────────────────────────────────

/** Split verse text into an array of words (preserving punctuation) */
export function splitIntoWords(text: string): string[] {
  const clean = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.split(' ').filter(Boolean)
}

/** Get the first letter of a word (strips leading punctuation) */
export function firstLetter(word: string): string {
  const clean = word.replace(/^[^a-zA-Z0-9]/, '')
  return clean.charAt(0).toUpperCase()
}

/**
 * Determine which word indices to blank in memory stage 2.
 * Blanks roughly every other content word (skips very short words).
 */
export function getBlankIndices(words: string[]): Set<number> {
  const blanks = new Set<number>()
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[^a-zA-Z]/g, '')
    if (w.length <= 2) continue
    if (i % 2 === 1) blanks.add(i)
  }
  // Ensure at least 30% blanked
  if (blanks.size < Math.floor(words.length * 0.3)) {
    for (let i = 0; i < words.length; i++) {
      if (i % 2 === 1 && !blanks.has(i)) blanks.add(i)
    }
  }
  return blanks
}
