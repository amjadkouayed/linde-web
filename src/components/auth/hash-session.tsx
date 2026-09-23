'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

/**
 * The third way a sign-in can arrive, and the one that silently failed.
 *
 * Supabase's DEFAULT e-mail template sends a link through /auth/v1/verify,
 * which bounces back to the Site URL with the tokens in the URL *fragment*
 * (#access_token=…&refresh_token=…) — the implicit flow. The app reads cookies,
 * so it saw nothing: the person landed on the welcome page, signed out, with a
 * valid session sitting unused in their address bar.
 *
 * This picks those tokens up, stores the session properly, and continues into
 * the app. It costs nothing when the fragment is absent, which is every normal
 * page load.
 *
 * The real fix is applying our own templates, which send a code and no link at
 * all. This stays regardless: links already sent keep working, and a template
 * reset in the dashboard cannot lock everybody out again.
 */
export function HashSession() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('access_token')) return

    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (!accessToken || !refreshToken) return

    const supabase = createClient()
    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        // Clear the tokens out of the address bar either way: they are
        // credentials, and they would otherwise sit in history and in anything
        // the person pastes to a helper.
        window.history.replaceState(null, '', window.location.pathname)
        if (error) {
          router.replace('/login?fehler=abgelaufen')
          return
        }
        router.replace('/discover')
        router.refresh()
      })
  }, [router])

  return null
}
