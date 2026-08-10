"use client";

// Scrolls the sidebar's own nav list (#sidebar-nav) — independent from
// MainScrollControls, which scrolls the main content pane instead. Sidebar
// nav already scrolls with the mouse wheel/touch; these buttons are an
// explicit, always-visible alternative for the same list.
function scrollSidebar(amount: number) {
  document.getElementById("sidebar-nav")?.scrollBy({ top: amount, behavior: "smooth" });
}

export default function SidebarScrollButtons() {
  return (
    <div className="flex justify-center gap-1 py-1 border-t border-b border-white/10">
      <button
        type="button"
        onClick={() => scrollSidebar(-160)}
        title="Gulir menu ke atas"
        aria-label="Gulir menu ke atas"
        className="w-7 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
      </button>
      <button
        type="button"
        onClick={() => scrollSidebar(160)}
        title="Gulir menu ke bawah"
        aria-label="Gulir menu ke bawah"
        className="w-7 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-white"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </div>
  );
}
