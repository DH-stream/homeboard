import Link from "next/link";
import type { ReactNode } from "react";

export function WallShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.25),transparent_30rem),linear-gradient(135deg,#fff8ed,#eefdf8_55%,#f7f2ff)] p-5 text-stone-950 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] flex-col rounded-[2.5rem] border border-white/70 bg-white/55 p-5 shadow-[0_30px_100px_rgba(73,48,25,0.16)] backdrop-blur-xl lg:min-h-[calc(100vh-4rem)] lg:p-8">
        <div className="mb-5 flex items-center justify-between text-sm font-semibold text-stone-500">
          <Link className="rounded-full bg-white/70 px-4 py-2 text-stone-700 shadow-sm" href="/">
            HomeBoard
          </Link>
          <Link className="rounded-full bg-stone-950 px-4 py-2 text-white shadow-sm" href="/app">
            Manage tasks
          </Link>
        </div>
        {children}
      </div>
    </main>
  );
}
