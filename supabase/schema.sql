-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_login_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create Daily Logs table for activities
CREATE TABLE public.daily_logs (
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

CREATE POLICY "Users can view own logs" 
    ON public.daily_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" 
    ON public.daily_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" 
    ON public.daily_logs FOR UPDATE 
    USING (auth.uid() = user_id);
