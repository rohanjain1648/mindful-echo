import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Settings,
  Coffee,
  Brain,
  Zap,
  TreePine,
  Waves,
  CloudRain,
  Wind,
  Flame,
  Music,
  ChevronDown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';
type AmbientSound = 'none' | 'rain' | 'forest' | 'ocean' | 'fire' | 'wind' | 'lofi';

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsUntilLongBreak: 4,
};

const AMBIENT_SOUNDS: { id: AmbientSound; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { id: 'none', label: 'No Sound', icon: VolumeX, color: 'text-muted-foreground' },
  { id: 'rain', label: 'Rain', icon: CloudRain, color: 'text-blue-400' },
  { id: 'forest', label: 'Forest', icon: TreePine, color: 'text-green-400' },
  { id: 'ocean', label: 'Ocean Waves', icon: Waves, color: 'text-cyan-400' },
  { id: 'fire', label: 'Crackling Fire', icon: Flame, color: 'text-orange-400' },
  { id: 'wind', label: 'Gentle Wind', icon: Wind, color: 'text-slate-400' },
  { id: 'lofi', label: 'Lo-Fi Beats', icon: Music, color: 'text-purple-400' },
];

// Audio URLs for ambient sounds (using free-to-use audio)
const AUDIO_URLS: Record<AmbientSound, string> = {
  none: '',
  rain: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dae5c6b8c.mp3',
  forest: 'https://cdn.pixabay.com/audio/2024/08/18/audio_99a50b67b3.mp3',
  ocean: 'https://cdn.pixabay.com/audio/2024/07/10/audio_61e6cfe4d4.mp3',
  fire: 'https://cdn.pixabay.com/audio/2021/08/09/audio_9a0c448776.mp3',
  wind: 'https://cdn.pixabay.com/audio/2022/03/22/audio_d088bc4a6d.mp3',
  lofi: 'https://cdn.pixabay.com/audio/2022/11/16/audio_bc9ff78d33.mp3',
};

const MODE_CONFIG = {
  work: {
    label: 'Focus Time',
    icon: Brain,
    color: 'from-primary/20 to-primary/10',
    borderColor: 'border-primary/30',
    progressColor: 'bg-primary',
  },
  shortBreak: {
    label: 'Short Break',
    icon: Coffee,
    color: 'from-green-500/20 to-green-500/10',
    borderColor: 'border-green-500/30',
    progressColor: 'bg-green-500',
  },
  longBreak: {
    label: 'Long Break',
    icon: Zap,
    color: 'from-purple-500/20 to-purple-500/10',
    borderColor: 'border-purple-500/30',
    progressColor: 'bg-purple-500',
  },
};

export default function FocusTimerPage() {
  const [settings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');
  const [volume, setVolume] = useState(50);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const getTotalTime = useCallback(() => {
    switch (mode) {
      case 'work':
        return settings.workDuration;
      case 'shortBreak':
        return settings.shortBreakDuration;
      case 'longBreak':
        return settings.longBreakDuration;
    }
  }, [mode, settings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((getTotalTime() - timeLeft) / getTotalTime()) * 100;

  // Handle audio
  useEffect(() => {
    if (ambientSound === 'none') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(AUDIO_URLS[ambientSound]);
    audio.loop = true;
    audio.volume = volume / 100;
    audioRef.current = audio;
    
    if (isRunning) {
      audio.play().catch(console.error);
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [ambientSound]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Play/pause audio with timer
  useEffect(() => {
    if (audioRef.current) {
      if (isRunning && ambientSound !== 'none') {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isRunning, ambientSound]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play completion sound
    const completionAudio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_95ad7da8ef.mp3');
    completionAudio.volume = 0.5;
    completionAudio.play().catch(console.error);

    if (mode === 'work') {
      const newSessions = completedSessions + 1;
      setCompletedSessions(newSessions);
      
      toast.success('Great work! Time for a break.', {
        description: `You've completed ${newSessions} focus session${newSessions > 1 ? 's' : ''} today!`,
      });

      if (newSessions % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakDuration);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration);
      }
    } else {
      toast.success('Break over! Ready to focus?');
      setMode('work');
      setTimeLeft(settings.workDuration);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getTotalTime());
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    switch (newMode) {
      case 'work':
        setTimeLeft(settings.workDuration);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakDuration);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakDuration);
        break;
    }
  };

  const currentModeConfig = MODE_CONFIG[mode];
  const ModeIcon = currentModeConfig.icon;
  const currentSound = AMBIENT_SOUNDS.find(s => s.id === ambientSound)!;
  const SoundIcon = currentSound.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/toolkit">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Focus Timer
                </h1>
                <p className="text-xs text-muted-foreground">Pomodoro technique</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Session Counter */}
        <div className="text-center mb-6">
          <Badge variant="secondary" className="text-sm px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            {completedSessions} session{completedSessions !== 1 ? 's' : ''} completed today
          </Badge>
        </div>

        {/* Mode Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map((m) => {
            const config = MODE_CONFIG[m];
            const Icon = config.icon;
            return (
              <Button
                key={m}
                variant={mode === m ? 'default' : 'outline'}
                size="sm"
                onClick={() => switchMode(m)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Timer Card */}
        <motion.div
          key={mode}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-md mx-auto"
        >
          <Card className={`bg-gradient-to-br ${currentModeConfig.color} ${currentModeConfig.borderColor} border-2 shadow-float`}>
            <CardContent className="p-8">
              {/* Circular Progress */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                {/* Background circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-border"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 2.83} 283`}
                    className={currentModeConfig.progressColor.replace('bg-', 'text-')}
                    initial={{ strokeDasharray: '0 283' }}
                    animate={{ strokeDasharray: `${progress * 2.83} 283` }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                
                {/* Timer display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <ModeIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-5xl font-bold font-mono tracking-tight">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {currentModeConfig.label}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetTimer}
                  className="h-12 w-12 rounded-full"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                
                <Button
                  size="icon"
                  onClick={toggleTimer}
                  className="h-16 w-16 rounded-full shadow-glow"
                >
                  <AnimatePresence mode="wait">
                    {isRunning ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Pause className="h-7 w-7" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Play className="h-7 w-7 ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                    >
                      <SoundIcon className={`h-5 w-5 ${currentSound.color}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    {AMBIENT_SOUNDS.map((sound) => {
                      const Icon = sound.icon;
                      return (
                        <DropdownMenuItem
                          key={sound.id}
                          onClick={() => setAmbientSound(sound.id)}
                          className="gap-3"
                        >
                          <Icon className={`h-4 w-4 ${sound.color}`} />
                          <span className="flex-1">{sound.label}</span>
                          {ambientSound === sound.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Volume Control */}
        <AnimatePresence>
          {ambientSound !== 'none' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-md mx-auto mt-6"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <VolumeX className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Slider
                      value={[volume]}
                      onValueChange={([v]) => setVolume(v)}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground w-10 text-right">{volume}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="max-w-md mx-auto mt-8 space-y-4">
          <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                ADHD Focus Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Remove distractions before starting</li>
                <li>• Keep a notepad nearby for intrusive thoughts</li>
                <li>• Ambient sounds help maintain focus</li>
                <li>• Take real breaks - move your body!</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                Pomodoro Technique
              </h4>
              <p className="text-sm text-muted-foreground">
                Work for 25 minutes, take a 5-minute break. After 4 sessions, 
                take a longer 15-minute break. This technique improves focus 
                and prevents burnout.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
