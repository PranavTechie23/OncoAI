import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Activity, LogOut, User, Settings } from "lucide-react";
import GradientText from "./ui/GradientText";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";

const publicNavLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Support", path: "/support" },
];

const privateNavLinks = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Patients", path: "/patients" },
  { name: "AI Recommendations", path: "/recommendations" },
  { name: "Reports", path: "/reports" },
  { name: "Appointments", path: "/appointments" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState<string>(() => window.location.pathname || '/');
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const navLinks = isAuthenticated ? privateNavLinks : publicNavLinks;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/80 dark:bg-slate-950/80 dark:border-slate-800 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src="/assets/OncoAI.png" 
            alt="OncoAI Logo" 
            className="h-18 w-14 object-contain transition-transform group-hover:scale-105 drop-shadow-lg brightness-110"
          />
          <span className="text-xl font-bold text-foreground">
            Onco<span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setActivePath(link.path)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                location.pathname === link.path
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <GradientText
                className="px-2 py-0"
                colors={["#7C3AED", "#06B6D4", "#F472B6"]}
                animationSpeed={6}
                showBorder={false}
                isActive={activePath === link.path}
                animateOnHover={true}
              >
                <span className="text-sm font-medium">{link.name}</span>
              </GradientText>
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/patients" className="cursor-pointer">
                    <Activity className="mr-2 h-4 w-4" />
                    Patients
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/signup">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActivePath(link.path);
                }}
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <GradientText isActive={activePath === link.path} animateOnHover>{link.name}</GradientText>
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-border space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2 text-sm">
                    <p className="font-medium">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="space-y-2 px-4 pb-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/signup">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
