import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMASEKSI — Sistem Informasi Manajemen Seleksi",
  description: "Platform digital pengelolaan seleksi organ BUMD — Kota Batu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet" />
        {/* Set the dark/light class before paint so switching pages (or a
            fresh load) never flashes the wrong theme. Reads the same
            localStorage key ThemeToggle writes to. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("simaseksi-theme");if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
