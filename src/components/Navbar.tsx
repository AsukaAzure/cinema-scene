import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Film, Ticket, LogOut, Shield, Menu, X } from "lucide-react";
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
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <Film className="h-6 w-6" />
          CineBook
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-4 md:flex">
          <Link to="/" className="text-sm text-muted-foreground transition hover:text-foreground">
            Movies
          </Link>
          {user && (
            <Link to="/my-bookings" className="text-sm text-muted-foreground transition hover:text-foreground">
              <span className="flex items-center gap-1"><Ticket className="h-4 w-4" /> My Bookings</span>
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm text-muted-foreground transition hover:text-foreground">
              <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> Admin</span>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <div className="flex flex-col gap-3 pt-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Movies</Link>
            {user && (
              <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">My Bookings</Link>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-muted-foreground">Admin</Link>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                <LogOut className="mr-1 h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <Button size="sm" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Sign In</Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
