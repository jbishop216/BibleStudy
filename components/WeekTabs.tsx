'use client'

import { useState } from 'react'
import { BookOpen, Brain, PencilSimple } from '@phosphor-icons/react'
import ReadingSection from './ReadingSection'
import HEARJournal from './HEARJournal'
import MemoryVerse from './MemoryVerse'

interface Props {
  weekId: number
  reading: string
  memoryRef: string
  memoryDisplay: string
  chapters: string[]
  defaultTab: string
}

type Tab = 'reading' | 'hear' | 'memory'

const TABS: { id: Tab; label: string; icon: React.ElementType; short: string }[] = [
  { id: 'reading', label: 'Reading', icon: BookOpen, short: 'Reading' },
  { id: 'hear', label: 'HEAR Analysis', icon: PencilSimple, short: 'HEAR' },
  { id: 'memory', label: 'Memory Verse', icon: Brain, short: 'Memory' },
]

export default function WeekTabs({ weekId, reading, memoryRef, memoryDisplay, chapters, defaultTab }: Props) {
  const validTabs: Tab[] = ['reading', 'hear', 'memory']
  const initial: Tab = validTabs.includes(defaultTab as Tab) ? (defaultTab as Tab) : 'reading'
  const [active, setActive] = useState<Tab>(initial)

  return (
    <div>
      {/* Tab bar */}
      <div className='flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit'>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-white text-zinc-900 shadow-sm shadow-stone-200'
                  : 'text-zinc-500 hover:text-zinc-700'
                }`}
            >
              <Icon size={15} weight={isActive ? 'fill' : 'regular'} />
              <span className='hidden sm:inline'>{tab.label}</span>
              <span className='sm:hidden'>{tab.short}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className='stage-enter'>
        {active === 'reading' && (
          <ReadingSection
            weekId={weekId}
            reading={reading}
            chapters={chapters}
            onSwitchToHEAR={() => setActive('hear')}
          />
        )}
        {active === 'hear' && (
          <HEARJournal weekId={weekId} reading={reading} />
        )}
        {active === 'memory' && (
          <MemoryVerse weekId={weekId} memoryRef={memoryRef} memoryDisplay={memoryDisplay} />
        )}
      </div>
    </div>
  )
}
