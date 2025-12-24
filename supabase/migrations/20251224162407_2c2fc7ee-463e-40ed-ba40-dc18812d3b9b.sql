-- Create table for companion sessions
CREATE TABLE public.companion_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  messages_count INTEGER DEFAULT 0,
  mood_summary TEXT,
  topics_discussed TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for companion conversation messages
CREATE TABLE public.companion_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  emotion_detected TEXT,
  sentiment_score DECIMAL(3,2),
  is_significant BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for long-term semantic memories
CREATE TABLE public.companion_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('experience', 'preference', 'strategy', 'trigger', 'strength', 'challenge', 'insight')),
  content TEXT NOT NULL,
  emotional_context TEXT,
  importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
  last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reference_count INTEGER DEFAULT 1,
  source_session_id TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for successful strategies
CREATE TABLE public.companion_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  effectiveness_rating INTEGER DEFAULT 5 CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  times_suggested INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for grounding exercises
CREATE TABLE public.grounding_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('breathing', 'grounding', 'sensory', 'movement', 'cognitive', 'emotional')),
  duration_minutes INTEGER DEFAULT 5,
  instructions JSONB NOT NULL,
  audio_cues TEXT[],
  suitable_for TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grounding_exercises ENABLE ROW LEVEL SECURITY;

-- Public access policies (can be tightened with auth later)
CREATE POLICY "Allow public access on companion_sessions" ON public.companion_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access on companion_messages" ON public.companion_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access on companion_memories" ON public.companion_memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access on companion_strategies" ON public.companion_strategies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access on grounding_exercises" ON public.grounding_exercises FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_companion_messages_session ON public.companion_messages(session_id);
CREATE INDEX idx_companion_memories_type ON public.companion_memories(memory_type);
CREATE INDEX idx_companion_memories_importance ON public.companion_memories(importance_score DESC);

-- Insert default grounding exercises
INSERT INTO public.grounding_exercises (name, category, duration_minutes, instructions, audio_cues, suitable_for) VALUES
('4-7-8 Breathing', 'breathing', 3, '{"steps": ["Breathe in quietly through your nose for 4 seconds", "Hold your breath for 7 seconds", "Exhale completely through your mouth for 8 seconds", "Repeat 3-4 times"]}', ARRAY['inhale', 'hold', 'exhale'], ARRAY['anxiety', 'stress', 'sleep']),
('5-4-3-2-1 Grounding', 'grounding', 5, '{"steps": ["Name 5 things you can see around you", "Name 4 things you can touch", "Name 3 things you can hear", "Name 2 things you can smell", "Name 1 thing you can taste"]}', ARRAY['see', 'touch', 'hear', 'smell', 'taste'], ARRAY['anxiety', 'dissociation', 'overwhelm']),
('Body Scan', 'sensory', 10, '{"steps": ["Start at the top of your head", "Notice any tension or sensations", "Slowly move down through each body part", "Release tension as you go", "End at your toes"]}', ARRAY['head', 'shoulders', 'chest', 'arms', 'legs', 'feet'], ARRAY['stress', 'tension', 'mindfulness']),
('Quick Movement Reset', 'movement', 2, '{"steps": ["Stand up and shake your arms for 10 seconds", "Roll your shoulders backwards 5 times", "Take 3 deep breaths", "Stretch your arms overhead"]}', ARRAY['shake', 'roll', 'breathe', 'stretch'], ARRAY['restlessness', 'energy', 'focus']),
('Task Anchoring', 'cognitive', 5, '{"steps": ["Write down the ONE thing you need to do right now", "Set a timer for 15 minutes", "Work only on that one thing", "When the timer ends, take a 2-minute break", "Repeat if needed"]}', ARRAY['write', 'timer', 'focus', 'break'], ARRAY['adhd', 'focus', 'task-initiation']);