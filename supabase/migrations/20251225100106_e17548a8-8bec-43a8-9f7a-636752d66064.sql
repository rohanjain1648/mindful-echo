-- Create table for tracking exercise completions
CREATE TABLE public.exercise_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  exercise_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user favorites
CREATE TABLE public.exercise_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  exercise_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id),
  UNIQUE(session_id, exercise_id)
);

-- Enable RLS
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for exercise_completions
CREATE POLICY "Users can view their own completions"
ON public.exercise_completions
FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can insert their own completions"
ON public.exercise_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow anonymous completions"
ON public.exercise_completions
FOR ALL
USING (session_id IS NOT NULL)
WITH CHECK (session_id IS NOT NULL);

-- RLS policies for exercise_favorites
CREATE POLICY "Users can view their own favorites"
ON public.exercise_favorites
FOR SELECT
USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Users can manage their own favorites"
ON public.exercise_favorites
FOR ALL
USING (auth.uid() = user_id OR session_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for performance
CREATE INDEX idx_exercise_completions_user ON public.exercise_completions(user_id);
CREATE INDEX idx_exercise_completions_session ON public.exercise_completions(session_id);
CREATE INDEX idx_exercise_completions_exercise ON public.exercise_completions(exercise_id);
CREATE INDEX idx_exercise_favorites_user ON public.exercise_favorites(user_id);
CREATE INDEX idx_exercise_favorites_session ON public.exercise_favorites(session_id);