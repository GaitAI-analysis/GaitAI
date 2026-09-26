import {
  BookOpen,
  FlaskConical,
  Megaphone,
  PenLine,
  PlayCircle,
  Stamp,
} from "lucide-react";
import { Category } from "@/lib/posts";
import { cn } from "@/lib/utils";

const map: Record<
  Category,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    cls: string;
    dotCls: string;
  }
> = {
  research: {
    label: "Research",
    icon: FlaskConical,
    cls: "text-cyan-300 ring-cyan-300/30 bg-cyan-300/[0.08]",
    dotCls: "bg-cyan-300",
  },
  announcement: {
    label: "Announcement",
    icon: Megaphone,
    cls: "text-royal-400 ring-royal-400/30 bg-royal-400/[0.08]",
    dotCls: "bg-royal-400",
  },
  documentation: {
    label: "Documentation",
    icon: BookOpen,
    cls: "text-violet-300 ring-violet-300/30 bg-violet-300/[0.08]",
    dotCls: "bg-violet-300",
  },
  approval: {
    label: "Approval",
    icon: Stamp,
    cls: "text-emerald-300 ring-emerald-300/30 bg-emerald-300/[0.08]",
    dotCls: "bg-emerald-300",
  },
  blog: {
    label: "Blog",
    icon: PenLine,
    cls: "text-amber-300 ring-amber-300/30 bg-amber-300/[0.08]",
    dotCls: "bg-amber-300",
  },
  demo: {
    label: "Demo",
    icon: PlayCircle,
    cls: "text-pink-300 ring-pink-300/30 bg-pink-300/[0.08]",
    dotCls: "bg-pink-300",
  },
};

export function CategoryBadge({
  category,
  size = "sm",
}: {
  category: Category;
  size?: "sm" | "md";
}) {
  const meta = map[category];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium uppercase tracking-[0.16em] ring-1 backdrop-blur-md",
        meta.cls,
        size === "sm"
          ? "px-2.5 py-1 text-[10px]"
          : "px-3 py-1.5 text-[11px]"
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {meta.label}
    </span>
  );
}

export function CategoryDot({ category }: { category: Category }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]",
        map[category].dotCls
      )}
    />
  );
}

export const categoryGradient: Record<Category, string> = {
  research:
    "linear-gradient(135deg, rgba(79,209,255,0.35), rgba(37,99,255,0.25))",
  announcement:
    "linear-gradient(135deg, rgba(37,99,255,0.4), rgba(124,58,237,0.25))",
  documentation:
    "linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,209,255,0.2))",
  approval:
    "linear-gradient(135deg, rgba(16,185,129,0.32), rgba(79,209,255,0.2))",
  blog:
    "linear-gradient(135deg, rgba(245,158,11,0.28), rgba(124,58,237,0.18))",
  demo:
    "linear-gradient(135deg, rgba(236,72,153,0.3), rgba(124,58,237,0.22))",
};
