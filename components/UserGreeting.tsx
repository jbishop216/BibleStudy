'use client'

import { useState, useEffect, useRef } from 'react'
import { X, UserCircle, Users } from '@phosphor-icons/react'
import { getCurrentUser, setCurrentUser, addUser, displayName, getUsers } from '@/lib/storage'

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  try {
    const eastern = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const h = eastern.getHours()
    if (h < 12) return 'morning'
    if (h < 17) return 'afternoon'
    return 'evening'
  } catch {
    const h = new Date().getHours()
    if (h < 12) return 'morning'
    if (h < 17) return 'afternoon'
    return 'evening'
  }
}

const GREETING = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' } as const

export default function UserGreeting() {
  const [user, setUser] = useState('jess')
  const [tod, setTod] = useState<'morning' | 'afternoon' | 'evening'>('evening')
  const [showModal, setShowModal] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [error, setError] = useState('')
  const [allUsers, setAllUsers] = useState<string[]>(['jess'])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUser(getCurrentUser())
    setTod(getTimeOfDay())
    setAllUsers(getUsers())
  }, [])

  useEffect(() => {
    if (showModal) setTimeout(() => inputRef.current?.focus(), 60)
  }, [showModal])

  function switchTo(name: string) {
    setCurrentUser(name)
    setUser(name)
    setShowModal(false)
    window.location.reload()
  }

  function handleSubmit() {
    const trimmed = nameInput.trim()
    if (!trimmed) { setError('Please enter a name'); return }
    const normalized = addUser(trimmed)
    switchTo(normalized)
  }

  const otherUsers = allUsers.filter(u => u !== user)

  return (
    <>
      {/* ── Greeting bar ── */}
      <div className='flex items-end justify-between mb-8'>
        <div>
          <p className='text-xs text-zinc-400 uppercase tracking-widest mb-1'>
            {GREETING[tod].split(' ')[0]} {GREETING[tod].split(' ')[1]}
          </p>
          <h2 className='text-3xl font-semibold tracking-tight text-zinc-900'>
            {GREETING[tod]},{' '}
            <span className='text-amber-700'>{displayName(user)}!</span>
          </h2>
        </div>

        <button
          onClick={() => { setAllUsers(getUsers()); setShowModal(true) }}
          className='flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 border border-stone-200 rounded-xl hover:border-amber-300 hover:text-amber-700 bg-white transition-all shrink-0'
        >
          <UserCircle size={14} />
          {user === 'jess' ? "I'm a guest!" : `Signed in as ${displayName(user)}`}
        </button>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className='fixed inset-0 z-[200] flex items-center justify-center p-4'
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className='bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm'>
            {/* Header */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2'>
                <Users size={18} className='text-amber-700' />
                <h3 className='font-semibold text-zinc-900'>Who&apos;s studying?</h3>
              </div>
              <button onClick={() => setShowModal(false)} className='text-zinc-400 hover:text-zinc-700 transition-colors'>
                <X size={18} />
              </button>
            </div>

            <p className='text-sm text-zinc-500 mb-5'>
              Enter your name to track your own progress. Each person has their own journal.
            </p>

            {/* Name input */}
            <div className='space-y-2 mb-4'>
              <input
                ref={inputRef}
                type='text'
                value={nameInput}
                onChange={e => { setNameInput(e.target.value); setError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSubmit()
                  if (e.key === 'Escape') setShowModal(false)
                }}
                placeholder='Your first name…'
                className='w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all'
              />
              {error && <p className='text-xs text-red-500 pl-1'>{error}</p>}
              <button
                onClick={handleSubmit}
                className='w-full py-2.5 bg-amber-700 text-white rounded-xl font-medium text-sm hover:bg-amber-800 transition-all active:scale-[0.98]'
              >
                Let&apos;s go!
              </button>
            </div>

            {/* Quick-switch to known users */}
            {otherUsers.length > 0 && (
              <div className='pt-4 border-t border-stone-100'>
                <p className='text-xs text-zinc-400 mb-2.5'>Switch to:</p>
                <div className='flex flex-wrap gap-2'>
                  {otherUsers.map(u => (
                    <button
                      key={u}
                      onClick={() => switchTo(u)}
                      className='px-3 py-1.5 bg-stone-100 text-zinc-600 rounded-lg text-xs font-medium hover:bg-amber-50 hover:text-amber-700 border border-transparent hover:border-amber-200 transition-all'
                    >
                      {displayName(u)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
