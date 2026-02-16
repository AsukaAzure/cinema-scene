import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Film, IndianRupee, Ticket, X, TrendingUp, Clapperboard } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Movie = Tables<"movies">;

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add movie form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [ticketPrice, setTicketPrice] = useState("250");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [showtimeInputs, setShowtimeInputs] = useState<string[]>(["10:00 AM", "1:30 PM", "6:00 PM", "9:30 PM"]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      const [moviesRes, bookingsRes] = await Promise.all([
        supabase.from("movies").select("*").order("created_at", { ascending: false }),
        supabase.from("bookings").select("total_amount, status").eq("status", "confirmed"),
      ]);

      setMovies(moviesRes.data || []);
      const bookings = bookingsRes.data || [];
      setTotalBookings(bookings.length);
      setTotalRevenue(bookings.reduce((sum, b) => sum + Number(b.total_amount), 0));
      setLoading(false);
    };
    fetchData();
  }, [user, isAdmin, authLoading, navigate]);

  const addMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let posterUrl: string | null = null;
    if (posterFile) {
      const ext = posterFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("posters")
        .upload(path, posterFile);
      if (uploadError) {
        toast.error("Poster upload failed");
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("posters").getPublicUrl(path);
      posterUrl = urlData.publicUrl;
    }

    const { data: movieData, error } = await supabase
      .from("movies")
      .insert({
        title,
        genre,
        duration: parseInt(duration),
        description: description || null,
        poster_url: posterUrl,
        ticket_price: parseFloat(ticketPrice),
      })
      .select()
      .single();

    if (error || !movieData) {
      toast.error("Failed to add movie");
      setSaving(false);
      return;
    }

    const validShowtimes = showtimeInputs.filter((s) => s.trim());
    if (validShowtimes.length > 0) {
      await supabase.from("showtimes").insert(
        validShowtimes.map((st) => ({
          movie_id: movieData.id,
          show_time: st.trim(),
        }))
      );
    }

    toast.success("Movie added!");
    setMovies((prev) => [movieData, ...prev]);
    resetForm();
    setSaving(false);
  };

  const deleteMovie = async (id: string) => {
    const { error } = await supabase.from("movies").update({ is_active: false }).eq("id", id);
    if (error) {
      toast.error("Failed to remove movie");
    } else {
      setMovies((prev) => prev.filter((m) => m.id !== id));
      toast.success("Movie removed");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setTitle("");
    setGenre("");
    setDuration("");
    setDescription("");
    setTicketPrice("250");
    setPosterFile(null);
    setShowtimeInputs(["10:00 AM", "1:30 PM", "6:00 PM", "9:30 PM"]);
  };

  if (authLoading || loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Admin <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage movies, showtimes and track revenue</p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Clapperboard, label: "Total Movies", value: movies.length, color: "text-primary" },
          { icon: Ticket, label: "Total Bookings", value: totalBookings, color: "text-seat-available" },
          { icon: TrendingUp, label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "text-primary" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50 bg-card animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Movie */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Movies</h2>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="rounded-xl">
          {showForm ? <><X className="mr-1.5 h-4 w-4" /> Cancel</> : <><Plus className="mr-1.5 h-4 w-4" /> Add Movie</>}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-primary/20 bg-card animate-scale-in">
          <CardHeader><CardTitle>New Movie</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addMovie} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="bg-secondary/50" />
                <Input placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} required className="bg-secondary/50" />
                <Input placeholder="Duration (minutes)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required className="bg-secondary/50" />
                <Input placeholder="Ticket Price" type="number" step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} required className="bg-secondary/50" />
              </div>
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary/50" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Poster Image</label>
                <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} className="bg-secondary/50" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Showtimes</label>
                <div className="flex flex-wrap gap-2">
                  {showtimeInputs.map((st, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Input
                        className="w-32 bg-secondary/50"
                        value={st}
                        onChange={(e) => {
                          const updated = [...showtimeInputs];
                          updated[i] = e.target.value;
                          setShowtimeInputs(updated);
                        }}
                      />
                      <button type="button" onClick={() => setShowtimeInputs(showtimeInputs.filter((_, j) => j !== i))} className="rounded p-1 hover:bg-destructive/10">
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowtimeInputs([...showtimeInputs, ""])} className="rounded-lg">
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="rounded-xl glow-primary">{saving ? "Saving..." : "Add Movie"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Movie List */}
      <div className="space-y-2">
        {movies.map((movie, i) => (
          <Card key={movie.id} className="border-border/50 bg-card transition-colors hover:border-primary/20 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-9 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Film className="h-4 w-4 text-muted-foreground/20" /></div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{movie.title}</p>
                  <p className="text-xs text-muted-foreground">{movie.genre} · {movie.duration}min · ₹{movie.ticket_price}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteMovie(movie.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default Admin;
