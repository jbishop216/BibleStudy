'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle, Circle, BookOpen, ArrowRight, Books,
  CaretLeft, CaretRight, X, ArrowCounterClockwise, BookBookmark,
} from '@phosphor-icons/react'
import { fetchChapter, type BibleResponse, type Translation, TRANSLATIONS, DEFAULT_TRANSLATION } from '@/lib/bible'
import { updateWeekProgress, getWeekProgress, getTranslation, saveTranslation } from '@/lib/storage'
import BibleBook from './BibleBook'

interface Props {
  weekId: number
  reading: string
  chapters: string[]
  onSwitchToHEAR: () => void
}

export default function ReadingSection({ weekId, reading, chapters, onSwitchToHEAR }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [readingDone, setReadingDone] = useState(false)

  // Inline chapter reader state
  const [activeChapterIdx, setActiveChapterIdx] = useState<number | null>(null)
  const [chapterData, setChapterData] = useState<BibleResponse | null>(null)
  const [chapterLoading, setChapterLoading] = useState(false)
  const [chapterError, setChapterError] = useState('')
  const [translation, setTranslation] = useState<Translation>(DEFAULT_TRANSLATION)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base')

  // Bible Book overlay state
  const [bookOpen, setBookOpen] = useState(false)
  const [bookStartIdx, setBookStartIdx] = useState(0)

  // Load saved progress + translation preference
  useEffect(() => {
    const p = getWeekProgress(weekId)
    if (p.readingComplete) {
      setReadingDone(true)
      setChecked(new Set(chapters.map((_, i) => i)))
    }
    const t = getTranslation() as Translation
    setTranslation(t)
  }, [weekId, chapters])

  const loadChapter = useCallback(async (ref: string, trans: Translation) => {
    setChapterLoading(true)
    setChapterError('')
    setChapterData(null)
    try {
      const data = await fetchChapter(ref, trans)
      setChapterData(data)
    } catch {
      setChapterError(`Could not load "${ref}". Check your connection and try again.`)
    } finally {
      setChapterLoading(false)
    }
  }, [])

  function openChapter(idx: number) {
    setActiveChapterIdx(idx)
    loadChapter(chapters[idx], translation)
  }

  function openBookAt(idx: number) {
    setBookStartIdx(idx)
    setBookOpen(true)
  }

  function closeChapter() {
    setActiveChapterIdx(null)
    setChapterData(null)
    setChapterError('')
  }

  function handleTranslationChange(t: Translation) {
    setTranslation(t)
    saveTranslation(t)
    if (activeChapterIdx !== null) {
      loadChapter(chapters[activeChapterIdx], t)
    }
  }

  function markChapterRead(idx: number) {
    const next = new Set(checked)
    next.has(idx) ? next.delete(idx) : next.add(idx)
    setChecked(next)
  }

  function markAllComplete() {
    updateWeekProgress(weekId, { readingComplete: true })
    setReadingDone(true)
    setChecked(new Set(chapters.map((_, i) => i)))
  }

  const navPrev = () => {
    if (activeChapterIdx === null || activeChapterIdx <= 0) return
    openChapter(activeChapterIdx - 1)
  }
  const navNext = () => {
    if (activeChapterIdx === null || activeChapterIdx >= chapters.length - 1) return
    markChapterRead(activeChapterIdx)
    openChapter(activeChapterIdx + 1)
  }

  const progress = chapters.length > 0 ? checked.size / chapters.length : 0
  const fontSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[fontSize]

  // ── Inline Chapter Reader ───────────────────────────────────────────────────
  if (activeChapterIdx !== null) {
    const chRef = chapters[activeChapterIdx]
    const isRead = checked.has(activeChapterIdx)

    return (
      <>
        {bookOpen && (
          <BibleBook
            chapters={chapters}
            initialIdx={bookStartIdx}
            translation={translation}
            onClose={() => setBookOpen(false)}
          />
        )}
      <div className='space-y-4'>
        {/* Reader toolbar */}
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <div className='flex items-center gap-2'>
            <button
              onClick={closeChapter}
              className='flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors'
            >
              <CaretLeft size={14} />
              All chapters
            </button>
            <span className='text-stone-300'>·</span>
            <span className='font-semibold text-zinc-900 text-sm'>{chRef}</span>
          </div>

          <div className='flex items-center gap-2'>
            {/* Bible book view */}
            <button
              onClick={() => openBookAt(activeChapterIdx)}
              className='flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all'
            >
              <BookBookmark size={13} />
              Bible View
            </button>

            {/* Font size */}
            <div className='flex items-center gap-0.5 bg-stone-100 rounded-lg p-1'>
              {(['sm', 'base', 'lg'] as const).map((size, si) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 rounded-md transition-all font-medium
                    ${fontSize === size ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-700'}`}
                  style={{ fontSize: si === 0 ? '10px' : si === 1 ? '12px' : '14px' }}
                >
                  A
                </button>
              ))}
            </div>

            {/* Translation */}
            <select
              value={translation}
              onChange={e => handleTranslationChange(e.target.value as Translation)}
              className='text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400 bg-white text-zinc-600'
            >
              {TRANSLATIONS.map(t => (
                <option key={t.id} value={t.id}>{t.shortName}</option>
              ))}
            </select>

            <button onClick={closeChapter} className='p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors'>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chapter progress pills */}
        <div className='flex flex-wrap gap-1.5'>
          {chapters.map((ch, i) => {
            const isActive = i === activeChapterIdx
            const isDone = checked.has(i)
            return (
              <button
                key={i}
                onClick={() => openChapter(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-amber-700 text-white'
                    : isDone
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-stone-100 text-zinc-500 hover:bg-stone-200'
                  }`}
              >
                {isDone && !isActive ? '✓ ' : ''}{ch.split(' ').slice(-1)[0]}
              </button>
            )
          })}
        </div>

        {/* Chapter text */}
        <div className='bg-white border border-stone-200 rounded-2xl overflow-hidden'>
          {chapterLoading && (
            <div className='p-8 space-y-3'>
              {[95, 88, 92, 76, 85, 90, 70, 80].map((w, i) => (
                <div key={i} className='h-4 rounded shimmer' style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
          {chapterError && (
            <div className='p-6'>
              <p className='text-sm text-red-500 mb-3'>{chapterError}</p>
              <button
                onClick={() => loadChapter(chRef, translation)}
                className='flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900'
              >
                <ArrowCounterClockwise size={13} /> Try again
              </button>
            </div>
          )}
          {chapterData && !chapterLoading && (
            <div className='p-6 md:p-8'>
              <h2 className='font-semibold text-zinc-900 text-lg mb-6 pb-4 border-b border-stone-100'>
                {chapterData.reference}
                <span className='ml-2 text-xs font-normal text-zinc-400'>
                  {TRANSLATIONS.find(t => t.id === translation)?.name ?? translation.toUpperCase()}
                </span>
              </h2>
              <div className={`${fontSizeClass} leading-8 text-zinc-700`}>
                {chapterData.verses.map(v => (
                  <span key={v.verse} className='inline'>
                    <sup className='text-amber-600 font-semibold text-[10px] mr-0.5 select-none'>{v.verse}</sup>
                    {v.text.replace(/\n/g, ' ')}{' '}
                  </span>
                ))}
              </div>
              <p className='mt-8 text-xs text-zinc-400 border-t border-stone-100 pt-4'>
                {chapterData.reference} · {TRANSLATIONS.find(t => t.id === translation)?.name}
              </p>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className='flex items-center justify-between gap-3 flex-wrap'>
          <div className='flex items-center gap-2'>
            <button
              onClick={navPrev}
              disabled={activeChapterIdx <= 0}
              className='flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-zinc-500 hover:text-zinc-900 hover:border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
            >
              <CaretLeft size={14} /> Prev
            </button>
            <button
              onClick={navNext}
              disabled={activeChapterIdx >= chapters.length - 1}
              className='flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-sm text-zinc-500 hover:text-zinc-900 hover:border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
            >
              Next <CaretRight size={14} />
            </button>
          </div>

          <button
            onClick={() => markChapterRead(activeChapterIdx)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]
              ${isRead
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-amber-700 text-white hover:bg-amber-800'
              }`}
          >
            {isRead
              ? <><CheckCircle size={15} weight='fill' className='text-emerald-500' /> Marked read</>
              : <><Circle size={15} /> Mark as read</>
            }
          </button>
        </div>
      </div>
      </>
    )
  }

  // ── Chapter List ────────────────────────────────────────────────────────────
  return (
    <>
      {bookOpen && (
        <BibleBook
          chapters={chapters}
          initialIdx={bookStartIdx}
          translation={translation}
          onClose={() => setBookOpen(false)}
        />
      )}
    <div className='space-y-6'>
      <div className='bg-white border border-stone-200 rounded-2xl p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div>
            <h2 className='font-semibold text-zinc-900 text-lg mb-1'>This Week&apos;s Reading</h2>
            <p className='text-sm text-zinc-500'>
              {chapters.length} chapters · read inline or open the Bible view
            </p>
          </div>
          <div className='flex items-center gap-2'>
            {/* Open full Bible book view */}
            <button
              onClick={() => openBookAt(0)}
              className='flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 active:scale-[0.98] transition-all'
            >
              <BookBookmark size={14} />
              <span className='hidden sm:inline'>Open</span> Bible View
            </button>
            <div className='w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0'>
              <Books size={20} className='text-amber-700' />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className='mb-5'>
          <div className='flex items-center justify-between text-xs text-zinc-400 mb-1.5'>
            <span>Reading progress</span>
            <span>{checked.size}/{chapters.length} chapters</span>
          </div>
          <div className='h-1.5 bg-stone-100 rounded-full overflow-hidden'>
            <div
              className='h-full bg-amber-500 rounded-full transition-all duration-500'
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Chapter grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {chapters.map((ch, i) => {
            const isRead = checked.has(i)
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-xl border transition-all
                  ${isRead ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-200 hover:border-stone-300'}`}
              >
                {/* Checkbox */}
                <button onClick={() => markChapterRead(i)} className='p-3 shrink-0' title={isRead ? 'Mark unread' : 'Mark as read'}>
                  {isRead
                    ? <CheckCircle size={18} weight='fill' className='text-emerald-500' />
                    : <Circle size={18} className='text-zinc-300 hover:text-zinc-500 transition-colors' />
                  }
                </button>

                {/* Chapter name */}
                <button
                  onClick={() => openChapter(i)}
                  className={`flex-1 py-3 text-left text-sm font-medium transition-colors
                    ${isRead ? 'text-emerald-700' : 'text-zinc-700 hover:text-amber-700'}`}
                >
                  {ch}
                </button>

                {/* Read (inline) */}
                <button
                  onClick={() => openChapter(i)}
                  className='px-2 py-3 text-xs text-zinc-400 hover:text-amber-600 transition-colors flex items-center gap-1 shrink-0'
                  title='Read inline'
                >
                  <BookOpen size={13} />
                </button>

                {/* Bible View */}
                <button
                  onClick={() => openBookAt(i)}
                  className='px-2 py-3 text-xs text-zinc-400 hover:text-amber-600 transition-colors flex items-center gap-1 shrink-0 border-l border-stone-200'
                  title='Open Bible view'
                >
                  <BookBookmark size={13} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* What to look for */}
      <div className='bg-amber-50 border border-amber-100 rounded-2xl p-5'>
        <h3 className='font-semibold text-amber-900 text-sm mb-3 flex items-center gap-2'>
          <BookOpen size={15} className='text-amber-600' />
          As you read, look for...
        </h3>
        <ul className='space-y-2 text-sm text-amber-800'>
          {[
            ['H', 'Highlight', "A verse that highlights something about God's character or a command that stands out"],
            ['E', 'Explain', 'Context that helps you explain what the author intended'],
            ['A', 'Apply', 'A truth you can apply to your life this week'],
            ['R', 'Respond', 'Something to bring to God in prayer as a response'],
          ].map(([letter, word, desc]) => (
            <li key={letter} className='flex items-start gap-2'>
              <span className='font-bold text-amber-700 shrink-0 mt-0.5'>{letter}</span>
              <span>A verse that <strong>{word.toLowerCase()}s</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className='flex flex-col sm:flex-row gap-3'>
        {!readingDone ? (
          <button
            onClick={markAllComplete}
            className='flex items-center justify-center gap-2 px-5 py-3 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 active:scale-[0.98] transition-all'
          >
            <CheckCircle size={16} weight='fill' />
            Mark All Reading Complete
          </button>
        ) : (
          <div className='flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium'>
            <CheckCircle size={16} weight='fill' className='text-emerald-500' />
            Reading complete
          </div>
        )}
        <button
          onClick={onSwitchToHEAR}
          className='flex items-center justify-center gap-2 px-5 py-3 bg-white border border-stone-200 text-zinc-700 rounded-xl font-medium text-sm hover:border-amber-300 hover:text-amber-700 active:scale-[0.98] transition-all'
        >
          Start HEAR Analysis
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
    </>
  )
}
