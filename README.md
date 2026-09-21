# Linde – Web

Connects seniors with (international) students for language exchange, company and cultural exchange.
Next.js app, deployed on Vercel. The mobile app lives in `linde-mobile`.

The Supabase database schema lives here in `supabase/migrations` and is shared by both apps.

## Setup

Requires Node 20+.

```bash
npm install
cp .env.example .env.local   # then fill in Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

