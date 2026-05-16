import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow?: string }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 safe-bottom sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-4 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-[0_20px_60px_rgba(84,59,34,0.10)] backdrop-blur">
        <div>
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">{eyebrow}</p> : null}
          <h1 className="text-2xl font-black tracking-tight text-stone-950">{title}</h1>
        </div>
        <nav className="flex rounded-full bg-stone-100 p-1 text-sm font-semibold text-stone-600">
          <Link className="rounded-full px-3 py-2 hover:bg-white hover:text-stone-950" href="/app">
            App
          </Link>
          <Link className="rounded-full px-3 py-2 hover:bg-white hover:text-stone-950" href="/settings">
            Settings
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
