import { cn } from "@/lib/utils";

const TONE = {
  success: "bg-success/12 text-success ring-success/25",
  warning: "bg-warning/18 text-warning-foreground ring-warning/35",
  danger: "bg-destructive/10 text-destructive ring-destructive/25",
  neutral: "bg-secondary text-secondary-foreground ring-border",
  accent: "bg-accent/12 text-accent ring-accent/30",
  info: "bg-info/10 text-info ring-info/25",
} as const;

export type PillTone = keyof typeof TONE;

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
