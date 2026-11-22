import { cn } from "@/lib/utils";

const TONES = [
  "bg-chart-1 text-primary-foreground",
  "bg-chart-2 text-accent-foreground",
  "bg-chart-3 text-warning-foreground",
  "bg-chart-4 text-primary-foreground",
  "bg-chart-5 text-primary-foreground",
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function PersonAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold",
        TONES[hash(name) % TONES.length],
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
