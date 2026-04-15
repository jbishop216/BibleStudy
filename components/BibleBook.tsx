'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { fetchChapter, type BibleResponse, type BibleVerse, type Translation } from '@/lib/bible'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  chapters: string[]
  initialIdx: number
  translation: Translation
  onClose: () => void
}

// ─── Roman numerals ───────────────────────────────────────────────────────────

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
  }
  return result
}

// ─── Parchment page styles (inline, so they work without Tailwind JIT) ───────

const PAGE_BG = {
  right: `
    radial-gradient(ellipse at 95% 10%, rgba(180,130,50,0.18) 0%, transparent 55%),
    radial-gradient(ellipse at 10% 90%, rgba(160,110,40,0.12) 0%, transparent 45%),
    radial-gradient(ellipse at 50% 50%, rgba(220,190,130,0.08) 0%, transparent 70%),
    linear-gradient(160deg, #f5e6c8 0%, #edddb0 40%, #f0e3c0 70%, #e8d4a0 100%)
  `,
  left: `
    radial-gradient(ellipse at 5% 10%, rgba(180,130,50,0.18) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 90%, rgba(160,110,40,0.12) 0%, transparent 45%),
    linear-gradient(200deg, #e8d4a0 0%, #f0e3c0 40%, #edddb0 70%, #f5e6c8 100%)
  `,
}

// ─── BibleBook ────────────────────────────────────────────────────────────────

export default function BibleBook({ chapters, initialIdx, translation, onClose }: Props) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx)
  const [chapterData, setChapterData] = useState<BibleResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turning, setTurning] = useState(false)
  const [animY, setAnimY] = useState(0)
  const [animOpacity, setAnimOpacity] = useState(1)
  const touchStartX = useRef<number | null>(null)

  const loadChapter = useCallback(async (idx: number, trans: Translation) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchChapter(chapters[idx], trans)
      setChapterData(data)
    } catch {
      setError('Could not load chapter. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [chapters])

  useEffect(() => {
    loadChapter(currentIdx, translation)
  }, [currentIdx, translation, loadChapter])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') turn(1)
      if (e.key === 'ArrowLeft') turn(-1)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Touch/swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 60) turn(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  async function turn(dir: 1 | -1) {
    const newIdx = currentIdx + dir
    if (newIdx < 0 || newIdx >= chapters.length || turning) return

    setTurning(true)
    // Phase 1: flip current page out
    setAnimY(dir * -90)
    setAnimOpacity(0.3)
    await delay(280)

    // Swap content
    setCurrentIdx(newIdx)
    setAnimY(dir * 90)
    setAnimOpacity(0.3)
    await delay(20)

    // Phase 2: flip new page in
    setAnimY(0)
    setAnimOpacity(1)
    await delay(280)
    setTurning(false)
  }

  const canPrev = currentIdx > 0
  const canNext = currentIdx < chapters.length - 1

  return (
    <div
      className='fixed inset-0 z-50 flex flex-col items-center justify-center'
      style={{ background: 'rgba(15, 10, 5, 0.97)' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Ambient glow */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(180,130,50,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className='absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700 transition-all'
      >
        <X size={18} />
      </button>

      {/* Translation badge */}
      <div className='absolute top-5 left-5 z-20 text-xs text-stone-500 uppercase tracking-widest'>
        {translation}
      </div>

      {/* The Open Book */}
      <div
        className='w-full max-w-6xl px-2 sm:px-6 flex flex-col items-center gap-5'
        style={{ perspective: '2000px' }}
      >
        <div className='relative w-full flex items-stretch justify-center'>

          {/* ── Left Page (TOC) — desktop only ── */}
          <div
            className='hidden md:flex flex-col w-[46%] rounded-l-sm overflow-hidden'
            style={{
              background: PAGE_BG.left,
              boxShadow: 'inset -12px 0 25px rgba(0,0,0,0.08), inset 4px 0 8px rgba(255,240,200,0.3)',
              minHeight: '580px',
            }}
          >
            <TOCPage
              chapters={chapters}
              currentIdx={currentIdx}
              onSelect={idx => { if (!turning) { setCurrentIdx(idx) } }}
            />
          </div>

          {/* ── Spine ── */}
          <div
            className='hidden md:block w-[28px] shrink-0 relative z-10'
            style={{
              background: 'linear-gradient(90deg, #1a0e07 0%, #3d200e 20%, #5c3018 45%, #3d200e 75%, #1a0e07 100%)',
              boxShadow: '-6px 0 20px rgba(0,0,0,0.6), 6px 0 20px rgba(0,0,0,0.6), inset 0 0 8px rgba(255,200,100,0.05)',
            }}
          >
            {/* Spine decoration */}
            <div className='absolute inset-x-0 top-6 bottom-6 flex flex-col items-center justify-between opacity-40'>
              <div className='w-px flex-1' style={{ background: 'linear-gradient(to bottom, transparent, #c8a060, transparent)' }} />
              <div className='w-4 h-px bg-amber-600/60' />
              <div className='w-px flex-1' style={{ background: 'linear-gradient(to bottom, transparent, #c8a060, transparent)' }} />
            </div>
          </div>

          {/* ── Right Page (Reading) ── */}
          <motion.div
            animate={{ rotateY: animY, opacity: animOpacity }}
            transition={{ duration: 0.28, ease: animOpacity < 1 ? 'easeIn' : 'easeOut' }}
            className='w-full md:w-[46%] flex flex-col overflow-hidden rounded-r-sm md:rounded-l-none rounded-l-sm'
            style={{
              background: PAGE_BG.right,
              boxShadow: 'inset 12px 0 25px rgba(0,0,0,0.08), inset -4px 0 8px rgba(255,240,200,0.3), 8px 0 30px rgba(0,0,0,0.5)',
              minHeight: '580px',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
            }}
          >
            {loading ? (
              <ParchmentLoader />
            ) : error ? (
              <div className='flex-1 flex items-center justify-center p-8'>
                <p style={{ fontFamily: 'IM Fell English, serif' }} className='text-amber-900/70 text-center text-sm italic'>
                  {error}
                </p>
              </div>
            ) : chapterData ? (
              <ChapterPage
                data={chapterData}
                pageNum={currentIdx + 1}
                totalPages={chapters.length}
              />
            ) : null}
          </motion.div>

          {/* Book base shadow */}
          <div
            className='absolute -bottom-3 left-1/4 right-1/4 h-5 rounded-full blur-lg'
            style={{ background: 'rgba(0,0,0,0.7)' }}
          />
        </div>

        {/* Navigation buttons */}
        <div className='flex items-center gap-6'>
          <button
            onClick={() => turn(-1)}
            disabled={!canPrev || turning}
            className='group flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.97]'
            style={{
              background: canPrev ? 'rgba(92,48,24,0.9)' : 'rgba(40,30,20,0.5)',
              color: canPrev ? '#f5e6c8' : 'rgba(245,230,200,0.3)',
              border: '1px solid rgba(180,130,50,0.3)',
              fontFamily: 'IM Fell English, serif',
            }}
          >
            <CaretLeft size={14} />
            Previous
          </button>

          <span
            className='text-xs tracking-widest'
            style={{ color: 'rgba(180,130,50,0.7)', fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}
          >
            {currentIdx + 1} · {chapters[currentIdx]}
          </span>

          <button
            onClick={() => turn(1)}
            disabled={!canNext || turning}
            className='group flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.97]'
            style={{
              background: canNext ? 'rgba(92,48,24,0.9)' : 'rgba(40,30,20,0.5)',
              color: canNext ? '#f5e6c8' : 'rgba(245,230,200,0.3)',
              border: '1px solid rgba(180,130,50,0.3)',
              fontFamily: 'IM Fell English, serif',
            }}
          >
            Next
            <CaretRight size={14} />
          </button>
        </div>

        <p
          className='text-xs text-center'
          style={{ color: 'rgba(180,130,50,0.4)', fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}
        >
          Use arrow keys or swipe to turn pages
        </p>
      </div>
    </div>
  )
}

// ─── Chapter page content ─────────────────────────────────────────────────────

function ChapterPage({ data, pageNum, totalPages }: {
  data: BibleResponse
  pageNum: number
  totalPages: number
}) {
  const lines = data.verses

  return (
    <div className='flex flex-col h-full'>
      {/* Top ornamental rule */}
      <OrnamentalRule />

      {/* Chapter header */}
      <div className='text-center px-8 pt-2 pb-4'>
        <p
          className='text-[10px] tracking-[0.3em] uppercase mb-3'
          style={{ color: '#7a5c2e', fontFamily: 'IM Fell English, serif' }}
        >
          {data.verses[0]?.book_name}
        </p>
        <h2
          className='leading-tight'
          style={{
            fontFamily: 'UnifrakturMaguntia, cursive',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            color: '#3d1f0a',
            textShadow: '0 1px 2px rgba(100,60,20,0.15)',
          }}
        >
          {data.reference}
        </h2>
      </div>

      {/* Decorative divider */}
      <VerseRuleDivider />

      {/* Verse text */}
      <div className='flex-1 overflow-y-auto px-6 md:px-8 py-3'>
        <p
          className='leading-loose text-justify'
          style={{
            fontFamily: 'IM Fell English, serif',
            fontSize: 'clamp(0.92rem, 1.6vw, 1.05rem)',
            color: '#2c1a08',
            hyphens: 'auto',
          }}
        >
          {lines.map((v, i) => (
            <span key={v.verse}>
              {i === 0 ? (
                <DropCap verse={v} />
              ) : (
                <>
                  <sup
                    style={{
                      fontFamily: 'IM Fell English, serif',
                      fontSize: '0.6em',
                      color: '#8b5e2a',
                      marginRight: '1px',
                      verticalAlign: 'super',
                      fontStyle: 'normal',
                    }}
                  >
                    {v.verse}
                  </sup>
                  {v.text.replace(/\n/g, ' ')}{' '}
                </>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Bottom ornamental rule + page number */}
      <div className='px-6 md:px-8 pb-4'>
        <VerseRuleDivider />
        <div className='flex items-center justify-between mt-2'>
          <span
            className='text-[10px]'
            style={{ color: '#8b6a3a', fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}
          >
            {data.verses[0]?.book_name}
          </span>
          <span
            className='text-[10px] tracking-widest'
            style={{ color: '#8b6a3a', fontFamily: 'Cinzel Decorative, serif' }}
          >
            {toRoman(pageNum)}
          </span>
          <span
            className='text-[10px]'
            style={{ color: '#8b6a3a', fontFamily: 'IM Fell English, serif', fontStyle: 'italic' }}
          >
            of {toRoman(totalPages)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Drop cap for first verse ─────────────────────────────────────────────────

function DropCap({ verse }: { verse: BibleVerse }) {
  const text = verse.text.replace(/\n/g, ' ').trim()
  const first = text.charAt(0)
  const rest = text.slice(1)

  return (
    <>
      <sup
        style={{
          fontFamily: 'IM Fell English, serif',
          fontSize: '0.6em',
          color: '#8b5e2a',
          marginRight: '1px',
          verticalAlign: 'super',
          fontStyle: 'normal',
        }}
      >
        {verse.verse}
      </sup>
      <span
        className='float-left mr-1 mt-0.5 leading-none select-none'
        style={{
          fontFamily: 'Cinzel Decorative, serif',
          fontSize: 'clamp(3.5rem, 6vw, 4.5rem)',
          color: '#7a3b0f',
          lineHeight: '0.85',
          textShadow: '1px 1px 2px rgba(100,50,10,0.2)',
        }}
      >
        {first}
      </span>
      {rest}{' '}
    </>
  )
}

// ─── TOC (left page) ─────────────────────────────────────────────────────────

function TOCPage({ chapters, currentIdx, onSelect }: {
  chapters: string[]
  currentIdx: number
  onSelect: (i: number) => void
}) {
  return (
    <div className='flex flex-col h-full'>
      <OrnamentalRule />

      <div className='text-center px-6 pt-2 pb-4'>
        <h3
          className='leading-tight'
          style={{
            fontFamily: 'UnifrakturMaguntia, cursive',
            fontSize: '1.6rem',
            color: '#3d1f0a',
          }}
        >
          Contents
        </h3>
      </div>

      <VerseRuleDivider />

      <div className='flex-1 overflow-y-auto px-6 py-4'>
        <ul className='space-y-1.5'>
          {chapters.map((ch, i) => {
            const isActive = i === currentIdx
            return (
              <li key={i}>
                <button
                  onClick={() => onSelect(i)}
                  className='w-full text-left flex items-baseline gap-3 group transition-all'
                >
                  <span
                    className='text-[10px] shrink-0 tabular-nums'
                    style={{
                      fontFamily: 'Cinzel Decorative, serif',
                      color: isActive ? '#7a3b0f' : '#c4a06a',
                      minWidth: '1.8rem',
                    }}
                  >
                    {toRoman(i + 1)}
                  </span>
                  <span
                    className='flex-1 py-1 border-b leading-tight transition-colors'
                    style={{
                      fontFamily: 'IM Fell English, serif',
                      fontSize: '0.95rem',
                      color: isActive ? '#3d1f0a' : '#6b4c28',
                      borderColor: 'rgba(140,100,50,0.2)',
                      fontWeight: isActive ? 'bold' : 'normal',
                    }}
                  >
                    {ch}
                  </span>
                  {isActive && (
                    <span className='text-amber-700 text-xs shrink-0' style={{ fontFamily: 'IM Fell English' }}>
                      ✦
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className='px-6 pb-4'>
        <VerseRuleDivider />
        <p
          className='text-center mt-2 text-[10px] italic'
          style={{ color: '#8b6a3a', fontFamily: 'IM Fell English, serif' }}
        >
          Click any chapter to read
        </p>
      </div>
    </div>
  )
}

// ─── Decorative elements ──────────────────────────────────────────────────────

function OrnamentalRule() {
  return (
    <div className='px-4 pt-5 pb-1 flex items-center justify-center'>
      <div className='w-full flex items-center gap-2'>
        <div className='flex-1 h-px' style={{ background: 'linear-gradient(to right, transparent, #c8a050, transparent)' }} />
        <OrnamentSVG />
        <div className='flex-1 h-px' style={{ background: 'linear-gradient(to right, transparent, #c8a050, transparent)' }} />
      </div>
    </div>
  )
}

function VerseRuleDivider() {
  return (
    <div className='px-6 my-1 flex items-center gap-2'>
      <div className='flex-1 h-px' style={{ background: 'rgba(140,100,40,0.3)' }} />
      <div className='w-1 h-1 rounded-full' style={{ background: 'rgba(140,100,40,0.5)' }} />
      <div className='flex-1 h-px' style={{ background: 'rgba(140,100,40,0.3)' }} />
    </div>
  )
}

function OrnamentSVG() {
  return (
    <svg width='32' height='16' viewBox='0 0 32 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        d='M16 2 L18 8 L16 14 L14 8 Z'
        fill='rgba(160,110,40,0.6)'
      />
      <circle cx='4' cy='8' r='2' fill='rgba(160,110,40,0.4)' />
      <circle cx='28' cy='8' r='2' fill='rgba(160,110,40,0.4)' />
      <path d='M6 8 Q10 5 14 8 Q10 11 6 8Z' fill='rgba(160,110,40,0.3)' />
      <path d='M26 8 Q22 5 18 8 Q22 11 26 8Z' fill='rgba(160,110,40,0.3)' />
    </svg>
  )
}

function ParchmentLoader() {
  return (
    <div className='flex-1 p-8 pt-16 space-y-4'>
      <div className='h-7 w-1/2 mx-auto rounded shimmer opacity-40' />
      <div className='h-px w-full' style={{ background: 'rgba(140,100,40,0.2)' }} />
      {[90, 80, 95, 75, 88, 82, 70, 85, 78, 60].map((w, i) => (
        <div
          key={i}
          className='h-4 rounded shimmer opacity-30'
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  )
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
