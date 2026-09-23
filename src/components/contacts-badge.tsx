import { getConnections } from '@/lib/data/connections'

/**
 * Fetches its own count rather than taking a prop. The nav sits outside every
 * page's Suspense boundary, so a page cannot pass this down without reading the
 * session outside a boundary — which Cache Components rejects at build time.
 * Its own boundary in SiteNav keeps the rest of the nav in the static shell.
 *
 * Counts requests waiting for an answer plus unread messages: both are "someone
 * is waiting for you", which is what the badge means to the person reading it.
 */
export async function ContactsBadge() {
  const connections = await getConnections()

  const count = connections.reduce((total, c) => {
    const waiting = c.status === 'pending' && !c.i_am_requester ? 1 : 0
    return total + waiting + (c.unread_count ?? 0)
  }, 0)

  if (count === 0) return null

  return (
    <span
      aria-label={`${count} ${count === 1 ? 'neue Benachrichtigung' : 'neue Benachrichtigungen'}`}
      className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-sm font-bold text-ink"
    >
      {count}
    </span>
  )
}
