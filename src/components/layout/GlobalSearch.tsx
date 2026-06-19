import { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Brain,
  FileText,
  Calendar,
  Settings,
  User,
  Bell,
  Lock,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

const PAGES = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, keywords: "home overview" },
  { label: "Patients", path: "/patients", icon: Users, keywords: "patient list records" },
  { label: "AI Recommendations", path: "/recommendations", icon: Brain, keywords: "ai insights treatment" },
  { label: "Reports", path: "/reports", icon: FileText, keywords: "documents lab results" },
  { label: "Appointments", path: "/appointments", icon: Calendar, keywords: "schedule visits" },
  { label: "Settings", path: "/settings", icon: Settings, keywords: "preferences profile" },
] as const;

const SETTINGS_SECTIONS = [
  { label: "Profile", section: "profile", icon: User, keywords: "name email phone license" },
  { label: "Notifications", section: "notifications", icon: Bell, keywords: "alerts reminders email" },
  { label: "Security", section: "security", icon: Lock, keywords: "password account" },
] as const;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isSettings = location.pathname === "/settings";

  const runCommand = useCallback(
    (fn: () => void) => {
      setOpen(false);
      fn();
    },
    [],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative hidden h-8 w-56 items-center gap-2 rounded-full border border-border bg-muted/60 px-3 text-left text-sm text-muted-foreground transition hover:border-emerald-400/30 hover:bg-muted/80 md:flex dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-400/20"
      >
        <Search className="size-4 shrink-0 opacity-60 group-hover:opacity-80" />
        <span className="flex-1 truncate">Search patients, reports…</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex dark:border-white/10 dark:bg-white/5">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, settings, patients…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {PAGES.map(({ label, path, icon: Icon, keywords }) => (
              <CommandItem
                key={path}
                value={`${label} ${keywords}`}
                onSelect={() => runCommand(() => navigate(path))}
              >
                <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{label}</span>
                {path === location.pathname && (
                  <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">Current</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>

          {isSettings && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                {SETTINGS_SECTIONS.map(({ label, section, icon: Icon, keywords }) => (
                  <CommandItem
                    key={section}
                    value={`settings ${label} ${keywords}`}
                    onSelect={() =>
                      runCommand(() => {
                        window.dispatchEvent(
                          new CustomEvent("oncoai:settings-section", { detail: section }),
                        );
                      })
                    }
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Quick actions">
            <CommandItem
              value="patients add new"
              onSelect={() => runCommand(() => navigate("/patients"))}
            >
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Go to Patients</span>
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
