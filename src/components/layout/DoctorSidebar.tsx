import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Brain,
  FileText,
  Calendar,
  Settings,
  Stethoscope,
  LogOut,
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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

  const initials = (user?.name || user?.email || "DR")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-slate-200/60 dark:border-white/5",
        "[&_[data-sidebar=sidebar]]:relative [&_[data-sidebar=sidebar]]:overflow-hidden",
        "[&_[data-sidebar=sidebar]]:bg-white/85 [&_[data-sidebar=sidebar]]:backdrop-blur-xl",
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

      <SidebarHeader className="relative z-10 border-b border-slate-200/60 dark:border-white/5">
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

      <SidebarFooter className="relative z-10 border-t border-slate-200/60 dark:border-white/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="mx-1 rounded-2xl border border-slate-200/60 bg-white/50 p-1 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
              <SidebarMenuButton
                size="lg"
                className="cursor-default rounded-xl hover:bg-transparent group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2"
              >
                <Avatar className="size-8 ring-2 ring-emerald-400/20">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-violet-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">
                    {user?.name || "Doctor"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
          <SidebarSeparator className="mx-2 bg-slate-200/60 dark:bg-white/10" />
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign out"
              className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail className="hover:after:bg-emerald-400/30" />
    </Sidebar>
  );
}
