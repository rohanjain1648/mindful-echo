import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  format, 
  subDays, 
  parseISO, 
  differenceInCalendarDays,
  startOfDay,
  isSameDay
} from 'date-fns';

export interface DayActivity {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 1-4 = intensity levels
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  activityMap: DayActivity[];
  isLoading: boolean;
  todayCount: number;
}

const getSessionId = (): string => {
  return localStorage.getItem('exercise_session_id') || '';
};

export const useStreakStats = (weeks: number = 12): StreakData => {
  const [activityMap, setActivityMap] = useState<DayActivity[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalActiveDays, setTotalActiveDays] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = getSessionId();

  const fetchStreakData = useCallback(async () => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      const startDate = subDays(today, weeks * 7);

      // Fetch all completions for the time period
      const { data: completions, error } = await supabase
        .from('exercise_completions')
        .select('completed_at')
        .eq('session_id', sessionId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true });

      if (error) throw error;

      // Create a map of date -> count
      const dateCountMap: Record<string, number> = {};
      completions?.forEach(c => {
        const date = format(parseISO(c.completed_at), 'yyyy-MM-dd');
        dateCountMap[date] = (dateCountMap[date] || 0) + 1;
      });

      // Find max count to determine levels
      const maxCount = Math.max(...Object.values(dateCountMap), 1);

      // Generate activity map for all days
      const days: DayActivity[] = [];
      for (let i = weeks * 7; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const count = dateCountMap[dateStr] || 0;
        
        // Calculate level (0-4)
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) {
          const ratio = count / maxCount;
          if (ratio <= 0.25) level = 1;
          else if (ratio <= 0.5) level = 2;
          else if (ratio <= 0.75) level = 3;
          else level = 4;
        }

        days.push({ date: dateStr, count, level });
      }

      setActivityMap(days);
      setTodayCount(dateCountMap[format(today, 'yyyy-MM-dd')] || 0);

      // Calculate streaks
      const activeDates = Object.keys(dateCountMap).sort();
      setTotalActiveDays(activeDates.length);

      // Calculate current streak (consecutive days up to today)
      let streak = 0;
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
      
      // Check if user has activity today or yesterday to maintain streak
      const hasActivityToday = dateCountMap[todayStr] > 0;
      const hasActivityYesterday = dateCountMap[yesterdayStr] > 0;
      
      if (hasActivityToday || hasActivityYesterday) {
        // Start counting from today or yesterday
        let checkDate = hasActivityToday ? today : subDays(today, 1);
        
        while (true) {
          const checkStr = format(checkDate, 'yyyy-MM-dd');
          if (dateCountMap[checkStr] > 0) {
            streak++;
            checkDate = subDays(checkDate, 1);
          } else {
            break;
          }
        }
      }
      setCurrentStreak(streak);

      // Calculate longest streak
      let longest = 0;
      let tempStreak = 0;
      let prevDate: Date | null = null;

      activeDates.forEach(dateStr => {
        const currentDate = parseISO(dateStr);
        
        if (prevDate === null) {
          tempStreak = 1;
        } else {
          const daysDiff = differenceInCalendarDays(currentDate, prevDate);
          if (daysDiff === 1) {
            tempStreak++;
          } else {
            longest = Math.max(longest, tempStreak);
            tempStreak = 1;
          }
        }
        prevDate = currentDate;
      });
      longest = Math.max(longest, tempStreak);
      setLongestStreak(longest);

    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, weeks]);

  useEffect(() => {
    fetchStreakData();

    // Refetch when window gains focus
    const handleFocus = () => fetchStreakData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchStreakData]);

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    activityMap,
    isLoading,
    todayCount,
  };
};
