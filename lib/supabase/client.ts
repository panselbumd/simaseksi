import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components ("use client").
 * Relies on the public anon key — safe to expose to the browser because
 * all access control is enforced server-side via Row Level Security (RLS).
 *
 * NOTE: not parametrized with the generated `Database` type yet — the
 * hand-written placeholder in database.types.ts is intentionally loose.
 * Run `npm run db:types` once your project is linked, then re-add
 * `createBrowserClient<Database>(...)` for full column-level type safety.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
