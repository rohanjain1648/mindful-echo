import { Brain, Shield, Mic, MicOff, Volume2, ChevronDown, AlertTriangle, Loader2, FileText, RotateCcw, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { LiveTranscript } from "@/components/LiveTranscript";
import { useVoiceAssessment, ASSISTANT_VOICES } from "@/hooks/useVoiceAssessment";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const AssessmentPage = () => {
  const {
    status,
    languages,
    selectedLanguage,
    setSelectedLanguage,
    selectedVoice,
    setSelectedVoice,
    transcript,
    isAssistantSpeaking,
    isUserSpeaking,
    isComplete,
    speechRate,
    setSpeechRate,
    error,
    startSession,
    endSession,
    resetSession,
    generateReport,
    startListening,
  } = useVoiceAssessment();

  // Calculate current question number based on transcript
  const currentQuestion = useMemo(() => {
    const userMessages = transcript.filter(t => t.role === 'user').length;
    // Question number is user messages + 1 (since we start on Q1 after greeting)
    // Capped at 20
    return Math.min(userMessages + 1, 20);
  }, [transcript]);

  const progressPercentage = useMemo(() => {
    return (currentQuestion / 20) * 100;
  }, [currentQuestion]);

  // Session ended - show summary
  if (status === 'ended') {
    return (
      <div className="min-h-screen bg-background gradient-calm flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-float">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
              <MicOff className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Session Ended</h2>
              <p className="text-muted-foreground mt-2">
                {transcript.length > 0 
                  ? `You completed ${Math.floor(transcript.length / 2)} exchanges.`
                  : 'Your session was ended.'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {transcript.length > 0 && (
                <Button variant="hero" size="lg" onClick={generateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Report
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={resetSession}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Session
              </Button>
              <Link to="/">
                <Button variant="ghost" size="lg" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-session: Language & voice selection
  if (status === 'idle' || status === 'error') {
    return (
      <div className="min-h-screen bg-background gradient-calm flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto max-w-4xl flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Nutrail
              </span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Protected Session</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-xl shadow-float">
            <CardContent className="p-8 space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="w-24 h-24 rounded-full gradient-hero mx-auto flex items-center justify-center">
                  <Mic className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-foreground">
                    Voice Assessment
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Reflect on your focus with AI-powered conversation. I'll ask you 20 questions and you respond naturally by speaking.
                  </p>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" />
                  Language
                </label>
                <div className="relative">
                  <select
                    value={selectedLanguage?.code || 'en'}
                    onChange={(e) => {
                      const lang = languages.find(l => l.code === e.target.value);
                      if (lang) setSelectedLanguage(lang);
                    }}
                    className="w-full bg-muted border border-border text-foreground rounded-xl p-4 appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Voice Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" />
                  Assistant Voice
                </label>
                <div className="relative">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-muted border border-border text-foreground rounded-xl p-4 appearance-none cursor-pointer pr-10 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    {ASSISTANT_VOICES.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.label} ({voice.description})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Start Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={startSession}
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Voice Session
              </Button>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Safety notice */}
        <footer className="p-6">
          <div className="container mx-auto max-w-xl">
            <div className="p-4 rounded-xl bg-warm/10 border border-warm/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warm shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Safety First:</strong> If you're in crisis, please contact a mental health professional or call your local emergency services.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Connecting state
  if (status === 'connecting') {
    return (
      <div className="min-h-screen bg-background gradient-calm flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Connecting to your voice session...</p>
        </div>
      </div>
    );
  }

  // Active session or ended
  return (
    <div className="min-h-screen bg-background gradient-calm flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              Nutrail
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Speaking in </span>
              <span className="font-medium text-foreground">{selectedLanguage?.name || 'English'}</span>
            </div>
            <div className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium',
              isAssistantSpeaking ? 'bg-primary/20 text-primary' :
              isUserSpeaking ? 'bg-accent/20 text-accent-foreground' :
              'bg-muted text-muted-foreground'
            )}>
              {isAssistantSpeaking ? 'Assistant Speaking' : isUserSpeaking ? 'Listening...' : 'Ready'}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Question</span>
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                {currentQuestion} / 20
              </span>
            </div>
            <div className="flex-1 max-w-md">
              <Progress value={progressPercentage} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isComplete ? 'Complete!' : `${Math.round(progressPercentage)}% complete`}
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 container mx-auto max-w-6xl">
        {/* Left: Visualizer & Controls */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <VoiceVisualizer
            isActive={isAssistantSpeaking || isUserSpeaking}
            type={isAssistantSpeaking ? 'assistant' : isUserSpeaking ? 'user' : 'idle'}
            size="lg"
          />

          {/* Status Text */}
          <div className="text-center space-y-2">
            {isComplete ? (
              <>
                <p className="text-lg font-medium text-foreground">Assessment Complete!</p>
                <p className="text-sm text-muted-foreground">Would you like to view your detailed report?</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-foreground">
                  {isAssistantSpeaking ? 'Nutrail is speaking...' : 
                   isUserSpeaking ? 'Listening to you...' : 
                   'Speak when ready'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isAssistantSpeaking ? 'Wait for the question to complete' :
                   isUserSpeaking ? 'I can hear you' :
                   'Speak naturally to respond'}
                </p>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-4">
            {/* Speech Rate */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
              <span className="text-sm text-muted-foreground">Speed</span>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-24 accent-primary"
              />
              <span className="text-sm font-medium text-foreground w-10">{speechRate.toFixed(1)}x</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              {!isAssistantSpeaking && !isUserSpeaking && !isComplete && (
                <Button variant="outline" size="lg" onClick={startListening}>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Speaking
                </Button>
              )}
              {isComplete ? (
                <Button variant="hero" size="lg" onClick={generateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Report
                </Button>
              ) : (
                <Button variant="destructive" size="lg" onClick={endSession}>
                  <MicOff className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Transcript */}
        <div className="lg:w-96 flex flex-col">
          <Card className="flex-1 shadow-soft">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-medium text-foreground">Live Transcript</h3>
              <span className="text-xs text-muted-foreground">{transcript.length} messages</span>
            </div>
            <div className="h-[400px] lg:h-[calc(100vh-300px)]">
              <LiveTranscript transcript={transcript} />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AssessmentPage;
