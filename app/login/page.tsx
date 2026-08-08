"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import { loginAction, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-navy-900 text-white font-semibold text-sm py-2.5 hover:bg-navy-800 disabled:opacity-60"
    >
      {pending ? "Memproses..." : "Masuk"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(loginAction, null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const { a, b } = useMemo(() => ({ a: Math.ceil(Math.random() * 9), b: Math.ceil(Math.random() * 9) }), []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center font-display font-extrabold text-navy-950">S</div>
          <div>
            <div className="font-display font-bold text-lg text-navy-900">SIMASEKSI</div>
            <div className="text-[10px] tracking-widest text-gold-600 uppercase">Kota Batu</div>
          </div>
        </div>
        <h1 className="text-xl font-display font-bold text-navy-900 mb-1">Masuk ke SIMASEKSI</h1>
        <p className="text-sm text-ink-500 mb-6">Gunakan username dan password yang telah terdaftar.</p>

        <a
          href="/daftar"
          className="block mb-6 text-center text-xs font-semibold text-navy-700 border border-navy-100 bg-navy-50 rounded-md px-3 py-2 hover:bg-navy-100"
        >
          Belum punya akun? Daftar sebagai Peserta Seleksi &rarr;
        </a>

        <form
          action={(formData) => {
            const answer = parseInt(captchaAnswer, 10);
            if (answer !== a + b) {
              alert("Jawaban verifikasi anti-bot salah.");
              return;
            }
            formAction(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">Username</label>
            <input name="username" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" placeholder="mis. pansel" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">Password</label>
            <input name="password" type="password" required className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">Verifikasi Anti-Bot</label>
            <div className="flex items-center gap-3 bg-navy-50 border border-gray-200 rounded-md px-3 py-2">
              <span className="font-mono font-bold text-sm text-navy-900">{a} + {b} = ?</span>
              <input
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="ml-auto w-20 border border-gray-200 rounded-md px-2 py-1 text-sm"
                placeholder="Jawaban"
              />
            </div>
          </div>
          {state?.error && (
            <div className="bg-red-50 text-red-700 text-xs rounded-md px-3 py-2">{state.error}</div>
          )}
          <SubmitButton />
        </form>

        <div className="mt-6 bg-gold-100 border border-dashed border-gold-500 rounded-lg p-3 text-[11px]">
          <b className="block mb-1">DEMO ONLY — Kredensial Contoh</b>
          <table className="w-full">
            <tbody>
              <tr><td className="font-semibold text-gold-700 pr-2">Admin</td><td className="font-mono">admin</td><td className="font-mono">admin123</td></tr>
              <tr><td className="font-semibold text-gold-700 pr-2">Pansel (Ketua)</td><td className="font-mono">pansel_ketua</td><td className="font-mono">pansel123</td></tr>
              <tr><td className="font-semibold text-gold-700 pr-2">Pansel (Anggota)</td><td className="font-mono">pansel_anggota</td><td className="font-mono">pansel123</td></tr>
              <tr><td className="font-semibold text-gold-700 pr-2">Tim UKK</td><td className="font-mono">ukk01 s/d ukk05</td><td className="font-mono">ukk123</td></tr>
              <tr><td className="font-semibold text-gold-700 pr-2">Peserta</td><td className="font-mono">peserta01</td><td className="font-mono">peserta123</td></tr>
              <tr><td className="font-semibold text-gold-700 pr-2">KPM</td><td className="font-mono">kpm</td><td className="font-mono">kpm123</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
