import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  subWeeks,
  subMonths,
  isWithinInterval,
  parseISO
} from 'date-fns';

export interface DailyStats {
  date: string;
  completions: number;
  label: string;
}

export interface WeeklyStats {
  weekLabel: string;
  completions: number;
}

export interface ProgressData {
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  thisWeekTotal: number;
  lastWeekTotal: number;
  thisMonthTotal: number;
  lastMonthTotal: number;
  weekOverWeekChange: number;
  monthOverMonthChange: number;
  isLoading: boolean;
}

const getSessionId = (): string => {
  return localStorage.getItem('exercise_session_id') || '';
};

export const useProgressStats = (): ProgressData => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = getSessionId();

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const now = new Date();
        const fourWeeksAgo = subWeeks(now, 4);

        // Fetch all completions from the last 4 weeks
        const { data: completions, error } = await supabase
          .from('exercise_completions')
          .select('completed_at, exercise_id')
          .eq('session_id', sessionId)
          .gte('completed_at', fourWeeksAgo.toISOString())
          .order('completed_at', { ascending: true });

        if (error) throw error;

        // Generate daily stats for current week
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

        const daily: DailyStats[] = daysInWeek.map(day => {
          const dayCompletions = completions?.filter(c => {
            const completedDate = parseISO(c.completed_at);
            return format(completedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          }) || [];

          return {
            date: format(day, 'yyyy-MM-dd'),
            completions: dayCompletions.length,
            label: format(day, 'EEE'),
          };
        });

        setDailyStats(daily);

        // Generate weekly stats for last 4 weeks
        const weekly: WeeklyStats[] = [];
        for (let i = 3; i >= 0; i--) {
          const weekStartDate = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
          const weekEndDate = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

          const weekCompletions = completions?.filter(c => {
            const completedDate = parseISO(c.completed_at);
            return isWithinInterval(completedDate, { start: weekStartDate, end: weekEndDate });
          }) || [];

          weekly.push({
            weekLabel: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i} weeks ago`,
            completions: weekCompletions.length,
          });
        }

        setWeeklyStats(weekly);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, [sessionId]);

  // Calculate totals
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisWeekTotal = weeklyStats.find(w => w.weekLabel === 'This Week')?.completions || 0;
  const lastWeekTotal = weeklyStats.find(w => w.weekLabel === 'Last Week')?.completions || 0;
  
  // For monthly, sum up the weeks
  const thisMonthTotal = weeklyStats.slice(-2).reduce((sum, w) => sum + w.completions, 0);
  const lastMonthTotal = weeklyStats.slice(0, 2).reduce((sum, w) => sum + w.completions, 0);

  const weekOverWeekChange = lastWeekTotal > 0 
    ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    : thisWeekTotal > 0 ? 100 : 0;

  const monthOverMonthChange = lastMonthTotal > 0
    ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
    : thisMonthTotal > 0 ? 100 : 0;

  return {
    dailyStats,
    weeklyStats,
    thisWeekTotal,
    lastWeekTotal,
    thisMonthTotal,
    lastMonthTotal,
    weekOverWeekChange,
    monthOverMonthChange,
    isLoading,
  };
};
