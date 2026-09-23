/**
 * Two overlapping circles with a gold lens. Never a leaf — see PRODUCT.md.
 *
 * Lives on its own rather than inside site-nav because client components use it
 * too: once the nav gained a badge that reads the database, importing the mark
 * from there dragged the whole server-only data layer into the browser bundle
 * and the build refused it.
 */
export function LindeMark({ size = 38 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="block">
      <circle cx="39" cy="50" r="30" fill="#55713F" />
      <circle cx="69" cy="50" r="22" fill="#55713F" />
      <path d="M60.93 29.53A22 22 0 0 0 60.93 70.47A30 30 0 0 0 60.93 29.53Z" fill="#C99A3E" />
    </svg>
  )
}
