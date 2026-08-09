import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` (the
// exported function must be named `proxy`, not `middleware`). A stale
// middleware.ts is deprecated and, on some 16.x point releases, has been
// reported to be silently skipped — which for this app would mean the
// entire auth/RBAC gate stops running with no error. We migrate explicitly
// rather than rely on any compatibility shim for something this critical.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
