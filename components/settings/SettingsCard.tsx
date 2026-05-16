import type { ReactNode } from "react";

export function SettingsCard({ title, status, children }: { title: string; status?: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_16px_45px_rgba(87,64,38,0.08)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-xl font-black tracking-tight text-stone-950">{title}</h2>
        {status ? <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-stone-600">{status}</span> : null}
      </div>
      <div className="text-sm font-medium leading-6 text-stone-600">{children}</div>
    </section>
  );
}
