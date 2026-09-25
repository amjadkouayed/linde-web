/**
 * How a senior's status reads on screen. Stored as the person's own choice of
 * word (0004), so "Rentnerin" renders without us ever storing a gender.
 */
const STATUS_LABEL: Record<string, string> = {
  rentner: 'Rentner',
  rentnerin: 'Rentnerin',
  berufstaetig: 'Noch berufstätig',
}

/**
 * The muted line under a name: age, then study field or status. One helper so
 * Discover, the offer preview and Profil cannot drift apart on the handoff's
 * rule that age sits underneath the name, never beside it.
 */
export function personLine({
  age,
  role,
  studyField,
  status,
}: {
  age: number | null | undefined
  role: string | null
  studyField: string | null
  status: string | null
}): string {
  const detail = role === 'student' ? studyField : status ? STATUS_LABEL[status] : null
  return [age != null ? `${age} Jahre` : null, detail].filter(Boolean).join(' · ')
}

/** What onboarding and Profil offer to pick from. */
export const INTERESTS: Record<'student' | 'senior', string[]> = {
  student: ['Deutsch üben', 'Kochen', 'Musik', 'Geschichte', 'Spazieren', 'Schach', 'Technikhilfe'],
  senior: ['Deutsch beibringen', 'Backen', 'Erzählen', 'Karten spielen', 'Kino', 'Spazieren', 'Musik'],
}
