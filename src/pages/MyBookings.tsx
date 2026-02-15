import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Ticket, CalendarDays, XCircle } from "lucide-react";
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

  if (loading || authLoading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My <span className="text-primary">Bookings</span></h1>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Ticket className="mb-4 h-16 w-16 opacity-30" />
          <p>No bookings yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id} className={`bg-card ${b.status === "cancelled" ? "opacity-60" : ""}`}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="hidden h-16 w-12 overflow-hidden rounded bg-muted sm:block">
                    {b.movies?.poster_url ? (
                      <img src={b.movies.poster_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/30"><Ticket className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.movies?.title || "Unknown Movie"}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{b.showtimes?.show_date} · {b.showtimes?.show_time}</span>
                      <span>Seats: {b.seats.join(", ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">ID: {b.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">₹{b.total_amount}</p>
                    <p className={`text-xs font-medium ${b.status === "confirmed" ? "text-seat-available" : "text-seat-booked"}`}>
                      {b.status.toUpperCase()}
                    </p>
                  </div>
                  {b.status === "confirmed" && (
                    <Button variant="ghost" size="icon" onClick={() => cancelBooking(b.id)} title="Cancel Booking">
                      <XCircle className="h-5 w-5 text-destructive" />
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
