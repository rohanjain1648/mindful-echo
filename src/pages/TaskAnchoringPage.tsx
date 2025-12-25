import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Target, Volume2, VolumeX, SkipForward, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useExercise } from '@/hooks/useExercise';
import { getExerciseById } from '@/data/exerciseLibrary';
import { useExerciseTracker } from '@/hooks/useExerciseTracker';

interface TaskStep {
  text: string;
  completed: boolean;
}

export default function TaskAnchoringPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [taskSteps, setTaskSteps] = useState<TaskStep[]>([]);
  const [currentInput, setCurrentInput] = useState('');
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

  const exercise = getExerciseById('task-anchoring');

  // Record completion when exercise finishes
  useEffect(() => {
    if (status === 'complete' && !hasRecordedRef.current && startTimeRef.current) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      recordCompletion('task-anchoring', durationSeconds);
      hasRecordedRef.current = true;
    }
  }, [status, recordCompletion]);

  const handleStart = async () => {
    if (exercise) {
      setHasStarted(true);
      setTaskSteps([]);
      startTimeRef.current = Date.now();
      hasRecordedRef.current = false;
      await startExercise(exercise);
    }
  };

  const handleStop = () => {
    stopExercise();
    setHasStarted(false);
  };

  const handleAddStep = () => {
    if (currentInput.trim()) {
      setTaskSteps([...taskSteps, { text: currentInput.trim(), completed: false }]);
      setCurrentInput('');
      nextStep();
    }
  };

  const toggleStepComplete = (index: number) => {
    setTaskSteps(taskSteps.map((step, i) => 
      i === index ? { ...step, completed: !step.completed } : step
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  Task Anchoring
                </h1>
                <p className="text-xs text-muted-foreground">Break Down Overwhelm</p>
              </div>
            </div>
            <Target className="h-6 w-6 text-orange-500" />
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
                    <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                      <Target className="h-10 w-10 text-orange-500" />
                    </div>
                    <CardTitle className="text-2xl">Task Anchoring</CardTitle>
                    <CardDescription className="text-base max-w-md mx-auto">
                      Transform overwhelming tasks into small, dopamine-boosting micro-steps 
                      that make progress feel achievable.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-secondary/30">
                      <h4 className="font-medium mb-2">How it works:</h4>
                      <ol className="text-sm text-muted-foreground space-y-2">
                        <li>1. Identify one overwhelming task</li>
                        <li>2. Break it into 3 tiny first steps</li>
                        <li>3. Each completed step = dopamine reward</li>
                        <li>4. Start with just 5 minutes</li>
                      </ol>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button size="lg" onClick={handleStart} className="px-8 bg-orange-600 hover:bg-orange-700">
                        <Play className="h-5 w-5 mr-2" />
                        Start Anchoring
                      </Button>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      Duration: ~5 minutes
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
                    <CardDescription>Make it manageable</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Task Steps Visualization */}
                    <div className="py-4">
                      {taskSteps.length > 0 && (
                        <div className="space-y-3 mb-6">
                          <h4 className="text-sm font-medium text-muted-foreground">Your Micro-Steps:</h4>
                          {taskSteps.map((step, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                step.completed 
                                  ? 'bg-green-500/20 border border-green-500/30' 
                                  : 'bg-secondary/50 border border-border'
                              }`}
                              onClick={() => toggleStepComplete(index)}
                            >
                              {step.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                              <span className={step.completed ? 'line-through text-muted-foreground' : ''}>
                                {step.text}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Target icon animation */}
                      <div className="flex justify-center">
                        <motion.div
                          className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-2 border-orange-500/30 flex items-center justify-center"
                          animate={{
                            scale: isPlaying ? [1, 1.1, 1] : 1,
                          }}
                          transition={{
                            duration: 2,
                            repeat: isPlaying ? Infinity : 0,
                          }}
                        >
                          <Target className="h-10 w-10 text-orange-500" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Current Instruction */}
                    <div className="min-h-[60px] flex items-center justify-center">
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

                    {/* Input for steps */}
                    {currentPrompt && status === 'playing' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-muted-foreground text-center">{currentPrompt}</p>
                        <div className="flex gap-2">
                          <Input
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            placeholder="Type your answer..."
                            onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                          />
                          <Button onClick={handleAddStep} disabled={!currentInput.trim()}>
                            Add
                          </Button>
                        </div>
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
                        <p className="text-lg text-orange-500 font-medium">
                          🎯 Your task is anchored! Now take action.
                        </p>
                        {taskSteps.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Click the steps above to mark them complete as you go!
                          </p>
                        )}
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setHasStarted(false)}
                        >
                          Anchor Another Task
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
