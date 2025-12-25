import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Heart, 
  Clock, 
  Trophy, 
  Wind, 
  Target, 
  Lightbulb, 
  TreePine, 
  Waves,
  Moon,
  Play,
  Star,
  CheckCircle2,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useExerciseTracker } from '@/hooks/useExerciseTracker';
import { Exercise } from '@/data/exerciseLibrary';
import { formatDistanceToNow } from 'date-fns';
import { ProgressCharts } from '@/components/ProgressCharts';
import { useReminders } from '@/hooks/useReminders';
import { ReminderBanner, CompletedTodayBanner, ReminderSettingsDialog } from '@/components/ReminderComponents';
import { AnimatePresence } from 'framer-motion';
const exerciseIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Wind,
  Target,
  Lightbulb,
  TreePine,
  Waves,
  Moon,
};

const exerciseRoutes: Record<string, string> = {
  'box-breathing': '/box-breathing',
  'senses-grounding': '/senses-grounding',
  'body-scan': '/body-scan',
  'task-anchoring': '/task-anchoring',
  'brain-dump': '/brain-dump',
};

const typeColors: Record<string, string> = {
  breathing: 'bg-green-500/20 text-green-400 border-green-500/30',
  grounding: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  relaxation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  focus: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  clarity: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

interface ExerciseCardProps {
  exercise: Exercise;
  completionCount: number;
  lastCompleted: Date | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onStart: () => void;
}

const ExerciseCard = ({ 
  exercise, 
  completionCount, 
  lastCompleted, 
  isFavorite, 
  onToggleFavorite,
  onStart 
}: ExerciseCardProps) => {
  const Icon = exerciseIcons[exercise.icon] || Wind;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="h-full cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden">
        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'
            }`}
          />
        </button>

        {/* Completion badge */}
        {completionCount > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="secondary" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              {completionCount}
            </Badge>
          </div>
        )}

        <CardHeader className="pt-10" onClick={onStart}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              typeColors[exercise.type]?.replace('text-', 'bg-').split(' ')[0] || 'bg-primary/20'
            }`}>
              <Icon className={`h-6 w-6 ${typeColors[exercise.type]?.split(' ')[1] || 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{exercise.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={typeColors[exercise.type]}>
                  {exercise.type}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {exercise.duration} min
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent onClick={onStart}>
          <CardDescription className="mb-4">{exercise.description}</CardDescription>
          
          {lastCompleted && (
            <p className="text-xs text-muted-foreground mb-3">
              Last completed {formatDistanceToNow(lastCompleted, { addSuffix: true })}
            </p>
          )}

          <Button size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Play className="h-4 w-4 mr-2" />
            Start Exercise
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function ToolkitPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const { 
    exercises, 
    stats, 
    favorites, 
    totalCompletions, 
    isLoading, 
    toggleFavorite,
    getExerciseStats
  } = useExerciseTracker();

  // Check if user has completed any exercise today
  const today = new Date().toISOString().split('T')[0];
  const todaysCompletions = Object.values(stats).filter(s => {
    if (!s.lastCompleted) return false;
    return s.lastCompleted.toISOString().split('T')[0] === today;
  }).reduce((sum, s) => {
    // Count completions from today
    return sum + (s.lastCompleted?.toISOString().split('T')[0] === today ? 1 : 0);
  }, 0);
  const hasCompletedToday = todaysCompletions > 0;

  // Reminders hook
  const reminders = useReminders(hasCompletedToday);

  const handleStartExercise = (exercise: Exercise) => {
    const route = exerciseRoutes[exercise.id];
    if (route) {
      navigate(route);
    } else if (exercise.id === 'guided-meditation') {
      navigate('/meditation');
    }
  };

  const handleStartQuickExercise = () => {
    // Navigate to box breathing as a quick default
    navigate('/box-breathing');
  };

  const filterExercises = (tab: string): Exercise[] => {
    switch (tab) {
      case 'favorites':
        return exercises.filter(e => favorites.includes(e.id));
      case 'recent':
        return exercises
          .filter(e => getExerciseStats(e.id).lastCompleted !== null)
          .sort((a, b) => {
            const aDate = getExerciseStats(a.id).lastCompleted;
            const bDate = getExerciseStats(b.id).lastCompleted;
            if (!aDate) return 1;
            if (!bDate) return -1;
            return bDate.getTime() - aDate.getTime();
          });
      default:
        return exercises;
    }
  };

  const filteredExercises = filterExercises(activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Your Toolkit
                </h1>
                <p className="text-xs text-muted-foreground">Self-care exercises</p>
              </div>
            </div>
            <ReminderSettingsDialog reminders={reminders} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Reminder/Completed Banner */}
        <AnimatePresence>
          {reminders.shouldShowReminder && !hasCompletedToday && (
            <ReminderBanner 
              onDismiss={reminders.dismissReminder}
              onStartExercise={handleStartQuickExercise}
            />
          )}
          {hasCompletedToday && (
            <CompletedTodayBanner completionCount={todaysCompletions} />
          )}
        </AnimatePresence>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCompletions}</p>
                <p className="text-xs text-muted-foreground">Completions</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{favorites.length}</p>
                <p className="text-xs text-muted-foreground">Favorites</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exercises.length}</p>
                <p className="text-xs text-muted-foreground">Exercises</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(stats).filter(s => s.completionCount > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">Tried</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Charts */}
        <ProgressCharts />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex h-auto gap-2 bg-transparent mb-6">
            <TabsTrigger 
              value="all"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All Exercises
            </TabsTrigger>
            <TabsTrigger 
              value="favorites"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger 
              value="recent"
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock className="h-4 w-4 mr-2" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  {activeTab === 'favorites' ? (
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {activeTab === 'favorites' ? 'No favorites yet' : 'No recent exercises'}
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  {activeTab === 'favorites' 
                    ? 'Tap the heart icon on any exercise to add it to your favorites for quick access.'
                    : 'Complete an exercise to see it in your recent history.'}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('all')}
                >
                  Browse All Exercises
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => {
                  const exerciseStats = getExerciseStats(exercise.id);
                  return (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      completionCount={exerciseStats.completionCount}
                      lastCompleted={exerciseStats.lastCompleted}
                      isFavorite={exerciseStats.isFavorite}
                      onToggleFavorite={() => toggleFavorite(exercise.id)}
                      onStart={() => handleStartExercise(exercise)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick tip */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-warm/10 border border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">Pro Tip</h4>
              <p className="text-muted-foreground text-sm">
                Consistency beats intensity. Even a 3-minute grounding exercise done daily 
                is more effective than occasional longer sessions.
              </p>
            </div>
            <Link to="/meditation">
              <Button variant="default" size="sm" className="shrink-0">
                Try Meditation
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
