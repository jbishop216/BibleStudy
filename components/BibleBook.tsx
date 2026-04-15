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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i] }
  }
  return result
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Page background gradients ────────────────────────────────────────────────

const LEFT_BG = `
  radial-gradient(ellipse at 5% 15%, rgba(180,130,50,0.2) 0%, transparent 50%),
  radial-gradient(ellipse at 90% 85%, rgba(160,110,40,0.14) 0%, transparent 45%),
  linear-gradient(200deg, #e6d09a 0%, #efdfb4 35%, #e9d9ac 65%, #f0e3c2 100%)
`
const RIGHT_BG = `
  radial-gradient(ellipse at 95% 15%, rgba(180,130,50,0.2) 0%, transparent 50%),
  radial-gradient(ellipse at 10% 85%, rgba(160,110,40,0.14) 0%, transparent 45%),
  linear-gradient(160deg, #f0e3c2 0%, #e9d9ac 35%, #efdfb4 65%, #e6d09a 100%)
`

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

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') turn(1)
      else if (e.key === 'ArrowLeft') turn(-1)
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 55) turn(dx < 0 ? 1 : -1)
    touchStartX.current = null
  }

  async function turn(dir: 1 | -1) {
    const newIdx = currentIdx + dir
    if (newIdx < 0 || newIdx >= chapters.length || turning) return
    setTurning(true)
    // Phase 1: flip out
    setAnimY(dir * -90)
    setAnimOpacity(0.25)
    await delay(260)
    // Swap
    setCurrentIdx(newIdx)
    setAnimY(dir * 90)
    setAnimOpacity(0.25)
    await delay(20)
    // Phase 2: flip in
    setAnimY(0)
    setAnimOpacity(1)
    await delay(260)
    setTurning(false)
  }

  const canPrev = currentIdx > 0
  const canNext = currentIdx < chapters.length - 1

  return (
    // Full-screen opaque overlay — z-[9999] to beat sticky headers
    <div
      className='fixed inset-0 flex flex-col items-center justify-center'
      style={{ zIndex: 9999, background: 'rgba(10, 6, 2, 0.98)', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Subtle ambient glow */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{ background: 'radial-gradient(ellipse at 50% 48%, rgba(180,130,50,0.07) 0%, transparent 65%)' }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        className='absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-all'
        style={{
          zIndex: 10000,
          background: 'rgba(80,50,20,0.7)',
          border: '1px solid rgba(180,130,50,0.3)',
          color: '#d4b483',
        }}
      >
        <X size={16} />
      </button>

      {/* Translation label */}
      <div
        className='absolute top-5 left-5 text-[10px] uppercase tracking-widest'
        style={{ color: 'rgba(180,130,50,0.5)', zIndex: 10000 }}
      >
        {translation}
      </div>

      {/* ── Main book layout ── */}
      <div className='w-full px-2 sm:px-4 md:px-6 flex flex-col items-center gap-3'
        style={{ maxWidth: '1100px', perspective: '2000px' }}
      >
        {/* The Book — explicit height so h-full works inside pages */}
        <div
          className='relative w-full flex items-stretch'
          style={{
            height: 'min(78dvh, 660px)',
            // Drop shadow beneath the book
            filter: 'drop-shadow(0 24px 40px rgba(0,0,0,0.8))',
          }}
        >

          {/* ── Left Page (TOC) — desktop only ── */}
          <div
            className='hidden md:flex flex-col w-[45%] shrink-0 rounded-l overflow-hidden'
            style={{
              background: LEFT_BG,
              boxShadow: 'inset -14px 0 28px rgba(0,0,0,0.09), inset 5px 0 10px rgba(255,245,210,0.25)',
            }}
          >
            <TOCPage
              chapters={chapters}
              currentIdx={currentIdx}
              onSelect={i => { if (!turning) setCurrentIdx(i) }}
            />
          </div>

          {/* ── Spine ── */}
          <div
            className='hidden md:block shrink-0'
            style={{
              width: '26px',
              background: 'linear-gradient(90deg,#110802 0%,#2e1408 18%,#4d2210 40%,#5c2e14 50%,#4d2210 62%,#2e1408 82%,#110802 100%)',
              boxShadow: '-8px 0 18px rgba(0,0,0,0.55), 8px 0 18px rgba(0,0,0,0.55)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Spine decorative line */}
            <div
              className='absolute top-6 bottom-6 left-1/2 -translate-x-1/2 w-px'
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(200,160,60,0.35), transparent)' }}
            />
          </div>

          {/* ── Right Page (Reading) ── */}
          <motion.div
            animate={{ rotateY: animY, opacity: animOpacity }}
            transition={{ duration: 0.26, ease: animOpacity < 0.5 ? 'easeIn' : 'easeOut' }}
            className='flex flex-col flex-1 rounded-r overflow-hidden'
            style={{
              background: RIGHT_BG,
              boxShadow: 'inset 14px 0 28px rgba(0,0,0,0.09), inset -5px 0 10px rgba(255,245,210,0.25), 6px 0 24px rgba(0,0,0,0.5)',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
            }}
          >
            {loading ? (
              <ParchmentLoader />
            ) : error ? (
              <div className='flex-1 flex items-center justify-center p-8'>
                <p style={{ fontFamily: "'IM Fell English', serif", color: '#7a5c2e', textAlign: 'center', fontStyle: 'italic' }}>
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
        </div>

        {/* ── Navigation ── */}
        <div className='flex items-center gap-4'>
          <NavButton onClick={() => turn(-1)} disabled={!canPrev || turning} label='Previous' icon={<CaretLeft size={13} />} iconLeft />
          <span style={{
            fontFamily: "'IM Fell English', serif",
            fontStyle: 'italic',
            fontSize: '0.8rem',
            color: 'rgba(200,160,60,0.6)',
            minWidth: '160px',
            textAlign: 'center',
          }}>
            {chapters[currentIdx]}
          </span>
          <NavButton onClick={() => turn(1)} disabled={!canNext || turning} label='Next' icon={<CaretRight size={13} />} />
        </div>

        <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: 'italic', fontSize: '0.7rem', color: 'rgba(180,130,50,0.35)' }}>
          Arrow keys or swipe to turn pages · Escape to close
        </p>
      </div>
    </div>
  )
}

// ─── Nav button ───────────────────────────────────────────────────────────────

function NavButton({ onClick, disabled, label, icon, iconLeft }: {
  onClick: () => void
  disabled: boolean
  label: string
  icon: React.ReactNode
  iconLeft?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className='flex items-center gap-2 px-4 py-2 rounded transition-all active:scale-[0.97]'
      style={{
        fontFamily: "'IM Fell English', serif",
        fontSize: '0.875rem',
        background: disabled ? 'rgba(30,18,8,0.6)' : 'rgba(80,45,15,0.85)',
        color: disabled ? 'rgba(200,160,60,0.25)' : 'rgba(240,220,170,0.9)',
        border: `1px solid ${disabled ? 'rgba(120,80,30,0.2)' : 'rgba(180,130,50,0.4)'}`,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {iconLeft && icon}
      {label}
      {!iconLeft && icon}
    </button>
  )
}

// ─── Chapter page content ─────────────────────────────────────────────────────

function ChapterPage({ data, pageNum, totalPages }: {
  data: BibleResponse
  pageNum: number
  totalPages: number
}) {
  return (
    // Use flex-col + flex-1 so this fills the parent's explicit height
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top ornament */}
      <OrnamentalRule />

      {/* Chapter heading */}
      <div style={{ textAlign: 'center', padding: '4px 28px 8px' }}>
        <p style={{
          fontFamily: "'IM Fell English', serif",
          fontSize: '0.65rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#7a5c2e',
          marginBottom: '6px',
        }}>
          {data.verses[0]?.book_name}
        </p>
        <h2 style={{
          fontFamily: "'UnifrakturMaguntia', cursive",
          fontSize: 'clamp(1.25rem, 2.8vw, 1.8rem)',
          color: '#3a1c08',
          lineHeight: 1.2,
          textShadow: '0 1px 2px rgba(80,40,10,0.15)',
        }}>
          {data.reference}
        </h2>
      </div>

      <RuleDivider />

      {/* Verse text — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 4px' }}>
        <p style={{
          fontFamily: "'IM Fell English', serif",
          fontSize: 'clamp(0.88rem, 1.5vw, 1rem)',
          color: '#241208',
          lineHeight: 1.85,
          textAlign: 'justify',
          hyphens: 'auto',
        }}>
          {data.verses.map((v, i) => (
            <span key={v.verse}>
              {i === 0 ? (
                <DropCap verse={v} />
              ) : (
                <>
                  <sup style={{
                    fontFamily: "'IM Fell English', serif",
                    fontSize: '0.58em',
                    color: '#8b5e2a',
                    marginRight: '1px',
                    verticalAlign: 'super',
                  }}>
                    {v.verse}
                  </sup>
                  {v.text.replace(/\n/g, ' ')}{' '}
                </>
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 28px 12px' }}>
        <RuleDivider />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          <span style={{ fontFamily: "'IM Fell English', serif", fontSize: '0.62rem', fontStyle: 'italic', color: '#8b6a3a' }}>
            {data.verses[0]?.book_name}
          </span>
          <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '0.6rem', color: '#8b6a3a', letterSpacing: '0.05em' }}>
            {toRoman(pageNum)}
          </span>
          <span style={{ fontFamily: "'IM Fell English', serif", fontSize: '0.62rem', fontStyle: 'italic', color: '#8b6a3a' }}>
            of {toRoman(totalPages)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Drop cap ─────────────────────────────────────────────────────────────────

function DropCap({ verse }: { verse: BibleVerse }) {
  const text = verse.text.replace(/\n/g, ' ').trim()
  const first = text.charAt(0)
  const rest = text.slice(1)
  return (
    <>
      <sup style={{ fontFamily: "'IM Fell English', serif", fontSize: '0.58em', color: '#8b5e2a', marginRight: '1px', verticalAlign: 'super' }}>
        {verse.verse}
      </sup>
      <span
        style={{
          float: 'left',
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 'clamp(3rem, 5.5vw, 4rem)',
          color: '#6b2e08',
          lineHeight: 0.82,
          marginRight: '4px',
          marginTop: '4px',
          textShadow: '1px 1px 3px rgba(80,30,5,0.18)',
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <OrnamentalRule />

      <div style={{ textAlign: 'center', padding: '4px 24px 8px' }}>
        <h3 style={{
          fontFamily: "'UnifrakturMaguntia', cursive",
          fontSize: 'clamp(1.1rem, 2.4vw, 1.6rem)',
          color: '#3a1c08',
          lineHeight: 1.2,
        }}>
          Contents
        </h3>
      </div>

      <RuleDivider />

      {/* Scrollable chapter list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {chapters.map((ch, i) => {
            const isActive = i === currentIdx
            return (
              <li key={i}>
                <button
                  onClick={() => onSelect(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(140,100,40,0.18)',
                    padding: '7px 2px',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontFamily: "'Cinzel Decorative', serif",
                    fontSize: '0.58rem',
                    color: isActive ? '#6b2e08' : '#b8904a',
                    minWidth: '1.6rem',
                    letterSpacing: '0.04em',
                  }}>
                    {toRoman(i + 1)}
                  </span>
                  <span style={{
                    fontFamily: "'IM Fell English', serif",
                    fontSize: 'clamp(0.82rem, 1.4vw, 0.95rem)',
                    color: isActive ? '#3a1c08' : '#6b4c28',
                    fontWeight: isActive ? 'bold' : 'normal',
                    fontStyle: isActive ? 'normal' : 'italic',
                    flex: 1,
                  }}>
                    {ch}
                  </span>
                  {isActive && (
                    <span style={{ color: '#8b4a14', fontSize: '0.75rem' }}>✦</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div style={{ padding: '6px 20px 12px' }}>
        <RuleDivider />
        <p style={{
          fontFamily: "'IM Fell English', serif",
          fontStyle: 'italic',
          fontSize: '0.65rem',
          textAlign: 'center',
          color: '#8b6a3a',
          marginTop: '6px',
        }}>
          Select a chapter to read
        </p>
      </div>
    </div>
  )
}

// ─── Decorative elements ──────────────────────────────────────────────────────

function OrnamentalRule() {
  return (
    <div style={{ padding: '14px 20px 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(180,130,50,0.6), transparent)' }} />
      <svg width='28' height='14' viewBox='0 0 28 14'>
        <path d='M14 1 L16 7 L14 13 L12 7 Z' fill='rgba(160,110,40,0.55)' />
        <circle cx='3' cy='7' r='1.8' fill='rgba(160,110,40,0.38)' />
        <circle cx='25' cy='7' r='1.8' fill='rgba(160,110,40,0.38)' />
        <path d='M5 7 Q9 4 12 7 Q9 10 5 7Z' fill='rgba(160,110,40,0.28)' />
        <path d='M23 7 Q19 4 16 7 Q19 10 23 7Z' fill='rgba(160,110,40,0.28)' />
      </svg>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(180,130,50,0.6), transparent)' }} />
    </div>
  )
}

function RuleDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 20px' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(140,100,40,0.25)' }} />
      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(140,100,40,0.4)' }} />
      <div style={{ flex: 1, height: '1px', background: 'rgba(140,100,40,0.25)' }} />
    </div>
  )
}

function ParchmentLoader() {
  return (
    <div style={{ flex: 1, padding: '40px 28px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[60, 90, 82, 95, 75, 88, 70, 85, 78, 92, 65, 80].map((w, i) => (
        <div key={i} className='shimmer' style={{ height: '14px', borderRadius: '3px', width: `${w}%`, opacity: 0.35 }} />
      ))}
    </div>
  )
}
