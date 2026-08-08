// Shared visual shell for every page reachable WITHOUT logging in
// (landing "/", "/login", "/daftar", "/daftar/[selectionId]" and its
// "/berhasil" confirmation). Keeps the building photograph + navy overlay
// consistent across all of them instead of repeating the same markup.
//
// Layering (back to front):
//   1. Photograph, full-bleed, fixed so it doesn't scroll with tall forms.
//   2. The photograph's own opacity is 45% per spec — set directly on the
//      image layer (not on a wrapper) so it never dims the gradient or the
//      content stacked above it.
//   3. The existing navy gradient, on top of the photo, at full opacity —
//      this is what keeps text readable regardless of image content.
//   4. Page content.
export function PublicBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen isolate">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-20 bg-cover bg-center opacity-45"
        style={{ backgroundImage: "url('/images/gedung-perumdam.jpg')" }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900/95 to-navy-800/90"
      />
      {children}
    </div>
  );
}
