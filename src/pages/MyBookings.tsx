import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Ticket, CalendarDays, XCircle, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookingWithMovie {
  id: string;
  seats: string[];
  total_amount: number;
  status: string;
  created_at: string;
  movies: { title: string; poster_url: string | null } | null;
  showtimes: { show_time: string; show_date: string } | null;
}

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, movies(title, poster_url), showtimes(show_time, show_date)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBookings((data as unknown as BookingWithMovie[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user, authLoading, navigate]);

  const cancelBooking = async (id: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast.error("Failed to cancel booking");
    } else {
      toast.success("Booking cancelled");
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
    }
  };

  if (loading || authLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          My <span className="text-gradient">Bookings</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-muted-foreground">
          <Ticket className="mb-4 h-16 w-16 opacity-20" />
          <p className="text-lg font-medium">No bookings yet</p>
          <p className="mt-1 text-sm">Browse movies and book your first ticket!</p>
          <Button className="mt-6" onClick={() => navigate("/")}>Browse Movies</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => (
            <Card
              key={b.id}
              className={`border-border/50 bg-card transition-all animate-fade-in ${b.status === "cancelled" ? "opacity-50" : "hover:border-primary/20"}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="hidden h-16 w-12 overflow-hidden rounded-lg bg-muted sm:block flex-shrink-0">
                    {b.movies?.poster_url ? (
                      <img src={b.movies.poster_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Film className="h-5 w-5 text-muted-foreground/20" /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.movies?.title || "Unknown Movie"}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{b.showtimes?.show_date} · {b.showtimes?.show_time}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5">Seats: {b.seats.join(", ")}</span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">#{b.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">₹{b.total_amount}</p>
                    <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      b.status === "confirmed"
                        ? "bg-seat-available/10 text-seat-available"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  {b.status === "confirmed" && (
                    <Button variant="ghost" size="icon" onClick={() => cancelBooking(b.id)} title="Cancel Booking" className="text-muted-foreground hover:text-destructive">
                      <XCircle className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
};

export default MyBookings;
