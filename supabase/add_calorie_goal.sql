-- Add daily_calorie_goal to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS daily_calorie_goal INTEGER DEFAULT 2500;
