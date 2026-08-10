"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "simaseksi-theme";

export default function ThemeToggle() {
  // Starts null so the button doesn't render a wrong icon for a flash
  // before mount reads the class the inline <script> in layout.tsx already
  // applied to <html>.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-ink-700 hover:bg-gray-50 transition-colors"
    >
      {isDark === null ? null : isDark ? (
        // Sun icon (currently dark -> click for light)
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon (currently light -> click for dark)
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z" />
        </svg>
      )}
    </button>
  );
}
