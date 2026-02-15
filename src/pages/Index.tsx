import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Film } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Movie = Tables<"movies">;

const Index = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      const { data } = await supabase
        .from("movies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setMovies(data || []);
      setLoading(false);
    };
    fetchMovies();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Now <span className="text-primary">Showing</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Book your favourite movies in seconds</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card">
              <div className="aspect-[2/3] rounded-t-lg bg-muted" />
              <CardContent className="p-4 space-y-2">
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Film className="mb-4 h-16 w-16 opacity-30" />
          <p className="text-lg">No movies available right now</p>
          <p className="text-sm">Check back later for new releases!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {movies.map((movie) => (
            <Card key={movie.id} className="group overflow-hidden bg-card transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
              <div className="aspect-[2/3] overflow-hidden bg-muted">
                {movie.poster_url ? (
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold leading-tight">{movie.title}</h2>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-0.5">{movie.genre}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{movie.duration} min</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">₹{movie.ticket_price}</span>
                  <Button asChild size="sm">
                    <Link to={`/movie/${movie.id}`}>Book Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
};

export default Index;
