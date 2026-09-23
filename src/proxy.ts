import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` and the exported function to
 * `proxy`. It always runs on the Node runtime; setting `runtime` here throws.
 *
 * Its only jobs are refreshing the Supabase session cookie and bouncing signed
 * out visitors away from app routes. It is NOT the security boundary: Server
 * Actions are POSTs to the same routes, so a matcher change can silently drop
 * coverage. Authorisation lives in the DAL and in RLS.
 */
// The three legal pages must be reachable without an account: someone deciding
// whether to sign up is exactly the person who needs to read them first, and
// German law requires the Impressum to be accessible to anyone.
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/auth',
  '/impressum',
  '/datenschutz',
  '/nutzungsbedingungen',
]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // getUser() revalidates the token with Supabase and refreshes it when needed.
  // Do not replace it with getSession(), which trusts the cookie as-is.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
