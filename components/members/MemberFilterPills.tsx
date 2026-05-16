import type { HouseholdMember } from "@/types";

type MemberFilterPillsProps = {
  members: HouseholdMember[];
  selectedMemberId?: string | null;
  onSelectMember: (id: string | null) => void;
  size?: "mobile" | "wall";
};

export function MemberFilterPills({ members, selectedMemberId = null, onSelectMember, size = "mobile" }: MemberFilterPillsProps) {
  if (members.length === 0) {
    return null;
  }

  const isWall = size === "wall";
  const pillSizeClasses = isWall ? "min-h-12 px-4 py-2.5 text-base" : "min-h-11 px-3 py-2 text-sm";
  const avatarSizeClasses = isWall ? "h-8 w-8 text-sm" : "h-7 w-7 text-xs";

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Task member filters">
      <div className="flex w-max min-w-full gap-2 whitespace-nowrap">
        {members.map((member) => {
          const isSelected = member.id === selectedMemberId;
          return (
            <button
              aria-pressed={isSelected}
              className={`pressable inline-flex shrink-0 items-center gap-2 rounded-full border font-black transition-[border-color,box-shadow,color,background-color,opacity,transform] ${pillSizeClasses} ${
                isSelected ? "border-white bg-white text-stone-950 shadow-[0_14px_32px_rgba(84,59,34,0.16)]" : "border-white/70 bg-white/55 text-stone-600 shadow-sm opacity-80"
              }`}
              key={member.id}
              onClick={() => onSelectMember(isSelected ? null : member.id)}
              style={isSelected ? { borderColor: member.color, boxShadow: `0 0 0 2px ${member.color}33, 0 14px 32px rgba(84, 59, 34, 0.16)` } : undefined}
              type="button"
            >
              {member.avatarUrl ? (
                <span
                  aria-label={`${member.displayName} avatar`}
                  className={`${avatarSizeClasses} rounded-full bg-cover bg-center shadow-sm ring-1 ring-black/5`}
                  role="img"
                  style={{ backgroundImage: `url(${member.avatarUrl})` }}
                />
              ) : (
                <span
                  aria-label={`${member.displayName} avatar`}
                  className={`${avatarSizeClasses} flex items-center justify-center rounded-full font-black text-white shadow-sm ring-1 ring-white/70`}
                  role="img"
                  style={{ backgroundColor: member.color }}
                >
                  {member.displayName.charAt(0)}
                </span>
              )}
              <span>{member.displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
