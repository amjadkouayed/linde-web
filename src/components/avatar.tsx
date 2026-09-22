/**
 * No real photos exist yet, so every avatar is a hatched placeholder with the
 * person's initials. When uploads land, swap the inner content for an <Image>
 * and keep this as the fallback.
 */
export function Avatar({ name, size = 80 }: { name: string | null; size?: number }) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      aria-hidden="true"
      className="flex flex-none items-center justify-center rounded-full border-[1.5px] border-line font-serif font-semibold text-muted"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size / 3),
        background: 'repeating-linear-gradient(135deg,#EDE3C8 0 6px,#F6F1E3 6px 12px)',
      }}
    >
      {initials}
    </div>
  )
}
