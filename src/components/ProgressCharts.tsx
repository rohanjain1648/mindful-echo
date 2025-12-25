import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useProgressStats } from '@/hooks/useProgressStats';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary">
          {payload[0].value} {payload[0].value === 1 ? 'exercise' : 'exercises'}
        </p>
      </div>
    );
  }
  return null;
};

const TrendIndicator = ({ value }: { value: number }) => {
  if (value > 0) {
    return (
      <span className="flex items-center gap-1 text-green-500 text-sm">
        <TrendingUp className="h-4 w-4" />
        +{value}%
      </span>
    );
  } else if (value < 0) {
    return (
      <span className="flex items-center gap-1 text-red-500 text-sm">
        <TrendingDown className="h-4 w-4" />
        {value}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-sm">
      <Minus className="h-4 w-4" />
      0%
    </span>
  );
};

export const ProgressCharts = () => {
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');
  const {
    dailyStats,
    weeklyStats,
    thisWeekTotal,
    lastWeekTotal,
    thisMonthTotal,
    weekOverWeekChange,
    monthOverMonthChange,
    isLoading,
  } = useProgressStats();

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = dailyStats.some(d => d.completions > 0) || weeklyStats.some(w => w.completions > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
              <CardDescription>Track your exercise consistency over time</CardDescription>
            </div>
            
            {/* Summary stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{thisWeekTotal}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
                <TrendIndicator value={weekOverWeekChange} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{thisMonthTotal}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
                <TrendIndicator value={monthOverMonthChange} />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={chartView} onValueChange={(v) => setChartView(v as 'weekly' | 'monthly')}>
            <TabsList className="mb-4">
              <TabsTrigger value="weekly" className="gap-2">
                <Calendar className="h-4 w-4" />
                This Week
              </TabsTrigger>
              <TabsTrigger value="monthly" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                4-Week Trend
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-0">
              {!hasData ? (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No exercises completed yet this week</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Complete an exercise to see your progress here
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="completions" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="mt-0">
              {!hasData ? (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No exercise history yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Your 4-week trend will appear here as you complete exercises
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="weekLabel" 
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone"
                        dataKey="completions" 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorCompletions)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Daily breakdown for current week */}
          {chartView === 'weekly' && hasData && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Daily breakdown</p>
              <div className="flex justify-between gap-1">
                {dailyStats.map((day) => (
                  <div key={day.date} className="flex-1 text-center">
                    <div 
                      className={`h-2 rounded-full mx-auto mb-1 transition-colors ${
                        day.completions > 0 ? 'bg-primary' : 'bg-muted'
                      }`}
                      style={{ 
                        width: '100%',
                        opacity: day.completions > 0 ? Math.min(0.3 + (day.completions * 0.2), 1) : 0.3 
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
