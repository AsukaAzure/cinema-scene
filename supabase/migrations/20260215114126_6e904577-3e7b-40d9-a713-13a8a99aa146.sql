
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Movies table
CREATE TABLE public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  description TEXT,
  poster_url TEXT,
  ticket_price NUMERIC(10,2) NOT NULL DEFAULT 250.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active movies" ON public.movies
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage movies" ON public.movies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Showtimes table
CREATE TABLE public.showtimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  show_time TEXT NOT NULL, -- e.g. "10:00 AM"
  show_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view showtimes" ON public.showtimes
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage showtimes" ON public.showtimes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  showtime_id UUID REFERENCES public.showtimes(id) ON DELETE CASCADE NOT NULL,
  seats TEXT[] NOT NULL, -- e.g. {"A1", "A2"}
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for movie posters
INSERT INTO storage.buckets (id, name, public) VALUES ('posters', 'posters', true);

CREATE POLICY "Anyone can view posters" ON storage.objects
  FOR SELECT USING (bucket_id = 'posters');
CREATE POLICY "Admins can upload posters" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posters' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete posters" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'posters' AND public.has_role(auth.uid(), 'admin'));
