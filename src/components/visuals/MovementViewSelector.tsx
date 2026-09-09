"use client";

import { SegmentTabs } from "@/components/analytics/controls";

export type MovementView = "human" | "ai" | "explain";

/** One vocabulary for viewing a scene, its representation and its context. */
export function MovementViewSelector({
  value,
  onChange,
  label = "How to read this movement",
  hint,
}: {
  value: MovementView;
  onChange: (view: MovementView) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <SegmentTabs
      options={[
        { id: "human", label: "Human view" },
        { id: "ai", label: "AI view" },
        { id: "explain", label: "Explain view" },
      ]}
      value={value}
      onChange={(next) => {
        if (next === "human" || next === "ai" || next === "explain") onChange(next);
      }}
      label={label}
      hint={hint}
    />
  );
}
