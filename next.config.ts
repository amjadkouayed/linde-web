import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components gives us Partial Prerendering: the app shell prerenders and
  // loads instantly, while anything that reads the session streams in behind a
  // <Suspense> boundary. It also makes reading cookies() outside a boundary a
  // build error, which is the guardrail we want — see src/lib/data/README notes
  // in profiles.ts for what may and may not be cached here.
  cacheComponents: true,
}

export default nextConfig
