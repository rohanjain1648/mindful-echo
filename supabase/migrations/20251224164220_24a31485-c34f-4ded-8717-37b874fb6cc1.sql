-- Create moderation_logs table to track all content moderation events
CREATE TABLE public.moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT NOT NULL, -- 'companion' or 'assessment'
  content_preview TEXT NOT NULL, -- First 200 chars of content
  full_content_hash TEXT, -- SHA256 hash for deduplication
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  is_crisis BOOLEAN NOT NULL DEFAULT false,
  risk_level TEXT NOT NULL DEFAULT 'none',
  violated_policies TEXT[] DEFAULT '{}',
  confidence NUMERIC,
  reason TEXT,
  safe_response_suggestion TEXT,
  session_id TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- For now, allow public access (in production, restrict to admins)
CREATE POLICY "Allow public read on moderation_logs" 
ON public.moderation_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on moderation_logs" 
ON public.moderation_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on moderation_logs" 
ON public.moderation_logs 
FOR UPDATE 
USING (true);

-- Create indexes for efficient querying
CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs(created_at DESC);
CREATE INDEX idx_moderation_logs_risk_level ON public.moderation_logs(risk_level);
CREATE INDEX idx_moderation_logs_is_blocked ON public.moderation_logs(is_blocked);
CREATE INDEX idx_moderation_logs_is_crisis ON public.moderation_logs(is_crisis);
CREATE INDEX idx_moderation_logs_source ON public.moderation_logs(source);

-- Create daily aggregation view for metrics
CREATE OR REPLACE VIEW public.moderation_metrics_daily AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE is_blocked = true) as blocked_count,
  COUNT(*) FILTER (WHERE is_crisis = true) as crisis_count,
  COUNT(*) FILTER (WHERE risk_level = 'high' OR risk_level = 'critical') as high_risk_count,
  COUNT(*) FILTER (WHERE source = 'companion') as companion_checks,
  COUNT(*) FILTER (WHERE source = 'assessment') as assessment_checks,
  AVG(confidence) as avg_confidence
FROM public.moderation_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;