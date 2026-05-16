import type { ReactNode } from "react";
import { StatusChip } from "@/components/ui/StatusChip";

function getStatusTone(status: string): "amber" | "emerald" | "stone" {
  const normalized = status.toLowerCase();
  if (normalized.includes("preview") || normalized.includes("local")) return "amber";
  if (normalized.includes("prepared") || normalized.includes("mock")) return "emerald";
  return "stone";
}

export function SettingsCard({ title, status, children }: { title: string; status?: string; children: ReactNode }) {
  return (
    <section className="surface-card rounded-[2rem] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-xl font-black tracking-tight text-stone-950">{title}</h2>
        {status ? <StatusChip tone={getStatusTone(status)}>{status}</StatusChip> : null}
      </div>
      <div className="text-sm font-medium leading-6 text-stone-600">{children}</div>
    </section>
  );
}
