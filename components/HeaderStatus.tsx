'use client'

import { useState, useEffect } from 'react'
import { Clock } from '@phosphor-icons/react'

function getTodayStatus(): { dateStr: string; isMeetingToday: boolean; isMeetingTomorrow: boolean } {
  const now = new Date()
  const day = now.getDay()   // 0=Sun … 6=Sat
  return {
    dateStr: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    isMeetingToday: day === 3,     // Wednesday
    isMeetingTomorrow: day === 2,  // Tuesday
  }
}

export default function HeaderStatus() {
  const [status, setStatus] = useState<ReturnType<typeof getTodayStatus> | null>(null)

  useEffect(() => {
    setStatus(getTodayStatus())
  }, [])

  if (!status) return null   // nothing on SSR — no hydration mismatch

  return (
    <>
      {(status.isMeetingToday || status.isMeetingTomorrow) && (
        <span className='hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full'>
          <Clock size={12} weight='fill' />
          {status.isMeetingToday ? 'Meeting tonight' : 'Meeting tomorrow'}
        </span>
      )}
      <span className='text-xs text-zinc-400'>{status.dateStr}</span>
    </>
  )
}
