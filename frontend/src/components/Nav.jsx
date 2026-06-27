import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, LogOut } from "lucide-react";

export default function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        <div className="glass rounded-2xl px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <div className="h-8 w-8 rounded-lg bg-white grid place-items-center">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <span className="font-display text-lg font-bold tracking-tighter">Nexar</span>
            <span className="ml-1 text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Beta</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-zinc-400">
            <a href="/#features" className="hover:text-white transition" data-testid="nav-features">Features</a>
            <a href="/#categories" className="hover:text-white transition" data-testid="nav-categories">Categories</a>
            <a href="/#pricing" className="hover:text-white transition" data-testid="nav-pricing">Pricing</a>
            <a href="/#faq" className="hover:text-white transition" data-testid="nav-faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/dashboard")} data-testid="nav-dashboard-btn" className="text-zinc-300 hover:text-white">
                  <LayoutDashboard className="h-4 w-4 mr-1.5" /> Dashboard
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { logout(); nav("/"); }} data-testid="nav-logout-btn" className="text-zinc-400 hover:text-white">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => nav("/login")} data-testid="nav-login-btn" className="text-zinc-300 hover:text-white">Sign in</Button>
                <Button size="sm" onClick={() => nav("/signup")} data-testid="nav-signup-btn" className="bg-white text-black hover:bg-zinc-200 rounded-full px-4">Get Started</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
