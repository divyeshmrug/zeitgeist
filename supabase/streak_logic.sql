-- Function to handle streak incrementing logically
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
        -- First ever login
        new_streak := 1;
    ELSIF profile_record.last_login_date = today THEN
        -- Multiple logins same day -> no increase
        new_streak := profile_record.current_streak;
    ELSIF profile_record.last_login_date = yesterday THEN
        -- First login of the new day -> +1 streak
        new_streak := profile_record.current_streak + 1;
    ELSE
        -- Missed a day -> streak broken, reset to 1
        new_streak := 1;
    END IF;

    -- Update profile with new streak and login date
    UPDATE public.profiles 
    SET 
        current_streak = new_streak,
        longest_streak = GREATEST(profile_record.longest_streak, new_streak),
        last_login_date = today,
        updated_at = timezone('utc'::text, now())
    WHERE id = user_uuid;

    -- Also record the login_time in daily_logs
    INSERT INTO public.daily_logs (user_id, log_date, login_time)
    VALUES (user_uuid, today, login_timestamp)
    ON CONFLICT (user_id, log_date) 
    DO UPDATE SET 
        login_time = EXCLUDED.login_time,
        updated_at = timezone('utc'::text, now());

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
