import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and keeps cookies in
 * sync between the request and the response, per Supabase's official
 * @supabase/ssr guidance for Next.js App Router middleware.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAppRoute = path.startsWith("/dashboard") || path.startsWith("/bumd") ||
    path.startsWith("/selections") || path.startsWith("/candidates") ||
    path.startsWith("/assessment") || path.startsWith("/ranking") ||
    path.startsWith("/audit-log") || path.startsWith("/users") || path.startsWith("/announcement") ||
    path.startsWith("/regulation") || path.startsWith("/recommendation") || path.startsWith("/decision") ||
    path.startsWith("/documents") || path.startsWith("/interview");
  // NOTE: "/daftar" (pendaftaran peserta publik) and "/login" are
  // intentionally left OUT of this list — they must stay reachable by
  // anonymous visitors.

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
