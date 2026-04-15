'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Brain, House } from '@phosphor-icons/react'

export default function Navigation() {
  const path = usePathname()

  const links = [
    { href: '/', label: 'Home', icon: House },
    { href: '#reading', label: 'Reading', icon: BookOpen },
    { href: '#memory', label: 'Memory', icon: Brain },
  ]

  return (
    <nav className='flex items-center gap-1'>
      {links.map(({ href, label, icon: Icon }) => {
        const isActive = path === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
              ${isActive
                ? 'bg-amber-100 text-amber-800'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
          >
            <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
            <span className='hidden sm:inline'>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
