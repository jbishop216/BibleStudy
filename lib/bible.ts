// ─── Translations ─────────────────────────────────────────────────────────────
// Uses bible-api.com — free, no key required.

export type Translation = 'web' | 'kjv' | 'asv' | 'bbe' | 'webbe'

export interface TranslationOption {
  id: Translation
  name: string
  shortName: string
}

export const TRANSLATIONS: TranslationOption[] = [
  { id: 'web',   name: 'World English Bible (WEB)',    shortName: 'WEB'   },
  { id: 'kjv',   name: 'King James Version (KJV)',     shortName: 'KJV'   },
  { id: 'asv',   name: 'American Standard Version',    shortName: 'ASV'   },
  { id: 'bbe',   name: 'Bible in Basic English (BBE)', shortName: 'BBE'   },
  { id: 'webbe', name: 'WEB British Edition',          shortName: 'WEBBE' },
]

export const DEFAULT_TRANSLATION: Translation = 'web'

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

// ─── Single-chapter book expansion ───────────────────────────────────────────
// bible-api.com doesn't return a full chapter for single-chapter books unless
// you specify an explicit verse range.

const SINGLE_CHAPTER_RANGES: Record<string, string> = {
  'philemon': 'Philemon 1:1-25',
  'jude':     'Jude 1:1-25',
  '2 john':   '2 John 1:1-13',
  '3 john':   '3 John 1:1-14',
  'obadiah':  'Obadiah 1:1-21',
}

/** Expand single-chapter book refs to full verse ranges that bible-api.com accepts */
function expandChapterRef(ref: string): string {
  const lower = ref.trim().toLowerCase()
  return SINGLE_CHAPTER_RANGES[lower] ?? ref
}

// ─── URL helper ───────────────────────────────────────────────────────────────

function encodeRef(ref: string): string {
  return encodeURIComponent(
    ref.toLowerCase().replace(/[–—]/g, '-').trim()
  )
}

// ─── bible-api.com response shape ────────────────────────────────────────────

interface ApiVerse {
  book_id: string
  book_name: string
  chapter: number
  verse: number
  text: string
}

interface ApiResponse {
  reference: string
  verses: ApiVerse[]
  text: string
  translation_id: string
  translation_name: string
}

function mapResponse(data: ApiResponse, translation: Translation): BibleResponse {
  const verses: BibleVerse[] = data.verses.map(v => ({
    verse: v.verse,
    text: v.text.replace(/\n/g, ' ').trim(),
  }))
  const text = verses.map(v => v.text).join(' ')
  const bookName = data.verses[0]?.book_name ?? ''

  return {
    reference: data.reference,
    bookName,
    verses,
    text,
    translation_id: translation,
    translation_name: data.translation_name,
  }
}

// ─── Public fetch functions ───────────────────────────────────────────────────

/**
 * Fetch an entire chapter.
 * chapterRef: "Luke 1", "1 Corinthians 14", "Philemon", "Jude", "2 John", etc.
 */
export async function fetchChapter(
  chapterRef: string,
  translation: Translation = DEFAULT_TRANSLATION
): Promise<BibleResponse> {
  const ref = expandChapterRef(chapterRef)
  const url = `https://bible-api.com/${encodeRef(ref)}?translation=${translation}`
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`Could not load "${chapterRef}" — ${res.status}`)
  const data: ApiResponse = await res.json()
  if (!data.verses?.length) throw new Error(`No content found for "${chapterRef}"`)
  return mapResponse(data, translation)
}

/**
 * Fetch a verse or short passage.
 * ref: "John 3:16", "Matthew 5:1-2", "Romans 8:28-29", etc.
 */
export async function fetchVerse(
  ref: string,
  translation: Translation = DEFAULT_TRANSLATION
): Promise<BibleResponse> {
  const url = `https://bible-api.com/${encodeRef(ref)}?translation=${translation}`
  const res = await fetch(url, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`Could not fetch "${ref}" — ${res.status}`)
  const data: ApiResponse = await res.json()
  if (!data.verses?.length) throw new Error(`No verses found for "${ref}"`)
  return mapResponse(data, translation)
}

// ─── Memory verse helpers ─────────────────────────────────────────────────────

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
