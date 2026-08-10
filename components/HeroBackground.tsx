import Image from "next/image";
import heroPhoto from "@/public/images/beranda-hero.jpg";

// Signature visual for the public landing page: the official render of the
// two BUMD head offices (Perumdam Among Tirto and PT. Batu Wisata
// Resource). The photo itself has no alpha channel, so "transparency" here
// is achieved the way a professional site actually does it — layered CSS:
//   1) the photo faded down via opacity so it reads as a backdrop, not a
//      competing focal point next to the hero copy;
//   2) a mask-image gradient so the photo itself fades out at every edge
//      (no hard rectangle seam against the navy background);
//   3) a navy gradient scrim on top for text contrast (WCAG-safe against
//      white/gold hero text), matching the section's existing
//      from-navy-950/via-navy-900/to-navy-800 palette.
export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.42,
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%), linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 72%, transparent 100%), linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskComposite: "source-in",
        }}
      >
        <Image
          src={heroPhoto}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {/* Navy scrim: darkest at the bottom (where body copy sits) so the
          gold headline and paragraph text stay legible over the photo. */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/55 to-navy-900/85" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/60 via-transparent to-navy-950/30" />
    </div>
  );
}
