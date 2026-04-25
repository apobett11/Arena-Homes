# Arena Homes

Arena Homes is now a Supabase-first architecture:

- `arena-web/` - Next.js frontend
- `supabase/` - database migrations and Supabase project config

The legacy backend runtime has been removed.

## Development

```bash
npm install
npm run dev
```

The root scripts proxy into `arena-web`.

## Required Environment Variables (`arena-web/.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Migrations

Supabase migrations live in `supabase/migrations`.
