import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, Square, Volume2, VolumeX, Heart, Brain, Eye, Wind, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useMeditation } from '@/hooks/useMeditation';
import { MEDITATION_LIBRARY, MeditationScript } from '@/data/meditationLibrary';
import { useExerciseTracker } from '@/hooks/useExerciseTracker';

const typeIcons = {
  mindfulness: Brain,
  'loving-kindness': Heart,
  visualization: Eye,
  'body-scan': Sparkles,
  breathing: Wind,
};

const typeColors = {
  mindfulness: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'loving-kindness': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  visualization: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'body-scan': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  breathing: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const ambientLabels = {
  nature: '🌿 Forest',
  ocean: '🌊 Ocean',
  rain: '🌧️ Rain',
  silence: '🔇 Silence',
  om: '🕉️ OM Chanting',
};

export default function MeditationPage() {
  const [selectedMeditation, setSelectedMeditation] = useState<MeditationScript | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasRecordedRef = useRef(false);
  const {
    status,
    currentStep,
    totalSteps,
    currentInstruction,
    progress,
    isPlaying,
    startMeditation,
    pauseMeditation,
    resumeMeditation,
    stopMeditation,
    ambientVolume,
    setAmbientVolume,
  } = useMeditation();
  const { recordCompletion } = useExerciseTracker();

  // Record completion when meditation finishes
  useEffect(() => {
    if (status === 'complete' && !hasRecordedRef.current && startTimeRef.current && selectedMeditation) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      recordCompletion(`meditation-${selectedMeditation.id}`, durationSeconds);
      hasRecordedRef.current = true;
    }
  }, [status, recordCompletion, selectedMeditation]);

  const handleStartMeditation = async (meditation: MeditationScript) => {
    setSelectedMeditation(meditation);
    startTimeRef.current = Date.now();
    hasRecordedRef.current = false;
    await startMeditation(meditation);
  };

  const handleStop = () => {
    stopMeditation();
    setSelectedMeditation(null);
  };

  const meditationTypes = ['mindfulness', 'loving-kindness', 'visualization', 'body-scan', 'breathing'] as const;

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
                  Guided Meditation
                </h1>
                <p className="text-xs text-muted-foreground">Find your inner peace</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-8">
        <AnimatePresence mode="wait">
          {/* Active Meditation Session */}
          {selectedMeditation && status !== 'idle' && (
            <motion.div
              key="active-session"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <Badge className={typeColors[selectedMeditation.type]}>
                    {selectedMeditation.type.replace('-', ' ')}
                  </Badge>
                  <CardTitle className="text-2xl mt-3">{selectedMeditation.title}</CardTitle>
                  <CardDescription>
                    {ambientLabels[selectedMeditation.ambientSound]}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Visual Breathing Guide */}
                  <div className="flex justify-center py-8">
                    <motion.div
                      className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 flex items-center justify-center"
                      animate={{
                        scale: isPlaying ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 4,
                        repeat: isPlaying ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                    >
                      <motion.div
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/50 to-primary/20"
                        animate={{
                          scale: isPlaying ? [1, 1.15, 1] : 1,
                        }}
                        transition={{
                          duration: 4,
                          repeat: isPlaying ? Infinity : 0,
                          ease: 'easeInOut',
                          delay: 0.2,
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Current Instruction */}
                  <div className="min-h-[100px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentInstruction}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-lg text-center text-foreground/90 italic px-4"
                      >
                        "{currentInstruction || 'Preparing your meditation...'}"
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Step {currentStep} of {totalSteps}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
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
                  <div className="flex justify-center gap-4">
                    {status === 'playing' ? (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={pauseMeditation}
                        className="w-32"
                      >
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                    ) : status === 'paused' ? (
                      <Button
                        size="lg"
                        onClick={resumeMeditation}
                        className="w-32"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Resume
                      </Button>
                    ) : status === 'loading' ? (
                      <Button size="lg" disabled className="w-32">
                        Loading...
                      </Button>
                    ) : null}

                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={handleStop}
                      className="w-32"
                    >
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
                        🙏 Namaste. Your meditation is complete.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSelectedMeditation(null)}
                      >
                        Choose Another Meditation
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Meditation Selection */}
          {(!selectedMeditation || status === 'idle') && (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Choose Your Meditation</h2>
                <p className="text-muted-foreground">
                  Select a guided meditation session to begin your journey to inner peace
                </p>
              </div>

              <Tabs defaultValue="mindfulness" className="w-full">
                <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-transparent mb-6">
                  {meditationTypes.map((type) => {
                    const Icon = typeIcons[type];
                    return (
                      <TabsTrigger
                        key={type}
                        value={type}
                        className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{type.replace('-', ' ')}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {meditationTypes.map((type) => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <div className="grid gap-4 md:grid-cols-2">
                      {MEDITATION_LIBRARY.filter((m) => m.type === type).map((meditation) => {
                        const Icon = typeIcons[meditation.type];
                        return (
                          <motion.div
                            key={meditation.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card
                              className="cursor-pointer hover:border-primary/50 transition-all h-full"
                              onClick={() => handleStartMeditation(meditation)}
                            >
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <Badge className={typeColors[meditation.type]}>
                                    <Icon className="h-3 w-3 mr-1" />
                                    {meditation.type.replace('-', ' ')}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {meditation.duration} min
                                  </span>
                                </div>
                                <CardTitle className="text-lg mt-2">
                                  {meditation.title}
                                </CardTitle>
                                <CardDescription>
                                  {meditation.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    {ambientLabels[meditation.ambientSound]}
                                  </span>
                                  <Button size="sm" variant="ghost">
                                    <Play className="h-4 w-4 mr-1" />
                                    Start
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
