import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, TreePine, Volume2, VolumeX, SkipForward, Eye, Hand, Ear, Wind as Nose, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useExercise } from '@/hooks/useExercise';
import { getExerciseById } from '@/data/exerciseLibrary';
import { useExerciseTracker } from '@/hooks/useExerciseTracker';

export default function SensesGroundingPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const {
    status,
    currentStep,
    totalSteps,
    currentInstruction,
    currentPrompt,
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

  const exercise = getExerciseById('senses-grounding');

  // Record completion when exercise finishes
  useEffect(() => {
    if (status === 'complete' && !hasRecordedRef.current && startTimeRef.current) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      recordCompletion('senses-grounding', durationSeconds);
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

  // Determine which sense we're focusing on based on step
  const getSenseInfo = () => {
    if (currentStep <= 3) return { icon: Eye, label: 'See', count: 5, color: 'text-blue-500' };
    if (currentStep <= 5) return { icon: Hand, label: 'Touch', count: 4, color: 'text-green-500' };
    if (currentStep <= 7) return { icon: Ear, label: 'Hear', count: 3, color: 'text-purple-500' };
    if (currentStep <= 9) return { icon: Nose, label: 'Smell', count: 2, color: 'text-amber-500' };
    if (currentStep <= 11) return { icon: Coffee, label: 'Taste', count: 1, color: 'text-pink-500' };
    return { icon: TreePine, label: 'Grounded', count: 0, color: 'text-primary' };
  };

  const senseInfo = getSenseInfo();
  const SenseIcon = senseInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-500/5">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  5-4-3-2-1 Senses
                </h1>
                <p className="text-xs text-muted-foreground">Grounding Exercise</p>
              </div>
            </div>
            <TreePine className="h-6 w-6 text-green-500" />
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
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <TreePine className="h-10 w-10 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">5-4-3-2-1 Grounding</CardTitle>
                    <CardDescription className="text-base max-w-md mx-auto">
                      A powerful technique to bring yourself back to the present moment 
                      by engaging all five senses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {[
                        { icon: Eye, label: '5 things you can SEE', color: 'text-blue-500' },
                        { icon: Hand, label: '4 things you can TOUCH', color: 'text-green-500' },
                        { icon: Ear, label: '3 things you can HEAR', color: 'text-purple-500' },
                        { icon: Nose, label: '2 things you can SMELL', color: 'text-amber-500' },
                        { icon: Coffee, label: '1 thing you can TASTE', color: 'text-pink-500' },
                      ].map((sense, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                          <sense.icon className={`h-5 w-5 ${sense.color}`} />
                          <span className="text-sm">{sense.label}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center">
                      <Button size="lg" onClick={handleStart} className="px-8 bg-green-600 hover:bg-green-700">
                        <Play className="h-5 w-5 mr-2" />
                        Begin Grounding
                      </Button>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      Duration: ~3 minutes
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
                    <CardDescription>Engage your senses</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Sense Visualization */}
                    <div className="flex justify-center py-8">
                      <motion.div
                        className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/30 flex flex-col items-center justify-center"
                        animate={{
                          scale: isPlaying ? [1, 1.05, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat: isPlaying ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                      >
                        <SenseIcon className={`h-10 w-10 ${senseInfo.color}`} />
                        <div className="text-3xl font-bold mt-2">{senseInfo.count}</div>
                        <div className="text-xs text-muted-foreground">{senseInfo.label}</div>
                      </motion.div>
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

                    {/* Prompt for interaction */}
                    {currentPrompt && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-lg bg-secondary/50 text-center"
                      >
                        <p className="text-sm text-muted-foreground">{currentPrompt}</p>
                      </motion.div>
                    )}

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
                        <p className="text-lg text-green-500 font-medium">
                          🌿 You are present. You are grounded.
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
