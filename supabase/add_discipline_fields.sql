-- ============================================================
-- Create sleep_logs table for full timestamped history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sleep_time TEXT NOT NULL,          -- e.g. "22:00"
    wake_time TEXT NOT NULL,           -- e.g. "06:00"
    sleep_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_hours NUMERIC NOT NULL,
    slept_on_time BOOLEAN DEFAULT false,
    ideal_duration BOOLEAN DEFAULT false,
    quality TEXT NOT NULL DEFAULT 'poor', -- excellent | good | short | long | poor
    confidence_bonus INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own sleep_logs" ON public.sleep_logs;
CREATE POLICY "Users manage own sleep_logs"
    ON public.sleep_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Create water_logs table for full timestamped history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount_ml INTEGER NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own water_logs" ON public.water_logs;
CREATE POLICY "Users manage own water_logs"
    ON public.water_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Add discipline + sleep columns to profiles
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nfp_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nfp_confidence NUMERIC DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS nfp_last_checkin TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spr_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spr_confidence NUMERIC DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS spr_last_checkin TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sleep_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sleep_confidence NUMERIC DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS sleep_last_checkin TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sleep_last_sleep_time TEXT,
ADD COLUMN IF NOT EXISTS sleep_last_wake_time TEXT,
ADD COLUMN IF NOT EXISTS sleep_last_duration_hours NUMERIC;
