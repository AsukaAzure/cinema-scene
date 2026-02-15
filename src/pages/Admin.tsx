import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Film, DollarSign, Ticket, X } from "lucide-react";
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

    // Add showtimes
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

  if (authLoading || loading) return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Admin <span className="text-primary">Dashboard</span></h1>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-primary/10 p-3"><Film className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Movies</p>
              <p className="text-2xl font-bold">{movies.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-primary/10 p-3"><Ticket className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-primary/10 p-3"><DollarSign className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Movie */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Movies</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <><X className="mr-1 h-4 w-4" /> Cancel</> : <><Plus className="mr-1 h-4 w-4" /> Add Movie</>}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 bg-card">
          <CardHeader><CardTitle>New Movie</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addMovie} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Input placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} required />
                <Input placeholder="Duration (minutes)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                <Input placeholder="Ticket Price" type="number" step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} required />
              </div>
              <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Poster Image</label>
                <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Showtimes</label>
                <div className="flex flex-wrap gap-2">
                  {showtimeInputs.map((st, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Input
                        className="w-32"
                        value={st}
                        onChange={(e) => {
                          const updated = [...showtimeInputs];
                          updated[i] = e.target.value;
                          setShowtimeInputs(updated);
                        }}
                      />
                      <button type="button" onClick={() => setShowtimeInputs(showtimeInputs.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowtimeInputs([...showtimeInputs, ""])}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Movie"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Movie List */}
      <div className="space-y-3">
        {movies.map((movie) => (
          <Card key={movie.id} className="bg-card">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-9 overflow-hidden rounded bg-muted">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Film className="h-4 w-4 text-muted-foreground/30" /></div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{movie.title}</p>
                  <p className="text-xs text-muted-foreground">{movie.genre} · {movie.duration}min · ₹{movie.ticket_price}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteMovie(movie.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
};

export default Admin;
