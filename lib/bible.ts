export type Translation = 'web' | 'kjv' | 'asv' | 'bbe' | 'webbe'

export interface BibleVerse {
  book_id: string
  book_name: string
  chapter: number
  verse: number
  text: string
}

export interface BibleResponse {
  reference: string
  verses: BibleVerse[]
  text: string
  translation_id: Translation
  translation_name: string
}

export const TRANSLATIONS: { id: Translation; name: string }[] = [
  { id: 'web', name: 'World English Bible (WEB)' },
  { id: 'webbe', name: 'WEB British Edition' },
  { id: 'kjv', name: 'King James Version (KJV)' },
  { id: 'asv', name: 'American Standard Version (ASV)' },
  { id: 'bbe', name: 'Bible in Basic English (BBE)' },
]

/** Normalize a ref string for bible-api.com */
function normalizeRef(ref: string): string {
  return encodeURIComponent(
    ref
      .toLowerCase()
      .replace(/[–—]/g, '-')
      .trim()
  )
}

/** Fetch a verse or passage from bible-api.com */
export async function fetchVerse(
  ref: string,
  translation: Translation = 'web'
): Promise<BibleResponse> {
  const url = `https://bible-api.com/${normalizeRef(ref)}?translation=${translation}`
  const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h
  if (!res.ok) {
    throw new Error(`Could not fetch "${ref}" — ${res.status}`)
  }
  const data: BibleResponse = await res.json()
  return data
}

/** Split verse text into an array of words (preserving punctuation) */
export function splitIntoWords(text: string): string[] {
  // Clean up extra whitespace and newlines first
  const clean = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.split(' ').filter(Boolean)
}

/** Get the first letter of a word (strips leading punctuation) */
export function firstLetter(word: string): string {
  const clean = word.replace(/^[^a-zA-Z0-9]/, '')
  return clean.charAt(0).toUpperCase()
}

/** Fetch an entire chapter from bible-api.com.
 *  Pass a ref like "Luke 1" or "1 Corinthians 14".
 *  For single-chapter books (Philemon, 2 John, 3 John, Jude) just pass the book name.
 */
export async function fetchChapter(
  chapterRef: string,
  translation: Translation = 'web'
): Promise<BibleResponse> {
  // bible-api.com treats "Book Chapter" as a whole-chapter request
  const url = `https://bible-api.com/${normalizeRef(chapterRef)}?translation=${translation}`
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) {
    throw new Error(`Could not load "${chapterRef}" — ${res.status}`)
  }
  const data: BibleResponse = await res.json()
  return data
}

/** Determine which word indices to blank in stage 2.
 *  Strategy: blank roughly every other content word (skip very short words
 *  on the first pass to keep rhythm anchors).
 */
export function getBlankIndices(words: string[]): Set<number> {
  const blanks = new Set<number>()
  // First pass: blank every other word starting at index 1
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[^a-zA-Z]/g, '')
    if (w.length <= 2) continue // skip tiny words
    if (i % 2 === 1) blanks.add(i)
  }
  // Ensure at least 30% are blanked
  if (blanks.size < Math.floor(words.length * 0.3)) {
    for (let i = 0; i < words.length; i++) {
      if (i % 2 === 1 && !blanks.has(i)) blanks.add(i)
    }
  }
  return blanks
}
