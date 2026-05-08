'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, MagnifyingGlass, ArrowRight, Printer, Quotes, X } from '@phosphor-icons/react'
import { fetchVerse, type Translation, DEFAULT_TRANSLATION } from '@/lib/bible'
import { getHEAR, saveHEAR, isHEARComplete, updateWeekProgress } from '@/lib/storage'
import type { HEAREntry } from '@/lib/storage'
import { TRANSLATIONS } from '@/lib/bible'

interface Props {
  weekId: number
  reading: string
}

type Step = 'verse' | 'highlight' | 'explain' | 'apply' | 'respond' | 'complete'

const STEPS: Step[] = ['verse', 'highlight', 'explain', 'apply', 'respond', 'complete']

const STEP_INFO: Record<Exclude<Step, 'verse' | 'complete'>, { letter: string; title: string; prompt: string; placeholder: string }> = {
  highlight: {
    letter: 'H',
    title: 'Highlight',
    prompt: 'Write out the verse or a phrase that stood out to you most from this week\'s reading.',
    placeholder: 'Write the verse or phrase here...',
  },
  explain: {
    letter: 'E',
    title: 'Explain',
    prompt: 'In your own words, what does this passage mean? Consider the context — who wrote it, to whom, and why?',
    placeholder: 'What is God saying in this passage?',
  },
  apply: {
    letter: 'A',
    title: 'Apply',
    prompt: 'How can you apply this truth to your life this week? Be as specific as possible.',
    placeholder: 'How does this change how you think, speak, or act?',
  },
  respond: {
    letter: 'R',
    title: 'Respond',
    prompt: 'Write a brief prayer in response to what God has shown you through this passage.',
    placeholder: 'Lord, in response to this truth...',
  },
}

export default function HEARJournal({ weekId, reading }: Props) {
  const [step, setStep] = useState<Step>('verse')
  const [verseRef, setVerseRef] = useState('')
  const [verseText, setVerseText] = useState('')
  const [verseFetching, setVerseFetching] = useState(false)
  const [verseError, setVerseError] = useState('')
  const [translation, setTranslation] = useState<Translation>(DEFAULT_TRANSLATION)
  const [entry, setEntry] = useState<Partial<HEAREntry>>({})
  const [saved, setSaved] = useState(false)
  const [alreadyComplete, setAlreadyComplete] = useState(false)
  const [showPrint, setShowPrint] = useState(false)

  useEffect(() => {
    const existing = getHEAR(weekId)
    if (existing) {
      setEntry(existing)
      setVerseRef(existing.verseRef)
      setVerseText(existing.verseText)
      if (isHEARComplete(weekId)) {
        setAlreadyComplete(true)
        setStep('complete')
      }
    }
  }, [weekId])

  const loadVerse = useCallback(async () => {
    if (!verseRef.trim()) return
    setVerseFetching(true)
    setVerseError('')
    try {
      const data = await fetchVerse(verseRef.trim(), translation)
      const text = data.text.replace(/\n/g, ' ').trim()
      setVerseText(text)
      setVerseRef(data.reference)
      saveHEAR({ weekId, verseRef: data.reference, verseText: text })
      setEntry(prev => ({ ...prev, verseRef: data.reference, verseText: text }))
    } catch {
      setVerseError(`Couldn't find "${verseRef}". Try a format like "John 3:16" or "Romans 8:28-29".`)
    } finally {
      setVerseFetching(false)
    }
  }, [verseRef, translation, weekId])

  function updateField(field: keyof HEAREntry, value: string) {
    const updated = { ...entry, [field]: value, weekId }
    setEntry(updated)
    saveHEAR(updated as Partial<HEAREntry> & { weekId: number })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function advance() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1])
    }
    if (step === 'respond') {
      updateWeekProgress(weekId, { hearComplete: true })
    }
  }

  function canAdvance(): boolean {
    if (step === 'verse') return Boolean(verseText)
    if (step === 'highlight') return Boolean(entry.highlight?.trim())
    if (step === 'explain') return Boolean(entry.explain?.trim())
    if (step === 'apply') return Boolean(entry.apply?.trim())
    if (step === 'respond') return Boolean(entry.respond?.trim())
    return true
  }

  const stepIndex = STEPS.indexOf(step)
  const contentSteps = STEPS.filter(s => s !== 'verse' && s !== 'complete')

  // ── Completed view ─────────────────────────────────────────────────────────
  if (step === 'complete' || alreadyComplete) {
    return (
      <div className='space-y-6'>
        {/* Completion banner */}
        <div className='bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <CheckCircle size={24} weight='fill' className='text-emerald-500' />
            <div>
              <p className='font-semibold text-emerald-800 text-sm'>HEAR Analysis Complete</p>
              <p className='text-xs text-emerald-600'>Week {weekId} · {entry.verseRef}</p>
            </div>
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => { setAlreadyComplete(false); setStep('verse') }}
              className='text-xs text-emerald-600 hover:text-emerald-800 px-3 py-1.5 border border-emerald-200 rounded-lg transition-colors'
            >
              Edit
            </button>
            <button
              onClick={() => window.print()}
              className='flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 px-3 py-1.5 border border-emerald-200 rounded-lg transition-colors'
            >
              <Printer size={13} />
              Print
            </button>
          </div>
        </div>

        {/* Full entry display */}
        <div className='bg-white border border-stone-200 rounded-2xl overflow-hidden print:shadow-none'>
          {/* Verse */}
          {entry.verseText && (
            <div className='p-6 border-b border-stone-100'>
              <div className='flex items-start gap-3'>
                <Quotes size={20} className='text-amber-400 shrink-0 mt-0.5' />
                <div>
                  <p className='text-zinc-700 leading-relaxed italic text-sm'>{entry.verseText}</p>
                  <p className='text-xs text-zinc-400 mt-1 font-medium'>{entry.verseRef}</p>
                </div>
              </div>
            </div>
          )}

          {/* HEAR sections */}
          {(['highlight', 'explain', 'apply', 'respond'] as const).map(field => {
            const info = STEP_INFO[field]
            const value = entry[field] ?? ''
            return (
              <div key={field} className='p-6 border-b border-stone-100 last:border-0'>
                <div className='flex items-center gap-2 mb-2'>
                  <span className='w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-bold flex items-center justify-center'>
                    {info.letter}
                  </span>
                  <span className='font-semibold text-sm text-zinc-900'>{info.title}</span>
                </div>
                <p className='text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap'>
                  {value || <span className='text-zinc-300 italic'>Not filled in</span>}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Verse Selection Step ────────────────────────────────────────────────────
  if (step === 'verse') {
    return (
      <div className='space-y-6'>
        <div>
          <h2 className='font-semibold text-zinc-900 text-lg mb-1'>Choose Your Verse</h2>
          <p className='text-sm text-zinc-500 max-w-prose'>
            From your reading in <strong>{reading}</strong>, pick 1–2 verses that stood out.
            This will be the focus of your HEAR analysis.
          </p>
        </div>

        {/* Tips */}
        <div className='bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800'>
          <p className='font-medium mb-2'>Looking for a verse? Consider:</p>
          <ul className='space-y-1 text-amber-700 text-xs list-disc list-inside'>
            <li>A verse that surprised or challenged you</li>
            <li>Something that felt directly relevant to your life right now</li>
            <li>A promise, command, or description of God&apos;s character</li>
            <li>A verse you want to understand better</li>
          </ul>
        </div>

        {/* Verse lookup */}
        <div className='bg-white border border-stone-200 rounded-2xl p-6'>
          <label className='block text-sm font-medium text-zinc-700 mb-2'>
            Verse Reference
          </label>
          <div className='flex gap-2'>
            <input
              type='text'
              value={verseRef}
              onChange={e => setVerseRef(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadVerse()}
              placeholder='e.g. John 11:35 or Luke 15:11-32'
              className='flex-1 px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all'
            />
            <select
              value={translation}
              onChange={e => setTranslation(e.target.value as Translation)}
              className='px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white text-zinc-600'
            >
              {TRANSLATIONS.map(t => (
                <option key={t.id} value={t.id}>{t.shortName}</option>
              ))}
            </select>
            <button
              onClick={loadVerse}
              disabled={verseFetching || !verseRef.trim()}
              className='flex items-center gap-1.5 px-4 py-2.5 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all'
            >
              <MagnifyingGlass size={14} />
              {verseFetching ? 'Loading…' : 'Look up'}
            </button>
          </div>

          {verseError && (
            <p className='mt-2 text-xs text-red-500 flex items-center gap-1'>
              <X size={12} weight='bold' /> {verseError}
            </p>
          )}

          {verseText && (
            <div className='mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl'>
              <div className='flex items-start gap-2'>
                <Quotes size={16} className='text-amber-400 shrink-0 mt-0.5' />
                <div>
                  <p className='text-sm text-amber-900 leading-relaxed italic'>{verseText}</p>
                  <p className='text-xs text-amber-600 mt-1.5 font-medium'>{verseRef}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={advance}
          disabled={!verseText}
          className='flex items-center gap-2 px-5 py-3 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all'
        >
          Begin HEAR Analysis
          <ArrowRight size={15} />
        </button>
      </div>
    )
  }

  // ── HEAR Steps ─────────────────────────────────────────────────────────────
  const currentStepInfo = STEP_INFO[step as keyof typeof STEP_INFO]
  const currentField = step as keyof Pick<HEAREntry, 'highlight' | 'explain' | 'apply' | 'respond'>

  return (
    <div className='space-y-6'>
      {/* Step progress */}
      <div className='flex items-center gap-2'>
        {contentSteps.map((s, i) => {
          const info = STEP_INFO[s as keyof typeof STEP_INFO]
          const isActive = s === step
          const isDone = contentSteps.indexOf(step) > i
          return (
            <div key={s} className='flex items-center gap-2'>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${isActive ? 'bg-amber-700 text-white' : isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-zinc-400'}`}>
                {isDone ? '✓' : info.letter}
              </div>
              {i < contentSteps.length - 1 && (
                <div className={`h-px w-6 ${isDone ? 'bg-emerald-300' : 'bg-stone-200'}`} />
              )}
            </div>
          )
        })}
        <span className='ml-2 text-xs text-zinc-400'>
          {contentSteps.indexOf(step) + 1} of {contentSteps.length}
        </span>
      </div>

      {/* Verse reminder */}
      {verseText && (
        <div className='p-4 bg-stone-50 border border-stone-200 rounded-xl'>
          <div className='flex items-start gap-2'>
            <Quotes size={14} className='text-amber-400 shrink-0 mt-0.5' />
            <div>
              <p className='text-xs text-zinc-600 italic leading-relaxed'>{verseText}</p>
              <p className='text-xs text-zinc-400 mt-1'>{verseRef}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current step */}
      <div className='bg-white border border-stone-200 rounded-2xl p-6 hear-section'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-9 h-9 rounded-full bg-amber-700 text-white font-bold text-base flex items-center justify-center'>
            {currentStepInfo.letter}
          </div>
          <div>
            <h2 className='font-semibold text-zinc-900'>{currentStepInfo.title}</h2>
            <p className='text-xs text-zinc-500'>{currentStepInfo.prompt}</p>
          </div>
        </div>
        <textarea
          value={entry[currentField] ?? ''}
          onChange={e => updateField(currentField, e.target.value)}
          placeholder={currentStepInfo.placeholder}
          rows={6}
          className='w-full px-3 py-3 text-sm border border-stone-200 rounded-xl resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-zinc-700 placeholder:text-zinc-300 leading-relaxed'
        />
        {saved && (
          <p className='text-xs text-emerald-500 mt-1.5 flex items-center gap-1'>
            <CheckCircle size={12} weight='fill' /> Saved
          </p>
        )}
      </div>

      {/* Actions */}
      <div className='flex items-center justify-between'>
        <button
          onClick={() => {
            const idx = STEPS.indexOf(step)
            if (idx > 0) setStep(STEPS[idx - 1])
          }}
          className='text-sm text-zinc-400 hover:text-zinc-700 transition-colors'
        >
          ← Back
        </button>
        <button
          onClick={advance}
          disabled={!canAdvance()}
          className='flex items-center gap-2 px-5 py-2.5 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all'
        >
          {step === 'respond' ? 'Complete Analysis' : 'Next'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
