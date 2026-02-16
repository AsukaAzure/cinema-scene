import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Ticket, LogOut, Shield, Menu, X, Clapperboard } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Clapperboard className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Cine<span className="text-primary">Book</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          <Link to="/" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            Movies
          </Link>
          {user && (
            <Link to="/my-bookings" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <span className="flex items-center gap-1.5"><Ticket className="h-4 w-4" /> My Bookings</span>
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> Admin</span>
            </Link>
          )}
          <div className="ml-2 h-6 w-px bg-border" />
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2 text-muted-foreground hover:text-foreground">
              <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")} className="ml-2">
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="rounded-lg p-2 text-foreground transition-colors hover:bg-accent md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">Movies</Link>
            {user && (
              <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">My Bookings</Link>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">Admin</Link>
            )}
            <div className="my-1 h-px bg-border" />
            {user ? (
              <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <Button size="sm" className="mt-1" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Sign In</Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
