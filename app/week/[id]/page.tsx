import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  // Abbreviate long reading strings for the title
  const shortReading = week.chapters.length > 3
    ? `${week.chapters[0]} – ${week.chapters[week.chapters.length - 1]}`
    : week.reading
  return {
    title: `Week ${week.id} — ${shortReading} | Scripture Study`,
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

  // Display a short title when there are many chapters
  const shortReading = week.chapters.length > 3
    ? `${week.chapters[0]} – ${week.chapters[week.chapters.length - 1]}`
    : week.reading

  return (
    <div className='min-h-[100dvh] flex flex-col bg-[#f9f7f4]'>
      {/* ── Header ── */}
      <header className='border-b border-stone-200 bg-[#f9f7f4] sticky top-0 z-10'>
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
              <Link href={`/week/${prevWeek.id}`} className='hover:text-zinc-900 transition-colors'>
                ← Wk {prevWeek.id}
              </Link>
            )}
            {prevWeek && nextWeek && <span>·</span>}
            {nextWeek && (
              <Link href={`/week/${nextWeek.id}`} className='hover:text-zinc-900 transition-colors'>
                Wk {nextWeek.id} →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Week Hero ── */}
      <div className='max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-6'>
        <section className='relative overflow-hidden rounded-2xl border border-stone-900/10 bg-stone-900 shadow-[0_18px_48px_-34px_rgba(28,25,23,0.85)]'>
          <Image
            src='/hero-scripture-pages.png'
            alt=''
            fill
            preload
            sizes='(max-width: 896px) calc(100vw - 2rem), 896px'
            className='object-cover'
          />
          <div className='absolute inset-0 bg-[linear-gradient(90deg,rgba(28,25,23,0.86)_0%,rgba(28,25,23,0.62)_48%,rgba(28,25,23,0.08)_100%)]' />
          <div className='absolute inset-0 bg-[linear-gradient(0deg,rgba(28,25,23,0.5)_0%,rgba(28,25,23,0)_58%)]' />
          <div className='relative flex min-h-[220px] flex-col justify-end p-5 text-white sm:min-h-[250px] sm:p-7'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-widest text-amber-200'>
              Week {week.id} · {week.label}
            </p>
            <h1 className='max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl'>
              {shortReading}
            </h1>
            <p className='mt-2 text-sm leading-6 text-stone-200'>
              Memory verse:{' '}
              <span className='font-medium text-amber-100'>{week.memoryDisplay}</span>
            </p>
          </div>
        </section>
      </div>

      {/* ── Tabs + Content ── */}
      <div className='flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pb-12'>
        <WeekTabs
          weekId={week.id}
          reading={shortReading}
          memoryOptions={week.memoryOptions}
          memoryDisplay={week.memoryDisplay}
          chapters={week.chapters}
          defaultTab={tab ?? 'reading'}
        />
      </div>
    </div>
  )
}
