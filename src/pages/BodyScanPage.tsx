import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Waves, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useExercise } from '@/hooks/useExercise';
import { getExerciseById } from '@/data/exerciseLibrary';
import { useExerciseTracker } from '@/hooks/useExerciseTracker';

// Body parts for visual indication
const bodyParts = [
  { name: 'Head', top: 5 },
  { name: 'Shoulders', top: 15 },
  { name: 'Arms', top: 30 },
  { name: 'Chest', top: 35 },
  { name: 'Belly', top: 50 },
  { name: 'Hips', top: 60 },
  { name: 'Legs', top: 75 },
  { name: 'Feet', top: 90 },
];

export default function BodyScanPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const {
    status,
    currentStep,
    totalSteps,
    currentInstruction,
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

  const exercise = getExerciseById('body-scan');

  // Record completion when exercise finishes
  useEffect(() => {
    if (status === 'complete' && !hasRecordedRef.current && startTimeRef.current) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      recordCompletion('body-scan', durationSeconds);
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

  // Calculate which body part is being focused based on progress
  const activeBodyPartIndex = Math.min(
    Math.floor((progress / 100) * bodyParts.length),
    bodyParts.length - 1
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-500/5">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  Body Scan
                </h1>
                <p className="text-xs text-muted-foreground">Progressive Relaxation</p>
              </div>
            </div>
            <Waves className="h-6 w-6 text-blue-500" />
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
                    <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                      <Waves className="h-10 w-10 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl">Body Scan</CardTitle>
                    <CardDescription className="text-base max-w-md mx-auto">
                      A progressive relaxation technique that moves attention through 
                      your body, releasing tension from head to toe.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-secondary/30">
                      <h4 className="font-medium mb-2">Benefits:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Reduces physical tension and stress</li>
                        <li>• Increases body awareness</li>
                        <li>• Helps calm hyperactivity</li>
                        <li>• Promotes better sleep</li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button size="lg" onClick={handleStart} className="px-8 bg-blue-600 hover:bg-blue-700">
                        <Play className="h-5 w-5 mr-2" />
                        Begin Body Scan
                      </Button>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      Duration: ~8 minutes • Best done lying down
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
                    <CardDescription>Release tension, find peace</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Body Visualization */}
                    <div className="flex justify-center py-4">
                      <div className="relative w-24 h-64 bg-secondary/20 rounded-full">
                        {/* Body outline */}
                        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
                        
                        {/* Active body part indicator */}
                        {bodyParts.map((part, index) => (
                          <motion.div
                            key={part.name}
                            className={`absolute left-1/2 -translate-x-1/2 w-16 h-6 rounded-full flex items-center justify-center text-xs ${
                              index <= activeBodyPartIndex
                                ? 'bg-blue-500/30 text-blue-300'
                                : 'bg-secondary/30 text-muted-foreground'
                            }`}
                            style={{ top: `${part.top}%` }}
                            animate={{
                              scale: index === activeBodyPartIndex && isPlaying ? [1, 1.1, 1] : 1,
                              opacity: index === activeBodyPartIndex ? 1 : 0.6,
                            }}
                            transition={{
                              duration: 2,
                              repeat: index === activeBodyPartIndex && isPlaying ? Infinity : 0,
                            }}
                          >
                            {part.name}
                          </motion.div>
                        ))}
                        
                        {/* Progress wave */}
                        <motion.div
                          className="absolute left-0 right-0 bg-gradient-to-t from-blue-500/20 to-transparent rounded-b-full"
                          style={{
                            bottom: 0,
                            height: `${progress}%`,
                          }}
                        />
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
                        <span>Step {currentStep}/{totalSteps}</span>
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
                        <p className="text-lg text-blue-500 font-medium">
                          💆 Your body is relaxed and at peace.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setHasStarted(false)}
                        >
                          Try Again
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
