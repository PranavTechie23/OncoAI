import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Brain,
  FileText,
  Calendar,
  Settings,
  Stethoscope,
  LogOut,
  User,
  ChevronUp,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Patients", path: "/patients", icon: Users },
  { title: "AI Recommendations", path: "/recommendations", icon: Brain },
  { title: "Reports", path: "/reports", icon: FileText },
  { title: "Appointments", path: "/appointments", icon: Calendar },
  { title: "Settings", path: "/settings", icon: Settings },
];

const navButtonClass =
  "rounded-full transition-all duration-200 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 data-[active=true]:rounded-full data-[active=true]:bg-emerald-500/20 data-[active=true]:text-emerald-800 data-[active=true]:border data-[active=true]:border-emerald-400/40 data-[active=true]:shadow-[0_0_18px_rgba(52,211,153,0.25)] dark:data-[active=true]:text-emerald-50 data-[active=true]:font-medium group-data-[collapsible=icon]:data-[active=true]:shadow-[0_0_12px_rgba(52,211,153,0.3)]";

export function DoctorSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state: sidebarState, isMobile } = useSidebar();
  const showNavTooltips = sidebarState === "collapsed" && !isMobile;

  const userDisplayName = typeof user?.name === 'string' ? user.name : typeof user?.email === 'string' ? user.email : 'DR';
  const initials = userDisplayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-border dark:border-white/5",
        "[&_[data-sidebar=sidebar]]:relative [&_[data-sidebar=sidebar]]:overflow-hidden",
        "[&_[data-sidebar=sidebar]]:bg-sidebar [&_[data-sidebar=sidebar]]:backdrop-blur-xl",
        "dark:[&_[data-sidebar=sidebar]]:bg-slate-950/85",
      )}
    >
      {/* Emerald / violet ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute -top-28 -left-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/15" />
        <div className="absolute -bottom-36 -right-12 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-2xl" />
      </div>

      <SidebarHeader className="relative z-10 border-b border-border dark:border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="OncoAI Dashboard">
              <Link to="/dashboard" className="group/logo">
                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 text-emerald-600 ring-1 ring-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.12)] dark:text-emerald-400 dark:shadow-[0_0_24px_rgba(16,185,129,0.18)]">
                  <Stethoscope className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold tracking-tight">
                    Onco
                    <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-violet-400">
                      AI
                    </span>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Clinical Portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="relative z-10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700/60 dark:text-emerald-400/50">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/dashboard" &&
                    location.pathname.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={navButtonClass}
                    >
                      <Link to={item.path}>
                        <item.icon
                          className={cn(
                            "size-4 transition-colors",
                            isActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground group-hover/menu-button:text-emerald-600 dark:group-hover/menu-button:text-emerald-400",
                          )}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative z-10 border-t border-border p-2 dark:border-white/5">
        <div className="space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {showNavTooltips ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <SidebarFooterProfileButton initials={initials} user={user} />
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center" sideOffset={8} className="z-[100] font-medium">
                    {user?.name || "Doctor"}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <SidebarFooterProfileButton initials={initials} user={user} />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-56 rounded-xl border-border dark:border-white/10"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{user?.name || "Doctor"}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <User className="mr-2 size-4" />
                  Profile & settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl border border-rose-200/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/15 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <LogOut className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail className="hover:after:bg-emerald-400/30" />
    </Sidebar>
  );
}

function SidebarFooterProfileButton({
  initials,
  user,
}: {
  initials: string;
  user: ReturnType<typeof useAuth>["user"];
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-muted/50 p-2 text-left transition hover:bg-muted/80 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
    >
      <div className="relative shrink-0">
        <Avatar className="size-8 ring-2 ring-emerald-400/25">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500/25 to-violet-500/25 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500 dark:border-slate-950" />
      </div>
      <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <div className="truncate text-sm font-medium leading-tight">
          {user?.name || "Doctor"}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {user?.specialty || user?.email || "Clinical portal"}
        </div>
      </div>
      <ChevronUp className="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
    </button>
  );
}
