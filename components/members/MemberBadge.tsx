import type { HouseholdMember } from "@/types";

export function MemberBadge({ member, compact = false }: { member?: HouseholdMember; compact?: boolean }) {
  const name = member?.displayName ?? "Anyone";
  const color = member?.color ?? "#78716c";

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-stone-700 shadow-sm ring-1 ring-black/5">
      <span
        className={compact ? "h-2.5 w-2.5 rounded-full" : "flex h-7 w-7 items-center justify-center rounded-full text-xs text-white"}
        style={{ backgroundColor: color }}
      >
        {compact ? null : name.charAt(0)}
      </span>
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
