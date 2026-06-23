import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-border/40 dark:border-white/5 mt-auto relative z-40">
      <div className="container py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:pr-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-base font-bold text-foreground tracking-tight group-hover:opacity-80 transition-opacity">
                Onco<span className="text-primary">AI</span>
              </span>
            </Link>
            <div className="h-4 w-px bg-border/60" />
            <p className="text-xs text-muted-foreground font-medium">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a href="mailto:contact@oncoai.com" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium">
              <Mail className="h-3.5 w-3.5" />
              Support
            </a>
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );;
}
