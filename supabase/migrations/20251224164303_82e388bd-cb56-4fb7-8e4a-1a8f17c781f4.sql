-- Drop the security definer view and recreate as a regular view
DROP VIEW IF EXISTS public.moderation_metrics_daily;

-- Recreate as invoker view (default, no SECURITY DEFINER)
CREATE VIEW public.moderation_metrics_daily 
WITH (security_invoker = true) AS
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