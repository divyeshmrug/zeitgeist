-- Fix: Allow users to insert their own profile (needed for upsert to work)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Also allow users to upsert (needed for ON CONFLICT DO UPDATE)
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;
CREATE POLICY "Users can upsert own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
