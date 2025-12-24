import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VoiceOrb } from "@/components/VoiceOrb";
import { Brain, ArrowRight, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Sample assessment questions based on ADHD patterns from the PDF
const assessmentQuestions = [
  "How often do you find yourself interrupting others or finishing their sentences before they're done speaking?",
  "Can you describe a recent situation where you struggled to stay seated when you needed to?",
  "How would you rate your ability to focus on tasks that don't immediately interest you?",
  "Tell me about your experience with starting projects versus finishing them.",
  "How often do you feel restless or like you need to be constantly moving?",
  "Describe how you typically handle waiting in lines or for appointments.",
  "How would you describe your sleep patterns and quality?",
  "Tell me about a time when you made an impulsive decision you later regretted.",
  "How do you usually feel when faced with multiple deadlines at once?",
  "Describe your experience with keeping track of important items like keys or phone.",
  "How often do you find your mind wandering during conversations?",
  "Tell me about your emotional reactions when things don't go as planned.",
  "How would you describe your ability to prioritize tasks?",
  "Describe a situation where time seemed to slip away from you.",
  "How do you typically feel about routines and schedules?",
  "Tell me about your experience with following through on commitments.",
  "How would you describe your energy levels throughout the day?",
  "Describe how criticism or rejection affects you emotionally.",
  "How do you cope when you feel overwhelmed by responsibilities?",
  "What strategies have you tried for managing focus, and how effective were they?",
];

const AssessmentPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;

  const handleStartListening = () => {
    setIsListening(true);
    toast({
      title: "Listening...",
      description: "Speak your response. I'm here to listen.",
    });
    
    // Simulate voice recording (in production, this would use actual speech-to-text)
    setTimeout(() => {
      setIsListening(false);
      setIsSpeaking(true);
      
      // Simulate AI response
      setTimeout(() => {
        setIsSpeaking(false);
        handleNextQuestion();
      }, 2000);
    }, 5000);
  };

  const handleStopListening = () => {
    setIsListening(false);
    // Save the response (in production, this would be the transcribed text)
    setResponses([...responses, `Response to question ${currentQuestion + 1}`]);
    setIsSpeaking(true);
    
    setTimeout(() => {
      setIsSpeaking(false);
      handleNextQuestion();
    }, 2000);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleViewReport = () => {
    navigate("/report");
  };

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
                    Question {currentQuestion + 1} of {assessmentQuestions.length}
                  </span>
                  <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question Card */}
              <Card className="shadow-float mb-8">
                <CardContent className="p-8 text-center">
                  <p className="text-xl md:text-2xl font-display font-medium text-foreground leading-relaxed">
                    {assessmentQuestions[currentQuestion]}
                  </p>
                </CardContent>
              </Card>

              {/* Voice Interface */}
              <div className="flex flex-col items-center">
                <VoiceOrb
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  onStart={handleStartListening}
                  onStop={handleStopListening}
                  size="lg"
                />

                <div className="mt-12 text-center max-w-md">
                  <p className="text-muted-foreground text-sm">
                    {isListening
                      ? "I'm listening. Take your time to share your thoughts."
                      : isSpeaking
                      ? "Thank you for sharing. Let me acknowledge what you said..."
                      : "Tap the microphone to share your response verbally."}
                  </p>
                </div>

                {/* Skip option */}
                <Button
                  variant="ghost"
                  className="mt-8"
                  onClick={handleNextQuestion}
                >
                  Skip this question
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
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
                  is ready with personalized insights and recommendations.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button variant="hero" size="xl" onClick={handleViewReport}>
                    View Your Report
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Your responses are being analyzed for sentiment patterns and will be 
                    used to personalize your AI companion experience.
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
