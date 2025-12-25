import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Wind, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useExercise } from '@/hooks/useExercise';
import { getExerciseById } from '@/data/exerciseLibrary';
import { useExerciseTracker } from '@/hooks/useExerciseTracker';

export default function BoxBreathingPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const {
    status,
    currentStep,
    totalSteps,
    currentInstruction,
    currentAction,
    progress,
    isPlaying,
    startExercise,
    pauseExercise,
    resumeExercise,
    stopExercise,
    nextStep,
    ambientVolume,
    setAmbientVolume,
  } = useExercise();
  const { recordCompletion } = useExerciseTracker();

  const exercise = getExerciseById('box-breathing');

  // Record completion when exercise finishes
  useEffect(() => {
    if (status === 'complete' && !hasRecordedRef.current && startTimeRef.current) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      recordCompletion('box-breathing', durationSeconds);
      hasRecordedRef.current = true;
    }
  }, [status, recordCompletion]);

  const handleStart = async () => {
    if (exercise) {
      setHasStarted(true);
      startTimeRef.current = Date.now();
      hasRecordedRef.current = false;
      await startExercise(exercise);
    }
  };

  const handleStop = () => {
    stopExercise();
    setHasStarted(false);
  };

  // Get phase label and color based on action
  const getPhaseInfo = (action?: string) => {
    switch (action) {
      case 'inhale':
        return { label: 'Inhale', color: 'text-green-500', scale: 1.3 };
      case 'exhale':
        return { label: 'Exhale', color: 'text-blue-500', scale: 0.8 };
      case 'hold':
        return { label: 'Hold', color: 'text-amber-500', scale: 1 };
      default:
        return { label: 'Relax', color: 'text-primary', scale: 1 };
    }
  };

  const phaseInfo = getPhaseInfo(currentAction);

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
                  Box Breathing
                </h1>
                <p className="text-xs text-muted-foreground">4-4-4-4 Technique</p>
              </div>
            </div>
            <Wind className="h-6 w-6 text-primary" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {!hasStarted && status === 'idle' ? (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
                  <CardHeader className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Wind className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Box Breathing</CardTitle>
                    <CardDescription className="text-base max-w-md mx-auto">
                      A powerful technique used by Navy SEALs to calm the nervous system. 
                      Breathe in for 4 counts, hold for 4, exhale for 4, and hold for 4.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {['Inhale', 'Hold', 'Exhale', 'Hold'].map((phase, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary/50">
                          <div className="text-2xl font-bold text-primary">4</div>
                          <div className="text-xs text-muted-foreground">{phase}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center">
                      <Button size="lg" onClick={handleStart} className="px-8">
                        <Play className="h-5 w-5 mr-2" />
                        Begin Exercise
                      </Button>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      Duration: ~4 minutes • 5 complete cycles
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="exercise"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{exercise?.title}</CardTitle>
                    <CardDescription>Follow the breathing pattern</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Breathing Visualization */}
                    <div className="flex justify-center py-8">
                      <div className="relative">
                        {/* Outer glow */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
                          animate={{
                            scale: isPlaying ? phaseInfo.scale : 1,
                            opacity: isPlaying ? [0.3, 0.6, 0.3] : 0.3,
                          }}
                          transition={{
                            duration: 4,
                            repeat: isPlaying ? Infinity : 0,
                            ease: 'easeInOut',
                          }}
                          style={{ width: 180, height: 180 }}
                        />
                        
                        {/* Main breathing circle */}
                        <motion.div
                          className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center relative z-10"
                          animate={{
                            scale: isPlaying ? phaseInfo.scale : 1,
                          }}
                          transition={{
                            duration: 4,
                            ease: 'easeInOut',
                          }}
                        >
                          <motion.div
                            className="text-center"
                            key={currentAction}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                          >
                            <div className={`text-2xl font-bold ${phaseInfo.color}`}>
                              {phaseInfo.label}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Step {currentStep}/{totalSteps}
                            </div>
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Current Instruction */}
                    <div className="min-h-[80px] flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentInstruction}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-lg text-center text-foreground/90 italic px-4"
                        >
                          "{currentInstruction || 'Preparing...'}"
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-4">
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                      <Slider
                        value={[ambientVolume * 100]}
                        onValueChange={([value]) => setAmbientVolume(value / 100)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-3">
                      {status === 'playing' ? (
                        <Button variant="outline" size="lg" onClick={pauseExercise}>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </Button>
                      ) : status === 'paused' ? (
                        <Button size="lg" onClick={resumeExercise}>
                          <Play className="h-5 w-5 mr-2" />
                          Resume
                        </Button>
                      ) : status === 'loading' ? (
                        <Button size="lg" disabled>
                          Loading...
                        </Button>
                      ) : null}

                      <Button variant="ghost" size="lg" onClick={nextStep} disabled={status !== 'playing'}>
                        <SkipForward className="h-5 w-5" />
                      </Button>

                      <Button variant="destructive" size="lg" onClick={handleStop}>
                        <Square className="h-5 w-5 mr-2" />
                        End
                      </Button>
                    </div>

                    {status === 'complete' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-4"
                      >
                        <p className="text-lg text-primary font-medium">
                          🧘 Excellent! Your nervous system is calmer now.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setHasStarted(false)}
                        >
                          Do Another Round
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
