import Link from 'next/link'
import { BookOpen, Brain, ArrowRight, Clock } from '@phosphor-icons/react/dist/ssr'
import { SCHEDULE, getCurrentWeek, isMeetingToday, isMeetingTomorrow } from '@/lib/schedule'
import WeekListClient from '@/components/WeekListClient'

export default function HomePage() {
  const current = getCurrentWeek()
  const today = new Date()
  const meetingToday = isMeetingToday()
  const meetingTomorrow = isMeetingTomorrow()

  return (
    <div className='min-h-[100dvh] flex flex-col'>
      {/* ── Top Bar ── */}
      <header className='border-b border-stone-200 bg-[#f9f7f4]/80 backdrop-blur-sm sticky top-0 z-10'>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='w-7 h-7 bg-amber-700 rounded-lg flex items-center justify-center'>
              <BookOpen size={15} weight='fill' className='text-white' />
            </div>
            <span className='font-semibold text-zinc-900 tracking-tight'>Scripture Study</span>
          </div>
          <div className='flex items-center gap-3'>
            {(meetingToday || meetingTomorrow) && (
              <span className='hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full'>
                <Clock size={12} weight='fill' />
                {meetingToday ? 'Meeting tonight' : 'Meeting tomorrow'}
              </span>
            )}
            <span className='text-xs text-zinc-400'>
              {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      <main className='flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12'>
        {/* ── Hero: Current Week ── */}
        <div className='mb-10'>
          <p className='text-xs font-medium text-amber-700 uppercase tracking-widest mb-2'>
            Week {current.id} — {current.label}
          </p>
          <h1 className='text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 mb-1'>
            {current.reading}
          </h1>
          <p className='text-zinc-500 text-base mb-6'>
            Memory verse:{' '}
            <span className='text-zinc-700 font-medium'>{current.memoryDisplay}</span>
          </p>

          {/* CTA Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            {/* Reading */}
            <Link
              href={`/week/${current.id}`}
              className='group relative bg-white border border-stone-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-[0_4px_20px_-4px_rgba(180,83,9,0.12)] transition-all duration-200 active:scale-[0.98]'
            >
              <div className='flex items-start justify-between mb-8'>
                <div className='w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center'>
                  <BookOpen size={18} className='text-amber-700' />
                </div>
                <ArrowRight
                  size={16}
                  className='text-zinc-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all'
                />
              </div>
              <p className='font-semibold text-zinc-900 text-sm mb-0.5'>This Week&apos;s Reading</p>
              <p className='text-xs text-zinc-500 truncate'>
                {current.chapters[0]} – {current.chapters[current.chapters.length - 1]}
              </p>
            </Link>

            {/* HEAR */}
            <Link
              href={`/week/${current.id}?tab=hear`}
              className='group relative bg-white border border-stone-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-[0_4px_20px_-4px_rgba(180,83,9,0.12)] transition-all duration-200 active:scale-[0.98]'
            >
              <div className='flex items-start justify-between mb-8'>
                <div className='w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center'>
                  <svg
                    className='w-[18px] h-[18px] text-amber-700'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth={1.8}
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                    />
                  </svg>
                </div>
                <ArrowRight
                  size={16}
                  className='text-zinc-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all'
                />
              </div>
              <p className='font-semibold text-zinc-900 text-sm mb-0.5'>HEAR Analysis</p>
              <p className='text-xs text-zinc-500'>Highlight · Explain · Apply · Respond</p>
            </Link>

            {/* Memory */}
            <Link
              href={`/week/${current.id}?tab=memory`}
              className='group relative bg-white border border-stone-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-[0_4px_20px_-4px_rgba(180,83,9,0.12)] transition-all duration-200 active:scale-[0.98]'
            >
              <div className='flex items-start justify-between mb-8'>
                <div className='w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center'>
                  <Brain size={18} className='text-amber-700' />
                </div>
                <ArrowRight
                  size={16}
                  className='text-zinc-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all'
                />
              </div>
              <p className='font-semibold text-zinc-900 text-sm mb-0.5'>Memory Verse</p>
              <p className='text-xs text-zinc-500'>{current.memoryDisplay}</p>
            </Link>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className='flex items-center gap-4 mb-8'>
          <div className='flex-1 h-px bg-stone-200' />
          <span className='text-xs font-medium text-zinc-400 uppercase tracking-widest'>
            All Weeks
          </span>
          <div className='flex-1 h-px bg-stone-200' />
        </div>

        {/* ── Full Schedule (client component, shows progress) ── */}
        <WeekListClient
          currentWeekId={current.id}
          weeks={SCHEDULE.map(w => ({
            id: w.id,
            label: w.label,
            reading: `${w.chapters[0]} – ${w.chapters[w.chapters.length - 1]}`,
            memoryDisplay: w.memoryDisplay,
            memoryRef: w.memoryRef,
          }))}
        />
      </main>

      <footer className='border-t border-stone-200 py-4'>
        <p className='text-center text-xs text-zinc-400'>
          Scripture Study · Wednesday Night Fellowship
        </p>
      </footer>
    </div>
  )
}
