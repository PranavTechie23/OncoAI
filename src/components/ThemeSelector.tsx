import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

interface ThemeSelectorProps {
  size?: "sm" | "md";
  className?: string;
}

export function ThemeSelector({ size = "md", className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex rounded-xl border border-border bg-muted/40 p-0.5 dark:border-white/10 dark:bg-white/[0.03]",
          size === "sm" ? "h-8" : "h-9",
          className,
        )}
      />
    );
  }

  const active = theme || "system";

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center rounded-xl border border-border bg-muted/40 p-0.5 dark:border-white/10 dark:bg-white/[0.03]",
        className,
      )}
    >
      {THEMES.map(({ value, label, icon: Icon }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isActive}
            title={label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg font-medium transition",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
              isActive
                ? "bg-background text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
            <span className={size === "sm" ? "hidden sm:inline" : ""}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
