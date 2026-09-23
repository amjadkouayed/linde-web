/**
 * Shared by the server component that runs the search and the client component
 * that offers the choices. Deliberately not in `lib/data/profiles.ts`: that
 * module is `server-only`, so importing it from the filter would break the
 * build — which is how the same five numbers ended up written twice.
 */
export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const
export const DEFAULT_RADIUS = 25

export type Radius = (typeof RADIUS_OPTIONS)[number]

export function parseRadius(value: unknown): Radius {
  const n = Number(value)
  return RADIUS_OPTIONS.includes(n as Radius) ? (n as Radius) : DEFAULT_RADIUS
}
