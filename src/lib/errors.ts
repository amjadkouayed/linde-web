/**
 * What a person sees when the database refuses something. Raw PostgREST
 * messages are English, technical, and describe our schema to whoever reads
 * them; the real error goes to the server log instead.
 */
export function friendlyError(error: { code?: string; message: string }): string {
  console.error(error)
  if (error.code === 'PT429') {
    return 'Das war etwas viel auf einmal. Bitte warten Sie einen Moment und versuchen Sie es dann noch einmal.'
  }
  return 'Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal.'
}
