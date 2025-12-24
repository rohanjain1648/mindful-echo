import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VoiceOrb } from "@/components/VoiceOrb";
import { Brain, ArrowRight, Shield, AlertTriangle, CheckCircle2, Loader2, MessageSquare, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAssessment } from "@/hooks/useAssessment";
import { Textarea } from "@/components/ui/textarea";

const AssessmentPage = () => {
  const [textInput, setTextInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    currentQuestion,
    currentQuestionIndex,
    isLoading,
    isProcessing,
    progress,
    fetchQuestions,
    processResponse,
    goToNextQuestion,
    skipQuestion,
    generateReport,
    conversationHistory,
    questions,
  } = useAssessment();

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const isComplete = currentQuestionIndex >= questions.length && questions.length > 0;

  const handleTextSubmit = async () => {
    if (!textInput.trim() || isProcessing) return;

    const response = await processResponse(textInput.trim());
    if (response) {
      setAiResponse(response.acknowledgment);
      setTextInput("");
      
      // Show AI response for a moment, then move to next question
      setTimeout(() => {
        setAiResponse(null);
        if (!response.isComplete) {
          goToNextQuestion();
        }
      }, 3000);
    }
  };

  const handleSkip = () => {
    skipQuestion();
    setAiResponse(null);
  };

  const handleViewReport = async () => {
    const report = await generateReport();
    if (report) {
      // Store report in session storage for the report page
      sessionStorage.setItem('assessmentReport', JSON.stringify(report));
      navigate("/report");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background gradient-calm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing your personalized assessment...</p>
        </div>
      </div>
    );
  }

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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Protected Session</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {!isComplete ? (
            <>
              {/* Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question Card */}
              <Card className="shadow-float mb-8">
                <CardContent className="p-8 text-center">
                  <p className="text-xl md:text-2xl font-display font-medium text-foreground leading-relaxed">
                    {currentQuestion?.text}
                  </p>
                  {currentQuestion?.followUp && (
                    <p className="text-sm text-muted-foreground mt-3 italic">
                      {currentQuestion.followUp}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* AI Response Display */}
              {aiResponse && (
                <Card className="shadow-soft mb-6 border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center shrink-0">
                        <Brain className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-foreground leading-relaxed">{aiResponse}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Moving to next question...
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Response Interface */}
              <div className="flex flex-col items-center">
                {!showTextInput ? (
                  <>
                    <VoiceOrb
                      isListening={false}
                      isSpeaking={isProcessing}
                      onStart={() => setShowTextInput(true)}
                      onStop={() => {}}
                      size="lg"
                    />
                    <p className="text-muted-foreground text-sm mt-4">
                      Click to respond with text
                    </p>
                    <Button
                      variant="ghost"
                      className="mt-4"
                      onClick={() => setShowTextInput(true)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Type your response instead
                    </Button>
                  </>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Share your thoughts here... Take your time, there's no rush."
                        className="min-h-[120px] pr-12 resize-none"
                        disabled={isProcessing}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute bottom-2 right-2"
                        onClick={handleTextSubmit}
                        disabled={!textInput.trim() || isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Press Enter to send, or Shift+Enter for a new line
                    </p>
                  </div>
                )}

                {/* Skip option */}
                <Button
                  variant="ghost"
                  className="mt-8"
                  onClick={handleSkip}
                  disabled={isProcessing}
                >
                  Skip this question
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Conversation History Preview */}
              {conversationHistory.length > 0 && (
                <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">
                    Questions answered: {conversationHistory.length}
                  </p>
                  <div className="flex gap-1">
                    {conversationHistory.map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full bg-primary/60"
                      />
                    ))}
                    {Array.from({ length: questions.length - conversationHistory.length }).map((_, i) => (
                      <div
                        key={`remaining-${i}`}
                        className="h-1.5 flex-1 rounded-full bg-muted"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Completion State */
            <Card className="shadow-float text-center">
              <CardContent className="p-12">
                <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
                </div>

                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Assessment Complete!
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                  Thank you for sharing your experiences. Your detailed wellness report 
                  is being generated with personalized insights and recommendations.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    variant="hero" 
                    size="xl" 
                    onClick={handleViewReport}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        View Your Report
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Your responses are being analyzed using AI-powered sentiment analysis 
                    and evidence-based ADHD pattern recognition.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Safety notice */}
          <div className="mt-8 p-4 rounded-xl bg-warm/10 border border-warm/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warm shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Safety First:</strong> If you're experiencing thoughts of self-harm 
                or are in crisis, please contact a mental health professional or call your local emergency services immediately.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssessmentPage;
