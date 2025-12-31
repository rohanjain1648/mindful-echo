import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Calendar, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStreakStats, DayActivity } from '@/hooks/useStreakStats';
import { format, parseISO, startOfWeek, getDay } from 'date-fns';

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKS_TO_SHOW = 12;

const levelColors = {
  0: 'bg-muted hover:bg-muted/80',
  1: 'bg-primary/25 hover:bg-primary/35',
  2: 'bg-primary/50 hover:bg-primary/60',
  3: 'bg-primary/75 hover:bg-primary/85',
  4: 'bg-primary hover:bg-primary/90',
};

interface HeatmapCellProps {
  day: DayActivity;
  index: number;
}

const HeatmapCell = ({ day, index }: HeatmapCellProps) => {
  const dateObj = parseISO(day.date);
  const formattedDate = format(dateObj, 'MMM d, yyyy');
  
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.002, duration: 0.2 }}
            className={`
              rounded-sm cursor-pointer transition-colors
              ${levelColors[day.level]}
            `}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{formattedDate}</p>
          <p className="text-muted-foreground">
            {day.count} {day.count === 1 ? 'exercise' : 'exercises'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StreakBadge = ({ 
  value, 
  label, 
  icon: Icon, 
  colorClass 
}: { 
  value: number; 
  label: string; 
  icon: React.ElementType;
  colorClass: string;
}) => (
  <div className="flex items-center gap-2">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export const ActivityHeatmap = () => {
  const {
    currentStreak,
    longestStreak,
    totalActiveDays,
    activityMap,
    isLoading,
    todayCount,
  } = useStreakStats(WEEKS_TO_SHOW);

  // Organize days into weeks (columns) with proper day alignment
  const weeks = useMemo(() => {
    if (activityMap.length === 0) return [];

    const result: (DayActivity | null)[][] = [];
    let currentWeek: (DayActivity | null)[] = [];
    
    // Start with the first day
    if (activityMap.length > 0) {
      const firstDate = parseISO(activityMap[0].date);
      const firstDayOfWeek = getDay(firstDate); // 0 = Sunday
      
      // Pad the first week with nulls for days before our data starts
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }
    }

    activityMap.forEach((day) => {
      const dayOfWeek = getDay(parseISO(day.date));
      
      // If it's Sunday and we have data in current week, start new week
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        // Pad the previous week if needed
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        result.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push(day);
    });

    // Push the last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      result.push(currentWeek);
    }

    return result;
  }, [activityMap]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 mb-4">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Activity Streak
              </CardTitle>
              <CardDescription>Your exercise consistency over the last 12 weeks</CardDescription>
            </div>
            
            {/* Streak stats */}
            <div className="flex gap-6">
              <StreakBadge 
                value={currentStreak} 
                label="Current" 
                icon={Flame}
                colorClass="bg-orange-500/20 text-orange-500"
              />
              <StreakBadge 
                value={longestStreak} 
                label="Longest" 
                icon={Trophy}
                colorClass="bg-amber-500/20 text-amber-500"
              />
              <StreakBadge 
                value={totalActiveDays} 
                label="Active Days" 
                icon={Calendar}
                colorClass="bg-primary/20 text-primary"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Current streak highlight */}
          {currentStreak > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20"
            >
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-medium">
                  {currentStreak} day streak! 
                  {todayCount === 0 && (
                    <span className="text-muted-foreground font-normal ml-2">
                      Complete an exercise today to keep it going!
                    </span>
                  )}
                  {todayCount > 0 && (
                    <span className="text-muted-foreground font-normal ml-2">
                      You've done {todayCount} {todayCount === 1 ? 'exercise' : 'exercises'} today!
                    </span>
                  )}
                </span>
              </div>
            </motion.div>
          )}

          {/* Heatmap */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col justify-between pr-2" style={{ gap: CELL_GAP }}>
                {dayLabels.map((label, i) => (
                  <div 
                    key={label} 
                    className="text-xs text-muted-foreground"
                    style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}
                  >
                    {i % 2 === 1 ? label : ''}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              <div className="flex" style={{ gap: CELL_GAP }}>
                {weeks.map((week, weekIndex) => (
                  <div 
                    key={weekIndex} 
                    className="flex flex-col"
                    style={{ gap: CELL_GAP }}
                  >
                    {week.map((day, dayIndex) => (
                      day ? (
                        <HeatmapCell 
                          key={day.date} 
                          day={day} 
                          index={weekIndex * 7 + dayIndex}
                        />
                      ) : (
                        <div 
                          key={`empty-${weekIndex}-${dayIndex}`}
                          style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        />
                      )
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {([0, 1, 2, 3, 4] as const).map((level) => (
                <div
                  key={level}
                  className={`rounded-sm ${levelColors[level]}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
