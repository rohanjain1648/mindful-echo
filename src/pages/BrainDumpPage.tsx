import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Lightbulb, Volume2, VolumeX, SkipForward, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useExercise } from '@/hooks/useExercise';
import { getExerciseById } from '@/data/exerciseLibrary';

interface ThoughtDump {
  id: string;
  text: string;
  category: 'thought' | 'worry' | 'emotion' | 'todo';
}

export default function BrainDumpPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [thoughts, setThoughts] = useState<ThoughtDump[]>([]);
  const [currentInput, setCurrentInput] = useState('');
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

  const exercise = getExerciseById('brain-dump');

  const handleStart = async () => {
    if (exercise) {
      setHasStarted(true);
      setThoughts([]);
      await startExercise(exercise);
    }
  };

  const handleStop = () => {
    stopExercise();
    setHasStarted(false);
  };

  const handleAddThought = () => {
    if (currentInput.trim()) {
      // Determine category based on current step
      let category: ThoughtDump['category'] = 'thought';
      if (currentStep >= 4 && currentStep <= 5) category = 'worry';
      else if (currentStep >= 6 && currentStep <= 7) category = 'emotion';
      else if (currentStep >= 8) category = 'todo';

      setThoughts([
        ...thoughts,
        { id: Date.now().toString(), text: currentInput.trim(), category }
      ]);
      setCurrentInput('');
    }
  };

  const removeThought = (id: string) => {
    setThoughts(thoughts.filter(t => t.id !== id));
  };

  const getCategoryColor = (category: ThoughtDump['category']) => {
    switch (category) {
      case 'thought': return 'bg-purple-500/20 border-purple-500/30 text-purple-300';
      case 'worry': return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
      case 'emotion': return 'bg-pink-500/20 border-pink-500/30 text-pink-300';
      case 'todo': return 'bg-green-500/20 border-green-500/30 text-green-300';
    }
  };

  const getCategoryLabel = (category: ThoughtDump['category']) => {
    switch (category) {
      case 'thought': return '💭 Thought';
      case 'worry': return '😟 Worry';
      case 'emotion': return '❤️ Emotion';
      case 'todo': return '✅ Priority';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-500/5">
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  Brain Dump
                </h1>
                <p className="text-xs text-muted-foreground">Clear Mental Clutter</p>
              </div>
            </div>
            <Lightbulb className="h-6 w-6 text-purple-500" />
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
                    <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                      <Lightbulb className="h-10 w-10 text-purple-500" />
                    </div>
                    <CardTitle className="text-2xl">Brain Dump</CardTitle>
                    <CardDescription className="text-base max-w-md mx-auto">
                      Release the mental clutter. Get everything out of your head 
                      and onto the page—no judgment, no organization required.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: '💭', label: 'Thoughts', desc: 'What\'s on your mind' },
                        { icon: '😟', label: 'Worries', desc: 'Anxieties & concerns' },
                        { icon: '❤️', label: 'Emotions', desc: 'How you\'re feeling' },
                        { icon: '✅', label: 'Priorities', desc: 'What needs attention' },
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded-lg bg-secondary/30 text-center">
                          <div className="text-2xl mb-1">{item.icon}</div>
                          <div className="text-sm font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center">
                      <Button size="lg" onClick={handleStart} className="px-8 bg-purple-600 hover:bg-purple-700">
                        <Play className="h-5 w-5 mr-2" />
                        Start Brain Dump
                      </Button>
                    </div>
                    
                    <p className="text-center text-sm text-muted-foreground">
                      Duration: ~10 minutes
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
                    <CardDescription>Let it all out</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Thought Visualization */}
                    {thoughts.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg bg-secondary/20">
                        {thoughts.map((thought) => (
                          <motion.div
                            key={thought.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-start gap-2 p-2 rounded-lg border ${getCategoryColor(thought.category)}`}
                          >
                            <span className="text-xs shrink-0">{getCategoryLabel(thought.category)}</span>
                            <span className="flex-1 text-sm text-foreground/90">{thought.text}</span>
                            <button 
                              onClick={() => removeThought(thought.id)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Brain icon animation */}
                    <div className="flex justify-center py-4">
                      <motion.div
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-2 border-purple-500/30 flex items-center justify-center"
                        animate={{
                          scale: isPlaying ? [1, 1.05, 1] : 1,
                        }}
                        transition={{
                          duration: 3,
                          repeat: isPlaying ? Infinity : 0,
                        }}
                      >
                        <Lightbulb className="h-10 w-10 text-purple-500" />
                      </motion.div>
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

                    {/* Input area */}
                    {currentPrompt && status === 'playing' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-muted-foreground text-center">{currentPrompt}</p>
                        <Textarea
                          value={currentInput}
                          onChange={(e) => setCurrentInput(e.target.value)}
                          placeholder="Type freely... no judgment here"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setCurrentInput('')}>
                            Clear
                          </Button>
                          <Button onClick={handleAddThought} disabled={!currentInput.trim()}>
                            Add & Continue
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
                        <p className="text-lg text-purple-500 font-medium">
                          🧠 Your mind is clearer now.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          You captured {thoughts.length} thoughts. Review them and pick one to address today.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setHasStarted(false)}
                        >
                          Start Fresh
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
