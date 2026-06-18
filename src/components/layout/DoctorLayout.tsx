import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DoctorSidebar } from "./DoctorSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/recommendations": "AI Recommendations",
  "/reports": "Reports",
  "/appointments": "Appointments",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/patients/")) return "Patient Detail";
  return "OncoAI";
}

export function DoctorLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const isDashboard = location.pathname === "/dashboard";

  return (
    <SidebarProvider defaultOpen>
      <DoctorSidebar />
      <SidebarInset className="bg-[#F8FAFC] dark:bg-[#020617]">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/75">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400" />
          <Separator orientation="vertical" className="mr-1 h-4" />

          <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400">
                    Portal
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-foreground">{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            {!isDashboard && (
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patients, reports..."
                  className="h-8 w-56 rounded-full pl-8 text-sm bg-muted/40 border-slate-200/60 focus-visible:ring-emerald-400/50 dark:bg-white/5 dark:border-white/10"
                />
              </div>
            )}
            <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400">
              <Bell className="size-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
