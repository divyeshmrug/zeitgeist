-- supabase/add_fitai_chat_history.sql

-- Create the fitai_chat_history table
CREATE TABLE IF NOT EXISTS public.fitai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.fitai_chat_history ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own chat history" 
    ON public.fitai_chat_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history" 
    ON public.fitai_chat_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat history" 
    ON public.fitai_chat_history FOR DELETE 
    USING (auth.uid() = user_id);

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS fitai_chat_history_user_id_idx ON public.fitai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS fitai_chat_history_conversation_id_idx ON public.fitai_chat_history(conversation_id);
