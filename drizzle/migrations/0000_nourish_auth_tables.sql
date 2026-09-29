CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Friend',
  country text NOT NULL DEFAULT 'Kenya',
  goal text NOT NULL DEFAULT 'healthy',
  budget integer NOT NULL DEFAULT 12000,
  age integer NOT NULL DEFAULT 28,
  sex text NOT NULL DEFAULT 'other',
  height integer NOT NULL DEFAULT 175,
  weight numeric NOT NULL DEFAULT 72,
  target_weight numeric NOT NULL DEFAULT 68,
  activity text NOT NULL DEFAULT 'Moderately active',
  diet text NOT NULL DEFAULT 'Balanced',
  obstacles text[] NOT NULL DEFAULT '{}',
  calorie_target integer NOT NULL DEFAULT 2000,
  protein_target integer NOT NULL DEFAULT 120,
  carb_target integer NOT NULL DEFAULT 220,
  fat_target integer NOT NULL DEFAULT 65,
  onboarded boolean NOT NULL DEFAULT false,
  water integer NOT NULL DEFAULT 0,
  favorites text[] NOT NULL DEFAULT '{}',
  notifications boolean NOT NULL DEFAULT true,
  units text NOT NULL DEFAULT 'metric',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_id text NOT NULL,
  food_id text NOT NULL,
  name text NOT NULL,
  serving text NOT NULL DEFAULT '1 serving',
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fat integer NOT NULL DEFAULT 0,
  cost integer NOT NULL DEFAULT 0,
  emoji text NOT NULL DEFAULT '🍽',
  meal text NOT NULL DEFAULT 'Lunch',
  time_label text NOT NULL DEFAULT '',
  logged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own logs" ON public.food_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs" ON public.food_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own logs" ON public.food_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own logs" ON public.food_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Now',
  value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_entries TO authenticated;
GRANT ALL ON public.weight_entries TO service_role;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own weights" ON public.weight_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own weights" ON public.weight_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own weights" ON public.weight_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);