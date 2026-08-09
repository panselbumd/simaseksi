// Signature visual for the public landing page: an abstract institutional
// skyline (never a real, specific building — we have no licensed photo of
// the actual Kota Batu government complex) paired with a concentric-ring
// "batu" (stone/mountain) emblem, evoking the district's namesake highland
// geography rather than reproducing any official coat of arms.
export default function HeroBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1400 700"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skylineFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15335c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0a1a2e" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Distant ridgeline — Kota Batu sits in a highland basin ringed by volcanoes */}
      <path d="M0,420 L120,370 L260,410 L400,340 L560,400 L720,350 L900,405 L1060,360 L1220,410 L1400,375 L1400,700 L0,700 Z"
        fill="#0f2544" opacity="0.5" />

      {/* Institutional skyline — generic massed rectangles, not a specific building */}
      <g fill="url(#skylineFade)">
        <rect x="80" y="460" width="90" height="240" />
        <rect x="190" y="410" width="60" height="290" />
        <rect x="270" y="500" width="110" height="200" />
        <rect x="400" y="440" width="70" height="260" />
        <rect x="490" y="480" width="130" height="220" />
        <rect x="640" y="400" width="55" height="300" />
        <rect x="710" y="470" width="95" height="230" />
        <rect x="820" y="430" width="65" height="270" />
        <rect x="900" y="490" width="120" height="210" />
        <rect x="1040" y="450" width="80" height="250" />
        <rect x="1140" y="410" width="60" height="290" />
        <rect x="1220" y="480" width="140" height="220" />
      </g>
      {/* Windows — sparse lit-window texture on the two tallest masses */}
      <g fill="#dab94a" opacity="0.12">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 3 }).map((_, col) => (
            <rect key={`${row}-${col}`} x={205 + col * 15} y={430 + row * 30} width="8" height="14" />
          ))
        )}
      </g>

      {/* Concentric "batu" emblem watermark, right of center */}
      <g transform="translate(1000,180)" opacity="0.16" stroke="#dab94a" fill="none" strokeWidth="2">
        <circle r="130" />
        <circle r="98" />
        <circle r="66" />
        <path d="M -46,32 L 0,-52 L 46,32 Z" />
      </g>
    </svg>
  );
}
