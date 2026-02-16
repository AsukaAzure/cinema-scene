import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SeatGrid from "@/components/SeatGrid";
import { toast } from "sonner";
import { Clock, Film, ArrowLeft, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Movie = Tables<"movies">;
type Showtime = Tables<"showtimes">;

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const [movieRes, showtimeRes] = await Promise.all([
        supabase.from("movies").select("*").eq("id", id).maybeSingle(),
        supabase.from("showtimes").select("*").eq("movie_id", id).order("show_time"),
      ]);
      setMovie(movieRes.data);
      setShowtimes(showtimeRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  useEffect(() => {
    const fetchBooked = async () => {
      if (!selectedShowtime) return;
      const { data } = await supabase
        .from("bookings")
        .select("seats")
        .eq("showtime_id", selectedShowtime)
        .eq("status", "confirmed");
      const seats = (data || []).flatMap((b) => b.seats);
      setBookedSeats(seats);
      setSelectedSeats([]);
    };
    fetchBooked();
  }, [selectedShowtime]);

  const toggleSeat = (seat: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    );
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please sign in to book tickets");
      navigate("/auth");
      return;
    }
    if (!selectedShowtime || selectedSeats.length === 0) {
      toast.error("Select a showtime and at least one seat");
      return;
    }

    setBooking(true);

    const { data: existing } = await supabase
      .from("bookings")
      .select("seats")
      .eq("showtime_id", selectedShowtime)
      .eq("status", "confirmed");
    const alreadyBooked = (existing || []).flatMap((b) => b.seats);
    const conflict = selectedSeats.filter((s) => alreadyBooked.includes(s));
    if (conflict.length > 0) {
      toast.error(`Seats ${conflict.join(", ")} were just booked by someone else`);
      setBookedSeats(alreadyBooked);
      setSelectedSeats((prev) => prev.filter((s) => !conflict.includes(s)));
      setBooking(false);
      return;
    }

    const total = selectedSeats.length * (movie?.ticket_price || 0);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      movie_id: movie!.id,
      showtime_id: selectedShowtime,
      seats: selectedSeats,
      total_amount: total,
    });

    if (error) {
      toast.error("Booking failed. Try again.");
    } else {
      toast.success("Booking confirmed!");
      navigate("/my-bookings");
    }
    setBooking(false);
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  if (!movie)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-muted-foreground">
        <Film className="mb-3 h-12 w-12 opacity-20" />
        <p>Movie not found</p>
      </div>
    );

  const totalPrice = selectedSeats.length * movie.ticket_price;

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      {/* Hero backdrop */}
      <div className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-6 relative">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>

          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* Movie Poster & Info */}
            <div className="animate-fade-in">
              <div className="aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-xl">
                {movie.poster_url ? (
                  <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-secondary">
                    <Film className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                )}
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{movie.genre}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />{movie.duration} min
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{movie.title}</h1>
              {movie.description && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">{movie.description}</p>
              )}
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-lg font-bold text-primary">₹{movie.ticket_price}</span>
                <span className="text-sm text-muted-foreground">/ seat</span>
              </div>

              {/* Showtimes inline */}
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Select Showtime</h2>
                {showtimes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No showtimes available</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {showtimes.map((st) => (
                      <Button
                        key={st.id}
                        variant={selectedShowtime === st.id ? "default" : "outline"}
                        size="sm"
                        className={`rounded-lg transition-all ${selectedShowtime === st.id ? "glow-primary" : ""}`}
                        onClick={() => setSelectedShowtime(st.id)}
                      >
                        {st.show_time}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Selection & Booking */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        {selectedShowtime && (
          <Card className="border-border/50 bg-card p-6 sm:p-8 animate-fade-in">
            <h2 className="mb-6 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">Select Your Seats</h2>
            <SeatGrid bookedSeats={bookedSeats} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} />
          </Card>
        )}

        {selectedSeats.length > 0 && (
          <Card className="border-primary/20 bg-card p-6 glow-primary animate-scale-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} selected
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedSeats.join(", ")}</p>
                <p className="mt-2 font-display text-3xl font-bold text-primary">₹{totalPrice}</p>
              </div>
              <Button size="lg" onClick={handleBooking} disabled={booking} className="rounded-xl text-base glow-primary">
                {booking ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
};

export default MovieDetails;
