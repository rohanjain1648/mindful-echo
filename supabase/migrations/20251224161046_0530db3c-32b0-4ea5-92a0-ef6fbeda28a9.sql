-- Create table for storing assessment sessions
CREATE TABLE public.assessment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  total_questions INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing individual responses
CREATE TABLE public.assessment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  user_response TEXT NOT NULL,
  ai_acknowledgment TEXT,
  sentiment_score DECIMAL(3,2),
  emotion_detected TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing the final analysis/report
CREATE TABLE public.assessment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  overall_sentiment_score DECIMAL(3,2),
  primary_patterns TEXT[],
  strengths TEXT[],
  challenges TEXT[],
  recommendations JSONB,
  detailed_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (but allow public access for now since no auth)
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;

-- Public access policies (can be tightened with auth later)
CREATE POLICY "Allow public read/write on assessment_sessions"
  ON public.assessment_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read/write on assessment_responses"
  ON public.assessment_responses
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read/write on assessment_reports"
  ON public.assessment_reports
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_assessment_responses_session ON public.assessment_responses(session_id);
CREATE INDEX idx_assessment_reports_session ON public.assessment_reports(session_id);