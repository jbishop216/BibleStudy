'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Circle, BookOpen, ArrowRight, Books } from '@phosphor-icons/react'
import { updateWeekProgress, getWeekProgress } from '@/lib/storage'

interface Props {
  weekId: number
  reading: string
  chapters: string[]
  onSwitchToHEAR: () => void
}

export default function ReadingSection({ weekId, reading, chapters, onSwitchToHEAR }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [readingDone, setReadingDone] = useState(false)

  useEffect(() => {
    const p = getWeekProgress(weekId)
    if (p.readingComplete) {
      setReadingDone(true)
      const all = new Set(chapters.map((_, i) => i))
      setChecked(all)
    }
  }, [weekId, chapters])

  function toggle(i: number) {
    const next = new Set(checked)
    next.has(i) ? next.delete(i) : next.add(i)
    setChecked(next)
  }

  function markComplete() {
    updateWeekProgress(weekId, { readingComplete: true })
    setReadingDone(true)
    const all = new Set(chapters.map((_, i) => i))
    setChecked(all)
  }

  const progress = chapters.length > 0 ? checked.size / chapters.length : 0

  return (
    <div className='space-y-6'>
      {/* Overview card */}
      <div className='bg-white border border-stone-200 rounded-2xl p-6'>
        <div className='flex items-start justify-between mb-4'>
          <div>
            <h2 className='font-semibold text-zinc-900 text-lg mb-1'>{reading}</h2>
            <p className='text-sm text-zinc-500'>
              {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} this week
            </p>
          </div>
          <div className='w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center'>
            <Books size={20} className='text-amber-700' />
          </div>
        </div>

        {/* Progress bar */}
        {chapters.length > 1 && (
          <div className='mb-4'>
            <div className='flex items-center justify-between text-xs text-zinc-400 mb-1.5'>
              <span>Progress</span>
              <span>{checked.size}/{chapters.length} chapters</span>
            </div>
            <div className='h-1.5 bg-stone-100 rounded-full overflow-hidden'>
              <div
                className='h-full bg-amber-500 rounded-full transition-all duration-500'
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Chapter checklist */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
          {chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 border text-left
                ${checked.has(i)
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-stone-50 border-stone-200 text-zinc-600 hover:border-stone-300'
                }`}
            >
              {checked.has(i)
                ? <CheckCircle size={14} weight='fill' className='text-emerald-500 shrink-0' />
                : <Circle size={14} className='text-zinc-300 shrink-0' />
              }
              <span className='truncate'>{ch}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Study tips */}
      <div className='bg-amber-50 border border-amber-100 rounded-2xl p-5'>
        <h3 className='font-semibold text-amber-900 text-sm mb-3 flex items-center gap-2'>
          <BookOpen size={15} className='text-amber-600' />
          As you read, look for...
        </h3>
        <ul className='space-y-2 text-sm text-amber-800'>
          <li className='flex items-start gap-2'>
            <span className='font-bold text-amber-600 shrink-0 mt-0.5'>H</span>
            <span>A verse that <strong>highlights</strong> something about God&apos;s character or a command that stands out</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='font-bold text-amber-600 shrink-0 mt-0.5'>E</span>
            <span>Context that helps you <strong>explain</strong> what the author intended</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='font-bold text-amber-600 shrink-0 mt-0.5'>A</span>
            <span>A truth you can <strong>apply</strong> to your life this week</span>
          </li>
          <li className='flex items-start gap-2'>
            <span className='font-bold text-amber-600 shrink-0 mt-0.5'>R</span>
            <span>Something to bring to God in prayer as a <strong>response</strong></span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className='flex flex-col sm:flex-row gap-3'>
        {!readingDone ? (
          <button
            onClick={markComplete}
            className='flex items-center justify-center gap-2 px-5 py-3 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 active:scale-[0.98] transition-all'
          >
            <CheckCircle size={16} weight='fill' />
            Mark Reading Complete
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
  )
}
