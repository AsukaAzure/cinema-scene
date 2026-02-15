import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SeatGrid from "@/components/SeatGrid";
import { toast } from "sonner";
import { Clock, Film, ArrowLeft } from "lucide-react";
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

    // Re-check for double booking
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

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>;
  if (!movie) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Movie not found</div>;

  const totalPrice = selectedSeats.length * movie.ticket_price;

  return (
    <main className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Movie Info */}
        <div>
          <div className="aspect-[2/3] overflow-hidden rounded-lg bg-muted">
            {movie.poster_url ? (
              <img src={movie.poster_url} alt={movie.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><Film className="h-16 w-16 text-muted-foreground/30" /></div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{movie.title}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{movie.genre}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{movie.duration} min</span>
          </div>
          {movie.description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{movie.description}</p>}
          <p className="mt-3 text-lg font-semibold text-primary">₹{movie.ticket_price} / seat</p>
        </div>

        {/* Booking Section */}
        <div className="space-y-6">
          {/* Showtimes */}
          <Card className="bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold">Select Showtime</h2>
            {showtimes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No showtimes available</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {showtimes.map((st) => (
                  <Button
                    key={st.id}
                    variant={selectedShowtime === st.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedShowtime(st.id)}
                  >
                    {st.show_time}
                  </Button>
                ))}
              </div>
            )}
          </Card>

          {/* Seats */}
          {selectedShowtime && (
            <Card className="bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Select Seats</h2>
              <SeatGrid bookedSeats={bookedSeats} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} />
            </Card>
          )}

          {/* Summary */}
          {selectedSeats.length > 0 && (
            <Card className="bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""}: {selectedSeats.join(", ")}
                  </p>
                  <p className="text-2xl font-bold text-primary">₹{totalPrice}</p>
                </div>
                <Button size="lg" onClick={handleBooking} disabled={booking}>
                  {booking ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
};

export default MovieDetails;
