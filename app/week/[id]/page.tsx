import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { SCHEDULE } from '@/lib/schedule'
import WeekTabs from '@/components/WeekTabs'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateStaticParams() {
  return SCHEDULE.map(w => ({ id: String(w.id) }))
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const week = SCHEDULE.find(w => w.id === parseInt(id, 10))
  if (!week) return { title: 'Not Found' }
  return {
    title: `Week ${week.id} — ${week.reading} | Scripture Study`,
  }
}

export default async function WeekPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams
  const weekId = parseInt(id, 10)
  const week = SCHEDULE.find(w => w.id === weekId)

  if (!week) notFound()

  const prevWeek = SCHEDULE.find(w => w.id === weekId - 1)
  const nextWeek = SCHEDULE.find(w => w.id === weekId + 1)

  // Parse reading chapters for display
  const chapters = parseChapters(week.reading)

  return (
    <div className='min-h-[100dvh] flex flex-col bg-[#f9f7f4]'>
      {/* ── Header ── */}
      <header className='border-b border-stone-200 bg-[#f9f7f4]/80 backdrop-blur-sm sticky top-0 z-10'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Link
              href='/'
              className='flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors'
            >
              <ArrowLeft size={15} />
              <span className='hidden sm:inline'>All Weeks</span>
            </Link>
            <span className='text-stone-300'>·</span>
            <div className='flex items-center gap-2'>
              <div className='w-5 h-5 bg-amber-700 rounded flex items-center justify-center'>
                <BookOpen size={11} weight='fill' className='text-white' />
              </div>
              <span className='font-medium text-sm text-zinc-900'>
                Week {week.id}
              </span>
            </div>
          </div>

          {/* Prev / Next */}
          <div className='flex items-center gap-2 text-xs text-zinc-400'>
            {prevWeek && (
              <Link
                href={`/week/${prevWeek.id}`}
                className='hover:text-zinc-900 transition-colors'
              >
                ← Wk {prevWeek.id}
              </Link>
            )}
            {prevWeek && nextWeek && <span>·</span>}
            {nextWeek && (
              <Link
                href={`/week/${nextWeek.id}`}
                className='hover:text-zinc-900 transition-colors'
              >
                Wk {nextWeek.id} →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Week Hero ── */}
      <div className='max-w-4xl mx-auto w-full px-4 sm:px-6 pt-8 pb-6'>
        <p className='text-xs font-medium text-amber-700 uppercase tracking-widest mb-1'>
          {week.label}
        </p>
        <h1 className='text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 mb-0.5'>
          {week.reading}
        </h1>
        <p className='text-zinc-500 text-sm'>
          Memory verse:{' '}
          <span className='text-zinc-700 font-medium'>{week.memoryDisplay}</span>
        </p>
      </div>

      {/* ── Tabs + Content ── */}
      <div className='flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pb-12'>
        <WeekTabs
          weekId={week.id}
          reading={week.reading}
          memoryRef={week.memoryRef}
          memoryDisplay={week.memoryDisplay}
          chapters={chapters}
          defaultTab={tab ?? 'reading'}
        />
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "Luke 1–5" into individual chapter references like ["Luke 1","Luke 2",...,"Luke 5"] */
function parseChapters(reading: string): string[] {
  // Handle "Titus + Philemon" style
  if (reading.includes('+')) {
    return reading.split('+').map(s => s.trim())
  }

  const match = reading.match(/^(.*?)\s+(\d+)[–-](\d+)$/)
  if (!match) return [reading]

  const [, book, startStr, endStr] = match
  const start = parseInt(startStr, 10)
  const end = parseInt(endStr, 10)
  const result: string[] = []
  for (let c = start; c <= end; c++) {
    result.push(`${book} ${c}`)
  }
  return result
}
