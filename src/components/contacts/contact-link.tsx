'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/** A conversation row that knows whether it is the one open on the right. */
export function ContactLink({ href, children }: { href: string; children: ReactNode }) {
  const active = usePathname() === href
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`press flex items-center gap-4 rounded-card border-2 p-5 text-ink no-underline ${
        active ? 'border-brand bg-tag' : 'border-line bg-raised'
      }`}
    >
      {children}
    </Link>
  )
}
