'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, ArrowRight, ArrowCounterClockwise, Eye, EyeSlash } from '@phosphor-icons/react'
import { fetchVerse, splitIntoWords, getBlankIndices, firstLetter, type Translation, DEFAULT_TRANSLATION } from '@/lib/bible'
import { getMemoryProgress, saveMemoryProgress, updateWeekProgress, getTranslation, saveTranslation } from '@/lib/storage'
import { TRANSLATIONS } from '@/lib/bible'

interface Props {
  weekId: number
  memoryRef: string
  memoryDisplay: string
}

type Stage = 0 | 1 | 2 | 3 | 4

const STAGE_INFO: Record<number, { title: string; description: string }> = {
  0: { title: 'Memory Verse', description: 'Ready to begin practice?'  },
  1: { title: 'Read & Absorb', description: 'Read through the verse carefully. Say it aloud a few times.' },
  2: { title: 'Fill the Gaps', description: 'Some words are hidden. Think through them mentally as you read.' },
  3: { title: 'First Letters', description: 'Only the first letter of each word is shown. Hover or tap to reveal a word.' },
  4: { title: 'Write It Out', description: 'Type the verse from memory. Don\'t peek!' },
}

export default function MemoryVerse({ weekId, memoryRef, memoryDisplay }: Props) {
  const [stage, setStage] = useState<Stage>(0)
  const [words, setWords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verseText, setVerseText] = useState('')
  const [translation, setTranslation] = useState<Translation>(DEFAULT_TRANSLATION)
  const [blanks, setBlanks] = useState<Set<number>>(new Set())
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [writeInput, setWriteInput] = useState('')
  const [writeChecked, setWriteChecked] = useState(false)
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set())
  const [showWords, setShowWords] = useState(false)
  const writeRef = useRef<HTMLTextAreaElement>(null)

  // Load saved progress & translation
  useEffect(() => {
    const t = getTranslation() as Translation
    setTranslation(t)
    const prog = getMemoryProgress(weekId)
    if (prog) {
      setCompletedStages(new Set(prog.stagesCompleted))
      if (prog.stagesCompleted.includes(4)) {
        // Already fully complete — stay at stage 0 but show completion
      }
    }
  }, [weekId])

  // Fetch verse whenever translation changes (after initial load)
  const loadVerse = useCallback(async (ref: string, trans: Translation) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchVerse(ref, trans)
      const text = data.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
      setVerseText(text)
      const w = splitIntoWords(text)
      setWords(w)
      setBlanks(getBlankIndices(w))
    } catch {
      setError('Could not load verse. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load verse when entering stage 1
  useEffect(() => {
    if (stage >= 1 && words.length === 0) {
      loadVerse(memoryRef, translation)
    }
  }, [stage, words.length, memoryRef, translation, loadVerse])

  function handleTranslationChange(t: Translation) {
    setTranslation(t)
    saveTranslation(t)
    setWords([])
    setVerseText('')
    if (stage >= 1) loadVerse(memoryRef, t)
  }

  function completeStage(s: Stage) {
    saveMemoryProgress(weekId, s)
    setCompletedStages(prev => new Set([...prev, s]))
    if (s === 4) {
      updateWeekProgress(weekId, { memoryComplete: true })
    }
  }

  function goToStage(s: Stage) {
    setRevealed(new Set())
    setWriteInput('')
    setWriteChecked(false)
    setShowWords(false)
    setStage(s)
  }

  const isFullyComplete = completedStages.has(4)

  // ── Stage 0: Welcome / Entry ───────────────────────────────────────────────
  if (stage === 0) {
    return (
      <div className='space-y-6'>
        <div>
          <h2 className='font-semibold text-zinc-900 text-lg mb-1'>Memory Verse Practice</h2>
          <p className='text-sm text-zinc-500 max-w-prose'>
            This week&apos;s verse is <strong className='text-zinc-700'>{memoryDisplay}</strong>.
            Work through the 4 stages to commit it to memory.
          </p>
        </div>

        {/* Stage map */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {([1, 2, 3, 4] as const).map(s => {
            const done = completedStages.has(s)
            const labels = ['Read', 'Fill Gaps', 'First Letters', 'Write']
            return (
              <button
                key={s}
                onClick={() => goToStage(s)}
                className={`p-4 rounded-xl border text-left transition-all duration-150 active:scale-[0.98]
                  ${done
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-stone-200 hover:border-amber-300'
                  }`}
              >
                <div className='flex items-center justify-between mb-2'>
                  <span className={`text-lg font-bold ${done ? 'text-emerald-500' : 'text-amber-600'}`}>
                    {s}
                  </span>
                  {done && <CheckCircle size={16} weight='fill' className='text-emerald-500' />}
                </div>
                <p className={`text-xs font-medium ${done ? 'text-emerald-700' : 'text-zinc-600'}`}>
                  {labels[s - 1]}
                </p>
              </button>
            )
          })}
        </div>

        {isFullyComplete && (
          <div className='flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl'>
            <CheckCircle size={20} weight='fill' className='text-emerald-500' />
            <p className='text-sm font-medium text-emerald-800'>
              You&apos;ve completed all 4 stages this week. Keep reviewing!
            </p>
          </div>
        )}

        {/* Translation picker */}
        <div className='flex items-center gap-3'>
          <label className='text-xs text-zinc-500 shrink-0'>Translation:</label>
          <select
            value={translation}
            onChange={e => handleTranslationChange(e.target.value as Translation)}
            className='text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 bg-white text-zinc-700'
          >
            {TRANSLATIONS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => goToStage(1)}
          className='flex items-center gap-2 px-5 py-3 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 active:scale-[0.98] transition-all'
        >
          {isFullyComplete ? 'Practice Again' : 'Begin Practice'}
          <ArrowRight size={15} />
        </button>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className='space-y-4'>
        <StageHeader stage={stage} onBack={() => goToStage(0)} />
        <div className='space-y-3'>
          {[80, 95, 70, 85].map((w, i) => (
            <div key={i} className={`h-5 rounded shimmer`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className='space-y-4'>
        <StageHeader stage={stage} onBack={() => goToStage(0)} />
        <div className='p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600'>
          {error}
        </div>
        <button onClick={() => loadVerse(memoryRef, translation)} className='text-sm text-amber-700 underline'>
          Try again
        </button>
      </div>
    )
  }

  // ── Stage 1: Full verse ───────────────────────────────────────────────────
  if (stage === 1) {
    return (
      <div className='space-y-6'>
        <StageHeader stage={stage} onBack={() => goToStage(0)} completed={completedStages.has(1)} />

        <div className='bg-white border border-stone-200 rounded-2xl p-6'>
          <blockquote className='text-zinc-800 leading-loose text-base md:text-lg font-light'>
            {words.map((word, i) => (
              <span key={i}>{word} </span>
            ))}
          </blockquote>
          <p className='mt-4 text-xs text-zinc-400 font-medium'>
            — {memoryDisplay}
          </p>
        </div>

        <div className='bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800'>
          Read this verse slowly 3–5 times. Try reading it aloud. Notice the structure and rhythm.
        </div>

        <div className='flex gap-3'>
          <button
            onClick={() => { completeStage(1); goToStage(2) }}
            className='flex items-center gap-2 px-5 py-3 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 active:scale-[0.98] transition-all'
          >
            I&apos;ve read it — Next Stage
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => loadVerse(memoryRef, translation)}
            className='p-3 border border-stone-200 rounded-xl text-zinc-500 hover:text-zinc-700 hover:border-stone-300 transition-all'
            title='Reload verse'
          >
            <ArrowCounterClockwise size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Stage 2: Fill the blanks ─────────────────────────────────────────────
  if (stage === 2) {
    return (
      <div className='space-y-6'>
        <StageHeader stage={stage} onBack={() => goToStage(0)} completed={completedStages.has(2)} />

        <div className='bg-white border border-stone-200 rounded-2xl p-6'>
          <p className='text-zinc-800 leading-loose text-base md:text-lg font-light'>
            {words.map((word, i) => {
              const isBlank = blanks.has(i)
              if (isBlank) {
                return (
                  <span
                    key={i}
                    className='inline-block border-b-2 border-amber-400 min-w-[3rem] mx-1 align-middle'
                    style={{ width: `${Math.max(word.length * 0.65, 2.5)}rem` }}
                    title='(think of this word)'
                  />
                )
              }
              return <span key={i}>{word} </span>
            })}
          </p>
          <p className='mt-4 text-xs text-zinc-400 font-medium'>— {memoryDisplay}</p>
        </div>

        <div className='bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800'>
          Mentally fill in the blanks as you read. Each blank represents a hidden word. Try to complete the verse in your mind without looking back.
        </div>

        <div className='flex gap-3 flex-wrap'>
          <button
            onClick={() => { completeStage(2); goToStage(3) }}
            className='flex items-center gap-2 px-5 py-3 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 active:scale-[0.98] transition-all'
          >
            Got it — Next Stage
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => goToStage(1)}
            className='px-4 py-3 border border-stone-200 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 hover:border-stone-300 transition-all'
          >
            Review full verse
          </button>
        </div>
      </div>
    )
  }

  // ── Stage 3: First letters ────────────────────────────────────────────────
  if (stage === 3) {
    return (
      <div className='space-y-6'>
        <StageHeader stage={stage} onBack={() => goToStage(0)} completed={completedStages.has(3)} />

        <div className='bg-white border border-stone-200 rounded-2xl p-6'>
          <p className='text-zinc-800 leading-loose text-base md:text-lg font-light'>
            {words.map((word, i) => {
              // Preserve punctuation around the word
              const isPunct = /^[^a-zA-Z0-9]/.test(word)
              const isRevealed = revealed.has(i)
              const letter = firstLetter(word)

              return (
                <span key={i} className='inline-block mr-1.5'>
                  {isRevealed ? (
                    <span className='text-amber-700 font-semibold animate-[stageFadeIn_0.2s_ease]'>
                      {word}
                    </span>
                  ) : (
                    <span
                      className='word-letter cursor-pointer select-none border-b border-dashed border-zinc-300 text-zinc-600 hover:text-amber-700 hover:border-amber-400 transition-colors px-0.5'
                      data-word={word}
                      onClick={() => setRevealed(prev => new Set([...prev, i]))}
                      title={`Tap to reveal`}
                    >
                      {isPunct ? word[0] : ''}{letter}
                    </span>
                  )}
                </span>
              )
            })}
          </p>
          <p className='mt-4 text-xs text-zinc-400 font-medium'>— {memoryDisplay}</p>
        </div>

        <div className='bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-start gap-2'>
          <Eye size={15} className='text-amber-600 shrink-0 mt-0.5' />
          <span>
            Use the first letters as memory cues. Hover (desktop) or tap (mobile) any letter to reveal the full word. Try to recall each word before peeking!
          </span>
        </div>

        {revealed.size > 0 && (
          <button
            onClick={() => setRevealed(new Set())}
            className='flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors'
          >
            <ArrowCounterClockwise size={13} />
            Reset revealed words ({revealed.size} shown)
          </button>
        )}

        <div className='flex gap-3 flex-wrap'>
          <button
            onClick={() => { completeStage(3); goToStage(4) }}
            className='flex items-center gap-2 px-5 py-3 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 active:scale-[0.98] transition-all'
          >
            Ready to write it out
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => goToStage(2)}
            className='px-4 py-3 border border-stone-200 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 hover:border-stone-300 transition-all'
          >
            Back to fill gaps
          </button>
        </div>
      </div>
    )
  }

  // ── Stage 4: Write it out ─────────────────────────────────────────────────
  if (stage === 4) {
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()

    const isCorrect = normalize(writeInput) === normalize(verseText)
    const isEmpty = writeInput.trim() === ''

    // Word-level diff for feedback
    function getDiff() {
      const target = verseText.split(' ')
      const attempt = writeInput.trim().split(/\s+/)
      return target.map((word, i) => {
        const aWord = attempt[i] ?? ''
        const match = normalize(aWord) === normalize(word)
        return { word, attempt: aWord, match }
      })
    }

    return (
      <div className='space-y-6'>
        <StageHeader stage={stage} onBack={() => goToStage(0)} completed={completedStages.has(4)} />

        <div className='bg-white border border-stone-200 rounded-2xl p-6'>
          <label className='block text-sm font-medium text-zinc-700 mb-3'>
            Write {memoryDisplay} from memory:
          </label>
          <textarea
            ref={writeRef}
            value={writeInput}
            onChange={e => { setWriteInput(e.target.value); setWriteChecked(false) }}
            placeholder='Begin typing the verse...'
            rows={5}
            disabled={writeChecked && isCorrect}
            className='w-full px-3 py-3 text-sm border border-stone-200 rounded-xl resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-zinc-700 placeholder:text-zinc-300 leading-relaxed font-light disabled:bg-stone-50 disabled:text-zinc-500'
          />

          <div className='flex gap-2 mt-3'>
            <button
              onClick={() => setWriteChecked(true)}
              disabled={isEmpty}
              className='flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all'
            >
              Check my answer
            </button>
            <button
              onClick={() => { setWriteInput(''); setWriteChecked(false) }}
              className='flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-xs text-zinc-500 hover:text-zinc-700 hover:border-stone-300 transition-all'
            >
              <ArrowCounterClockwise size={13} />
              Clear
            </button>
            <button
              onClick={() => setShowWords(!showWords)}
              className='flex items-center gap-1.5 px-3 py-2 border border-stone-200 rounded-lg text-xs text-zinc-500 hover:text-zinc-700 hover:border-stone-300 transition-all ml-auto'
            >
              {showWords ? <EyeSlash size={13} /> : <Eye size={13} />}
              {showWords ? 'Hide' : 'Peek'}
            </button>
          </div>
        </div>

        {/* Peek panel */}
        {showWords && (
          <div className='p-4 bg-stone-50 border border-dashed border-stone-300 rounded-xl'>
            <p className='text-xs text-zinc-400 mb-2 font-medium'>Peeking... (try not to!)</p>
            <p className='text-sm text-zinc-600 italic leading-relaxed'>{verseText}</p>
          </div>
        )}

        {/* Result */}
        {writeChecked && (
          <div className={`rounded-2xl p-5 border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-100'}`}>
            {isCorrect ? (
              <div className='flex items-center gap-3'>
                <CheckCircle size={24} weight='fill' className='text-emerald-500' />
                <div>
                  <p className='font-semibold text-emerald-800'>Perfect! You did it!</p>
                  <p className='text-xs text-emerald-600 mt-0.5'>
                    All 4 stages complete for week {weekId}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className='font-semibold text-red-700 mb-3 text-sm'>Not quite — here&apos;s a comparison:</p>
                <div className='space-y-1'>
                  {getDiff().map(({ word, attempt, match }, i) => (
                    <span key={i} className='inline-block mr-1.5 mb-1'>
                      <span className={`text-sm px-1 py-0.5 rounded font-light
                        ${match ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                        {word}
                        {!match && attempt && (
                          <span className='text-xs text-red-400 ml-1'>({attempt})</span>
                        )}
                      </span>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => { setWriteInput(''); setWriteChecked(false); writeRef.current?.focus() }}
                  className='mt-3 text-sm text-red-600 hover:text-red-800 underline'
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mark complete even if wrong */}
        {writeChecked && !isCorrect && (
          <button
            onClick={() => { completeStage(4); goToStage(0) }}
            className='text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline'
          >
            Mark as practiced anyway and continue
          </button>
        )}

        {writeChecked && isCorrect && (
          <button
            onClick={() => { completeStage(4); goToStage(0) }}
            className='flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all'
          >
            <CheckCircle size={15} weight='fill' />
            Mark Complete
          </button>
        )}
      </div>
    )
  }

  return null
}

// ── Shared stage header ───────────────────────────────────────────────────────
function StageHeader({
  stage,
  onBack,
  completed,
}: {
  stage: Stage
  onBack: () => void
  completed?: boolean
}) {
  const info = STAGE_INFO[stage]
  return (
    <div className='flex items-start justify-between'>
      <div>
        <div className='flex items-center gap-2 mb-0.5'>
          <span className='text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full'>
            Stage {stage} of 4
          </span>
          {completed && (
            <span className='text-xs text-emerald-600 flex items-center gap-1'>
              <CheckCircle size={12} weight='fill' /> Done
            </span>
          )}
        </div>
        <h2 className='font-semibold text-zinc-900 text-lg'>{info.title}</h2>
        <p className='text-sm text-zinc-500'>{info.description}</p>
      </div>
      <button
        onClick={onBack}
        className='text-xs text-zinc-400 hover:text-zinc-700 transition-colors shrink-0 ml-4'
      >
        ← Stages
      </button>
    </div>
  )
}
