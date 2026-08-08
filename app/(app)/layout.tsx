import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, ROLE_LABEL, type AppRole } from "@/lib/rbac";
import { logoutAction } from "@/app/login/actions";

const NAV: { section: string; items: { href: string; label: string; perm: string }[] }[] = [
  { section: "Utama", items: [{ href: "/dashboard", label: "Dashboard", perm: "dashboard.view" }] },
  { section: "Master Data", items: [
    { href: "/bumd", label: "BUMD", perm: "bumd.view" },
    { href: "/regulation", label: "Regulasi", perm: "regulation.view" },
  ]},
  { section: "Seleksi", items: [
    { href: "/selections", label: "Manajemen Seleksi", perm: "selection.view" },
    { href: "/candidates", label: "Kandidat", perm: "candidate.view" },
    { href: "/documents", label: "Dokumen", perm: "document.view" },
  ]},
  { section: "Penilaian", items: [
    { href: "/assessment", label: "Assessment & Scoring", perm: "assessment.view" },
    { href: "/interview", label: "Wawancara", perm: "interview.view" },
    { href: "/ranking", label: "Ranking", perm: "ranking.view" },
  ]},
  { section: "Keputusan", items: [
    { href: "/recommendation", label: "Rekomendasi", perm: "recommendation.view" },
    { href: "/decision", label: "Keputusan", perm: "decision.view" },
    { href: "/announcement", label: "Pengumuman", perm: "announcement.view" },
  ]},
  { section: "Administrasi", items: [
    { href: "/users", label: "Manajemen User", perm: "user.manage" },
    { href: "/audit-log", label: "Audit Trail", perm: "audit.view" },
  ]},
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const role = profile.role as AppRole;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 bg-navy-950 text-slate-200 flex flex-col">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center font-display font-extrabold text-navy-950 text-sm">S</div>
          <div>
            <div className="font-display font-bold text-white text-sm">SIMASEKSI</div>
            <div className="text-[10px] text-slate-400">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
          {NAV.map((sec) => {
            const items = sec.items.filter((it) => hasPermission(role, it.perm));
            if (!items.length) return null;
            return (
              <div key={sec.section} className="mb-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 pt-3 pb-1.5">{sec.section}</div>
                {items.map((it) => (
                  <a key={it.href} href={it.href} className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-slate-300 hover:bg-white/5 hover:text-white">
                    {it.label}
                  </a>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-white/10 text-[11px] text-slate-500">
          <div>© 2026 SIMASEKSI</div>
          <div>Next.js · Supabase · Vercel</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="text-xs text-ink-500">SIMASEKSI</div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-ink-900">{profile.name}</div>
              <div className="text-[10px] text-ink-500">{ROLE_LABEL[role]}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-navy-800 text-white text-[11px] font-bold flex items-center justify-center">
              {profile.name.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
            </div>
            <form action={logoutAction}>
              <button type="submit" className="text-xs text-red-600 border border-red-200 rounded-md px-2.5 py-1.5 hover:bg-red-50">Keluar</button>
            </form>
          </div>
        </header>
        <main className="p-7">{children}</main>
      </div>
    </div>
  );
}
