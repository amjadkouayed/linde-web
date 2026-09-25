import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * The link half of e-mail sign-in.
 *
 * Linde asks people to type a code, and our own templates send only a code.
 * But Supabase's DEFAULT templates send a link to `{{ .ConfirmationURL }}`, and
 * a project whose templates have not been applied yet — or a user who signed up
 * before they were — gets that link. Without this route it lands on a 404 and
 * the person is simply locked out, which is how the deployment behaved.
 *
 * So: accept the link, exchange the token server-side, and continue to the same
 * place the code path goes. One more way in, not a different destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/discover'

  // Never redirect to another site on someone else's say-so: only in-app paths.
  // Browsers read `/\evil.com` as `//evil.com`, so a backslash is refused too.
  const safeNext = /^\/(?![/\\])/.test(next) ? next : '/discover'

  if (!tokenHash || !type) {
    redirect('/login?fehler=link')
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    // Expired or already used — both mean "ask for a new code", not "try again".
    redirect('/login?fehler=abgelaufen')
  }

  redirect(safeNext)
}
