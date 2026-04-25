# Arena Web

Next.js frontend for Arena Homes, integrated with Supabase Auth and Supabase Postgres.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set these values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Notes

- Auth uses Supabase (`@supabase/supabase-js`).
- Data access modules are in `src/lib/api/`.
