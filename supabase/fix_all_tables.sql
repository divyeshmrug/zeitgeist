-- ============================================================
-- STEP 1: Create activity_logs table (meals + workouts per day)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,

    activity_type TEXT NOT NULL CHECK (activity_type IN ('meal', 'exercise')),
    name TEXT NOT NULL,
    calories_intake INTEGER DEFAULT 0,   -- for meals
    calories_burned INTEGER DEFAULT 0,   -- for workouts
    category TEXT,                        -- e.g. "Gym", "Surya Namaskar", "Breakfast"
    explanation TEXT,                     -- AI/calc explanation text
    added_by_ai BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- STEP 2: Enable Row Level Security
-- ============================================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to fully manage their own logs
DROP POLICY IF EXISTS "Users manage own activity_logs" ON public.activity_logs;
CREATE POLICY "Users manage own activity_logs"
    ON public.activity_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- STEP 3: Fix profiles table — allow upsert (INSERT + UPDATE)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;

CREATE POLICY "Users manage own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- STEP 4: Fix daily_logs table — allow upsert
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own logs" ON public.daily_logs;
DROP POLICY IF EXISTS "Users manage own daily_logs" ON public.daily_logs;

CREATE POLICY "Users manage own daily_logs"
    ON public.daily_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Done! All tables now support full CRUD for authenticated users.
-- ============================================================
