import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  ai_prompt: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface JournalPrompt {
  title: string;
  prompt: string;
  category: 'reflection' | 'gratitude' | 'growth' | 'grounding' | 'celebration';
}

interface PromptsResponse {
  prompts: JournalPrompt[];
  encouragement: string;
  error?: string;
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [encouragement, setEncouragement] = useState('');
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const { toast } = useToast();

  const getSessionId = () => {
    let sessionId = localStorage.getItem('journal_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('journal_session_id', sessionId);
    }
    return sessionId;
  };

  const fetchEntries = useCallback(async () => {
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrompts = async (mood?: string) => {
    setLoadingPrompts(true);
    try {
      // Get recent assessment context
      const sessionId = localStorage.getItem('assessment_session_id');
      let assessmentContext = '';
      
      if (sessionId) {
        const { data: report } = await supabase
          .from('assessment_reports')
          .select('primary_patterns, strengths, challenges')
          .eq('session_id', sessionId)
          .maybeSingle();

        if (report) {
          const patterns = report.primary_patterns?.join(', ') || '';
          const strengths = report.strengths?.join(', ') || '';
          const challenges = report.challenges?.join(', ') || '';
          assessmentContext = `Patterns: ${patterns}. Strengths: ${strengths}. Challenges: ${challenges}`;
        }
      }

      const { data, error } = await supabase.functions.invoke('journal-prompts', {
        body: { mood, assessmentContext }
      });

      if (error) throw error;

      const response = data as PromptsResponse;
      setPrompts(response.prompts || []);
      setEncouragement(response.encouragement || '');
    } catch (error) {
      console.error('Error fetching prompts:', error);
      // Fallback prompts
      setPrompts([
        { title: "Today's Reflection", prompt: "What's on your mind right now?", category: 'reflection' },
        { title: "Gratitude", prompt: "What are you thankful for today?", category: 'gratitude' },
        { title: "Growth", prompt: "What's one small step you can take today?", category: 'growth' }
      ]);
      setEncouragement("Take your time with your thoughts.");
    } finally {
      setLoadingPrompts(false);
    }
  };

  const saveEntry = async (entry: {
    title?: string;
    content: string;
    mood?: string;
    ai_prompt?: string;
    tags?: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          ...entry,
          user_id: user?.id || null,
          session_id: user ? null : sessionId,
          tags: entry.tags || []
        })
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [data, ...prev]);
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved.",
      });
      return data;
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to save your entry. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been removed.",
      });
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete entry.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    prompts,
    encouragement,
    loadingPrompts,
    fetchPrompts,
    saveEntry,
    deleteEntry,
    refetch: fetchEntries
  };
}
