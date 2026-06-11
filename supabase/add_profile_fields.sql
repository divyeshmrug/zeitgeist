-- 1. Add new fields to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS current_weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS goal_weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS goal_type TEXT, -- 'weight_loss', 'weight_gain', 'maintenance'
ADD COLUMN IF NOT EXISTS diet_preference TEXT, -- 'vegetarian', 'vegan', 'non_vegetarian', 'eggetarian'
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS medical_restrictions TEXT,
ADD COLUMN IF NOT EXISTS activity_level TEXT;

-- 2. Create RPC function to get 7-day historical averages for the AI
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
