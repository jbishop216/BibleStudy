'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Circle, CaretRight, ClockCounterClockwise } from '@phosphor-icons/react'
import { getWeekProgress, getCurrentUser, initializeOwnerProgress } from '@/lib/storage'

interface WeekItem {
  id: number
  label: string
  reading: string
  memoryDisplay: string
  memoryRef: string
}

interface Props {
  weeks: WeekItem[]
  currentWeekId: number
}

interface ProgressMap {
  [weekId: number]: {
    reading: boolean
    hear: boolean
    memory: boolean
  }
}

export default function WeekListClient({ weeks, currentWeekId }: Props) {
  const [progress, setProgress] = useState<ProgressMap>({})
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    // One-time initialisation: mark all past weeks complete for Jess
    if (getCurrentUser() === 'jess') {
      initializeOwnerProgress(currentWeekId)
    }

    const map: ProgressMap = {}
    weeks.forEach(w => {
      const p = getWeekProgress(w.id)
      map[w.id] = {
        reading: p.readingComplete,
        hear: p.hearComplete,
        memory: p.memoryComplete,
      }
    })
    setProgress(map)
  }, [weeks, currentWeekId])

  const pastWeeks    = weeks.filter(w => w.id < currentWeekId)
  const currentAndFuture = weeks.filter(w => w.id >= currentWeekId)
  const visibleWeeks = showHistory ? weeks : currentAndFuture

  const completedCount = pastWeeks.filter(w => {
    const p = progress[w.id]
    return p && p.reading && p.hear && p.memory
  }).length

  return (
    <div>
      {/* Overall progress bar */}
      {pastWeeks.length > 0 && (
        <div className='mb-6 flex items-center gap-3'>
          <div className='flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden'>
            <div
              className='h-full bg-amber-500 rounded-full transition-all duration-700'
              style={{ width: `${(completedCount / weeks.length) * 100}%` }}
            />
          </div>
          <span className='text-xs text-zinc-500 whitespace-nowrap'>
            {completedCount}/{weeks.length} weeks complete
          </span>
        </div>
      )}

      {/* History toggle */}
      {pastWeeks.length > 0 && (
        <button
          onClick={() => setShowHistory(h => !h)}
          className='mb-3 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-700 transition-colors'
        >
          <ClockCounterClockwise size={13} />
          {showHistory
            ? 'Hide previous weeks'
            : `Show previous ${pastWeeks.length} week${pastWeeks.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Week list */}
      <div className='space-y-1'>
        {visibleWeeks.map(week => {
          const p = progress[week.id] ?? { reading: false, hear: false, memory: false }
          const isCurrent = week.id === currentWeekId
          const isPast    = week.id < currentWeekId
          const allDone   = p.reading && p.hear && p.memory

          return (
            <Link
              key={week.id}
              href={`/week/${week.id}`}
              className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150
                ${isCurrent
                  ? 'bg-amber-50 border border-amber-200 hover:border-amber-300'
                  : isPast && allDone
                    ? 'hover:bg-emerald-50/50 hover:border hover:border-emerald-100 border border-transparent'
                    : 'hover:bg-white hover:border hover:border-stone-200 border border-transparent'
                }`}
            >
              {/* Week number */}
              <span className={`font-mono text-xs w-6 text-right shrink-0
                ${isCurrent ? 'text-amber-700 font-semibold' : 'text-zinc-400'}`}>
                {week.id}
              </span>

              {/* Date */}
              <span className={`text-xs w-16 shrink-0
                ${isCurrent ? 'text-amber-700 font-medium' : 'text-zinc-400'}`}>
                {week.label}
              </span>

              {/* Content */}
              <div className='flex-1 min-w-0'>
                <p className={`text-sm font-medium truncate
                  ${isCurrent ? 'text-zinc-900' : isPast ? 'text-zinc-500' : 'text-zinc-700'}`}>
                  {week.reading}
                </p>
                <p className='text-xs text-zinc-400 truncate'>{week.memoryDisplay}</p>
              </div>

              {/* Progress dots */}
              <div className='flex items-center gap-1.5 shrink-0'>
                <span title='Reading'>
                  {p.reading
                    ? <CheckCircle size={14} weight='fill' className='text-emerald-500' />
                    : <Circle size={14} className='text-zinc-300' />}
                </span>
                <span title='HEAR Analysis'>
                  {p.hear
                    ? <CheckCircle size={14} weight='fill' className='text-emerald-500' />
                    : <Circle size={14} className='text-zinc-300' />}
                </span>
                <span title='Memory Verse'>
                  {p.memory
                    ? <CheckCircle size={14} weight='fill' className='text-emerald-500' />
                    : <Circle size={14} className='text-zinc-300' />}
                </span>
              </div>

              <CaretRight
                size={14}
                className='text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors'
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
