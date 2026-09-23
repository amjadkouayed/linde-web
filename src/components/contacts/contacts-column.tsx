'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * On a phone there is room for one thing: the list, or the open conversation.
 * On desktop both stand side by side, as the handoff's web layout asks.
 */
export function ContactsColumn({ children }: { children: ReactNode }) {
  const inConversation = usePathname() !== '/kontakte'
  return <aside className={inConversation ? 'hidden lg:block' : 'block'}>{children}</aside>
}
