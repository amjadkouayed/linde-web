/**
 * A person's photo, or their initials on a hatched ground when they have none.
 * Photos are optional, so the fallback is a first-class state, not an error.
 *
 * Decorative (aria-hidden): the name is always printed right beside it.
 */
export function Avatar({
  name,
  path,
  size = 80,
}: {
  name: string | null
  path?: string | null
  size?: number
}) {
  const box = { width: size, height: size }

  if (path) {
    return (
      // A plain <img> on purpose: the file is already a 480 px square JPEG, so
      // next/image's optimiser would only add a round trip and a host config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl(path)}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        loading="lazy"
        className="flex-none rounded-full border-[1.5px] border-line object-cover"
        style={box}
      />
    )
  }

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
        ...box,
        fontSize: Math.round(size / 3),
        background: 'repeating-linear-gradient(135deg,#EDE3C8 0 6px,#F6F1E3 6px 12px)',
      }}
    >
      {initials}
    </div>
  )
}

export function avatarUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}
