import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EXERCISE_LIBRARY, Exercise } from '@/data/exerciseLibrary';

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('exercise_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('exercise_session_id', sessionId);
  }
  return sessionId;
};

export interface ExerciseStats {
  exerciseId: string;
  completionCount: number;
  lastCompleted: Date | null;
  isFavorite: boolean;
}

export interface UseExerciseTrackerReturn {
  exercises: Exercise[];
  stats: Record<string, ExerciseStats>;
  favorites: string[];
  totalCompletions: number;
  currentStreak: number;
  isLoading: boolean;
  toggleFavorite: (exerciseId: string) => Promise<void>;
  recordCompletion: (exerciseId: string, durationSeconds?: number) => Promise<void>;
  getExerciseStats: (exerciseId: string) => ExerciseStats;
}

export const useExerciseTracker = (): UseExerciseTrackerReturn => {
  const [stats, setStats] = useState<Record<string, ExerciseStats>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const sessionId = getSessionId();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch completions
      const { data: completions, error: completionsError } = await supabase
        .from('exercise_completions')
        .select('exercise_id, completed_at')
        .eq('session_id', sessionId)
        .order('completed_at', { ascending: false });

      if (completionsError) throw completionsError;

      // Fetch favorites
      const { data: favs, error: favsError } = await supabase
        .from('exercise_favorites')
        .select('exercise_id')
        .eq('session_id', sessionId);

      if (favsError) throw favsError;

      // Process completions into stats
      const newStats: Record<string, ExerciseStats> = {};
      EXERCISE_LIBRARY.forEach(exercise => {
        const exerciseCompletions = completions?.filter(c => c.exercise_id === exercise.id) || [];
        newStats[exercise.id] = {
          exerciseId: exercise.id,
          completionCount: exerciseCompletions.length,
          lastCompleted: exerciseCompletions.length > 0 
            ? new Date(exerciseCompletions[0].completed_at) 
            : null,
          isFavorite: favs?.some(f => f.exercise_id === exercise.id) || false,
        };
      });

      setStats(newStats);
      setFavorites(favs?.map(f => f.exercise_id) || []);
    } catch (error) {
      console.error('Error fetching exercise data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Fetch on mount and refetch when window gains focus (user returns to page)
  useEffect(() => {
    fetchData();

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  const toggleFavorite = useCallback(async (exerciseId: string) => {
    const isFavorite = favorites.includes(exerciseId);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('exercise_favorites')
          .delete()
          .eq('session_id', sessionId)
          .eq('exercise_id', exerciseId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== exerciseId));
        setStats(prev => ({
          ...prev,
          [exerciseId]: { ...prev[exerciseId], isFavorite: false }
        }));

        toast({ title: 'Removed from favorites' });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('exercise_favorites')
          .insert({ session_id: sessionId, exercise_id: exerciseId });

        if (error) throw error;

        setFavorites(prev => [...prev, exerciseId]);
        setStats(prev => ({
          ...prev,
          [exerciseId]: { ...prev[exerciseId], isFavorite: true }
        }));

        toast({ title: 'Added to favorites', description: 'Find it quickly in your favorites tab!' });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({ title: 'Error', description: 'Could not update favorite', variant: 'destructive' });
    }
  }, [favorites, sessionId, toast]);

  const recordCompletion = useCallback(async (exerciseId: string, durationSeconds?: number) => {
    try {
      const { error } = await supabase
        .from('exercise_completions')
        .insert({
          session_id: sessionId,
          exercise_id: exerciseId,
          duration_seconds: durationSeconds,
        });

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          completionCount: (prev[exerciseId]?.completionCount || 0) + 1,
          lastCompleted: new Date(),
        }
      }));

      toast({
        title: '🎉 Exercise Complete!',
        description: 'Great job taking care of yourself.',
      });
    } catch (error) {
      console.error('Error recording completion:', error);
    }
  }, [sessionId, toast]);

  const getExerciseStats = useCallback((exerciseId: string): ExerciseStats => {
    return stats[exerciseId] || {
      exerciseId,
      completionCount: 0,
      lastCompleted: null,
      isFavorite: false,
    };
  }, [stats]);

  // Calculate total completions
  const totalCompletions = Object.values(stats).reduce(
    (sum, stat) => sum + stat.completionCount, 
    0
  );

  // Calculate streak (days in a row with at least one completion)
  const currentStreak = 0; // Simplified for now

  return {
    exercises: EXERCISE_LIBRARY,
    stats,
    favorites,
    totalCompletions,
    currentStreak,
    isLoading,
    toggleFavorite,
    recordCompletion,
    getExerciseStats,
  };
};
