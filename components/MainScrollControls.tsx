"use client";

// Scrolls #main-content — separate from SidebarScrollButtons, which only
// ever scrolls the sidebar's nav list. Vertical buttons cover long pages;
// horizontal buttons cover wide tables (Ranking, Audit Trail, etc.) that
// would otherwise need a mouse with a horizontal wheel to shift sideways.
function scrollMain(dx: number, dy: number) {
  document.getElementById("main-content")?.scrollBy({ left: dx, top: dy, behavior: "smooth" });
}

const BTN = "w-8 h-8 rounded-md bg-navy-900/90 text-white flex items-center justify-center shadow hover:bg-navy-800 backdrop-blur";
const ICON = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export default function MainScrollControls() {
  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-center gap-1.5 print:hidden">
      <button type="button" onClick={() => scrollMain(0, -240)} title="Gulir layar ke atas" aria-label="Gulir layar ke atas" className={BTN}>
        <svg {...ICON}><path d="M18 15l-6-6-6 6" /></svg>
      </button>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => scrollMain(-240, 0)} title="Geser layar ke kiri" aria-label="Geser layar ke kiri" className={BTN}>
          <svg {...ICON}><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button type="button" onClick={() => scrollMain(240, 0)} title="Geser layar ke kanan" aria-label="Geser layar ke kanan" className={BTN}>
          <svg {...ICON}><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <button type="button" onClick={() => scrollMain(0, 240)} title="Gulir layar ke bawah" aria-label="Gulir layar ke bawah" className={BTN}>
        <svg {...ICON}><path d="M6 9l6 6 6-6" /></svg>
      </button>
    </div>
  );
}
