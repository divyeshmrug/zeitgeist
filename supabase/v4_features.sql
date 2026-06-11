-- supabase/v4_features.sql

-- 1. fitai_chat_history
CREATE TABLE IF NOT EXISTS public.fitai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    conversation_title TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.fitai_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chat history" ON public.fitai_chat_history FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS fitai_chat_history_user_id_idx ON public.fitai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS fitai_chat_history_conversation_id_idx ON public.fitai_chat_history(conversation_id);


-- 2. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium' NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);


-- 3. fitai_suggestions
CREATE TABLE IF NOT EXISTS public.fitai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    category TEXT NOT NULL,
    clicked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.fitai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own suggestions" ON public.fitai_suggestions FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS fitai_suggestions_user_id_idx ON public.fitai_suggestions(user_id);


-- 4. notification_stats
CREATE TABLE IF NOT EXISTS public.notification_stats (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    hydration_response_rate NUMERIC DEFAULT 100.0,
    sleep_response_rate NUMERIC DEFAULT 100.0,
    workout_response_rate NUMERIC DEFAULT 100.0,
    nutrition_response_rate NUMERIC DEFAULT 100.0,
    ai_response_rate NUMERIC DEFAULT 100.0
);
ALTER TABLE public.notification_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notification stats" ON public.notification_stats FOR ALL USING (auth.uid() = user_id);


-- 5. daily_ai_context
CREATE TABLE IF NOT EXISTS public.daily_ai_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recovery_score INTEGER,
    focus TEXT,
    biggest_problem TEXT,
    biggest_win TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);
ALTER TABLE public.daily_ai_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own daily context" ON public.daily_ai_context FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS daily_ai_context_user_id_idx ON public.daily_ai_context(user_id);

-- 6. Add Notification Preferences to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hydration_alerts BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workout_alerts BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sleep_alerts BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_alerts BOOLEAN DEFAULT true;

-- ====================================================
-- FITAI NOTIFICATION ENGINE V5
-- ====================================================

-- 7. Notifications Table (History)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Hydration', 'Workout', 'Sleep', 'AI Insight', etc.
    priority TEXT NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT DEFAULT '/'
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 8. Notification Stats (Adaptive System & Cooldowns)
CREATE TABLE IF NOT EXISTS public.notification_stats (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    ignore_count INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, category)
);

ALTER TABLE public.notification_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stats" ON public.notification_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.notification_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.notification_stats FOR UPDATE USING (auth.uid() = user_id);

-- ====================================================
-- FITAI ENTERPRISE V6 SCHEMA (REAL DATA MODEL)
-- ====================================================

CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sleep_time TIMESTAMPTZ,
    wake_time TIMESTAMPTZ,
    duration_hours NUMERIC,
    sleep_quality INTEGER, -- 0-100
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_type TEXT,
    duration_min INTEGER,
    calories_burned INTEGER,
    intensity TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    protein_g NUMERIC,
    carbs_g NUMERIC,
    fat_g NUMERIC,
    calories INTEGER,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_recovery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    score INTEGER, -- 0-100
    grade TEXT, -- A+, A, B, C, D
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Upgrading Notifications Table for V6 Pipeline
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, queued, sent, failed
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS delivery_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Upgrading Notification Stats for V6 Adaptive Engine
ALTER TABLE public.notification_stats ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0;
ALTER TABLE public.notification_stats ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0;
ALTER TABLE public.notification_stats ADD COLUMN IF NOT EXISTS dismissed_count INTEGER DEFAULT 0;
ALTER TABLE public.notification_stats ADD COLUMN IF NOT EXISTS response_rate NUMERIC DEFAULT 0.0;

-- ====================================================
-- WEB PUSH SUBSCRIPTIONS TABLE
-- Stores browser push subscriptions for background notifications
-- ====================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions
    FOR ALL USING (auth.uid() = user_id);
