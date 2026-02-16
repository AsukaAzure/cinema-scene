import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Film, Sparkles } from "lucide-react";
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
    <main className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-16 sm:py-20 relative">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Now Showing
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Book Your <span className="text-gradient">Cinema</span> Experience
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Choose from the latest releases, pick your perfect seat, and enjoy the show.
            </p>
          </div>
        </div>
      </section>

      {/* Movie Grid */}
      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold">All Movies</h2>
          <span className="text-sm text-muted-foreground">{movies.length} titles</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse overflow-hidden border-border/50">
                <div className="aspect-[2/3] bg-muted" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-muted-foreground">
            <Film className="mb-4 h-16 w-16 opacity-20" />
            <p className="text-lg font-medium">No movies available</p>
            <p className="mt-1 text-sm">Check back later for new releases!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {movies.map((movie, i) => (
              <Card
                key={movie.id}
                className="group overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-secondary">
                      <Film className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold leading-tight line-clamp-1">{movie.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">{movie.genre}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{movie.duration}m</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">₹{movie.ticket_price}</span>
                    <Button asChild size="sm" className="h-8 rounded-lg text-xs">
                      <Link to={`/movie/${movie.id}`}>Book Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Index;
