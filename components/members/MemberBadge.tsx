import type { HouseholdMember } from "@/types";

export function MemberBadge({
  member,
  compact = false,
  isSelected = false,
  onClick,
}: {
  member?: HouseholdMember;
  compact?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const name = member?.displayName ?? "Anyone";
  const color = member?.color ?? "#78716c";
  const className = `inline-flex min-w-0 max-w-full items-center gap-2 rounded-full px-3 py-1 text-sm font-bold shadow-sm ring-1 transition-[background-color,box-shadow,transform] duration-150 ease-[var(--ease-out)] ${
    isSelected ? "bg-stone-950 text-white ring-stone-950" : "bg-white/80 text-stone-700 ring-black/5"
  } ${onClick ? "pressable min-h-11 cursor-pointer hover:shadow-md" : ""}`;
  const markerClassName = compact ? "h-2.5 w-2.5 rounded-full" : "flex h-7 w-7 items-center justify-center rounded-full text-xs text-white";

  const content = (
    <>
      <span className={markerClassName} style={{ backgroundColor: color }}>
        {compact ? null : name.charAt(0)}
      </span>
      <span className="min-w-0 truncate">{name}</span>
    </>
  );

  if (onClick) {
    return (
      <button aria-pressed={isSelected} className={className} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
