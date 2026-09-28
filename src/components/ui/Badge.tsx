import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-hover text-muted border border-border",
  accent: "bg-accent/15 text-accent border border-accent/30",
  success: "bg-success-bg text-success border border-success/25",
  warning: "bg-warning-bg text-warning border border-warning/25",
  danger: "bg-danger-bg text-danger border border-danger/25",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
