-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    
    -- Streak Tracking
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    
    -- Advanced Fitness Profile
    age INTEGER,
    gender TEXT,
    height_cm INTEGER,
    current_weight_kg DECIMAL(5,2),
    goal_weight_kg DECIMAL(5,2),
    goal_type TEXT, -- 'weight_loss', 'weight_gain', 'maintenance'
    diet_preference TEXT, -- 'vegetarian', 'vegan', 'non_vegetarian', 'eggetarian'
    allergies TEXT,
    medical_restrictions TEXT,
    activity_level TEXT,
    daily_calorie_goal INTEGER DEFAULT 2500,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, current_streak, longest_streak)
  VALUES (new.id, new.email, 0, 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Create Daily Logs table for activities
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_date DATE NOT NULL,
    
    -- Metrics
    water_ml INTEGER DEFAULT 0,
    calories_intake INTEGER DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    weight_kg DECIMAL(5,2),
    
    -- Timestamps (Strict UTC)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE,
    workout_time TIMESTAMP WITH TIME ZONE,
    water_time TIMESTAMP WITH TIME ZONE,
    weight_time TIMESTAMP WITH TIME ZONE,
    calories_time TIMESTAMP WITH TIME ZONE,

    -- Ensure one log per user per day
    UNIQUE(user_id, log_date)
);

-- Enable RLS on daily_logs
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own logs" ON public.daily_logs;
CREATE POLICY "Users can view own logs" 
    ON public.daily_logs FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own logs" ON public.daily_logs;
CREATE POLICY "Users can insert own logs" 
    ON public.daily_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own logs" ON public.daily_logs;
CREATE POLICY "Users can update own logs" 
    ON public.daily_logs FOR UPDATE 
    USING (auth.uid() = user_id);

-- 3. Function to handle streak incrementing logically
CREATE OR REPLACE FUNCTION public.record_user_login(user_uuid UUID, login_timestamp TIMESTAMP WITH TIME ZONE)
RETURNS void AS $$
DECLARE
    profile_record public.profiles%ROWTYPE;
    today DATE := (login_timestamp AT TIME ZONE 'UTC')::DATE;
    yesterday DATE := today - INTERVAL '1 day';
    new_streak INTEGER;
BEGIN
    -- Get current profile
    SELECT * INTO profile_record FROM public.profiles WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Streak Logic
    IF profile_record.last_login_date IS NULL THEN
        new_streak := 1;
    ELSIF profile_record.last_login_date = today THEN
        new_streak := profile_record.current_streak;
    ELSIF profile_record.last_login_date = yesterday THEN
        new_streak := profile_record.current_streak + 1;
    ELSE
        new_streak := 1;
    END IF;

    -- Update profile
    UPDATE public.profiles 
    SET 
        current_streak = new_streak,
        longest_streak = GREATEST(profile_record.longest_streak, new_streak),
        last_login_date = today,
        updated_at = timezone('utc'::text, now())
    WHERE id = user_uuid;

    -- Record login in daily_logs
    INSERT INTO public.daily_logs (user_id, log_date, login_time)
    VALUES (user_uuid, today, login_timestamp)
    ON CONFLICT (user_id, log_date) 
    DO UPDATE SET 
        login_time = EXCLUDED.login_time,
        updated_at = timezone('utc'::text, now());

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC function to get 7-day historical averages for the AI
CREATE OR REPLACE FUNCTION public.get_user_averages_7d(user_uuid UUID)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'avg_calories_intake', COALESCE(ROUND(AVG(calories_intake)), 0),
        'avg_calories_burned', COALESCE(ROUND(AVG(calories_burned)), 0),
        'avg_water_ml', COALESCE(ROUND(AVG(water_ml)), 0),
        'days_logged', COUNT(id)
    ) INTO result
    FROM public.daily_logs
    WHERE user_id = user_uuid
    AND log_date >= (CURRENT_DATE - INTERVAL '7 days');

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
