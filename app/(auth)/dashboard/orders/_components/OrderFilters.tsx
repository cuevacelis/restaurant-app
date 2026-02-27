"use client";

import { STATUSES } from "./_types";

interface Props {
  status: string;
  onStatusChange: (s: string | null) => void;
}

export function OrderFilters({ status, onStatusChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => onStatusChange(s.value || null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            status === s.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
