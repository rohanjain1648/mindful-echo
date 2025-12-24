import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceOrb } from "@/components/VoiceOrb";
import { 
  Brain, 
  Settings, 
  History, 
  Sparkles, 
  MessageCircle, 
  BookOpen,
  Shield,
  ChevronRight,
  Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CompanionPage = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(
    "Hi! I'm your personal wellness companion. I remember our previous conversations and I'm here to help you navigate your day. What's on your mind?"
  );
  const [conversationHistory, setConversationHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    { role: "assistant", content: "Hi! I'm your personal wellness companion. I remember our previous conversations and I'm here to help you navigate your day. What's on your mind?" }
  ]);
  const { toast } = useToast();

  const quickActions = [
    { icon: <Sparkles className="w-5 h-5" />, label: "Focus Boost", description: "Get a quick exercise to improve focus" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Today's Strategy", description: "Personalized technique for today" },
    { icon: <MessageCircle className="w-5 h-5" />, label: "Vent Session", description: "I'm here to listen without judgment" },
    { icon: <History className="w-5 h-5" />, label: "Review Progress", description: "See what's been working for you" },
  ];

  const handleStartListening = () => {
    setIsListening(true);
    toast({
      title: "I'm listening...",
      description: "Take your time. I'm here for you.",
    });
  };

  const handleStopListening = () => {
    setIsListening(false);
    setIsSpeaking(true);
    
    // Simulate AI response
    const responses = [
      "I hear you. That sounds challenging. Let me suggest a technique that might help...",
      "Thank you for sharing that. Based on what you've told me before, I think we could try...",
      "I understand. Remember, you've overcome similar situations before. Let's work through this together.",
      "That's a great insight. I've noticed a pattern in what you're describing. Would you like to explore it?",
    ];
    
    const newResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setTimeout(() => {
      setCurrentMessage(newResponse);
      setConversationHistory([
        ...conversationHistory,
        { role: "user", content: "User's spoken response" },
        { role: "assistant", content: newResponse },
      ]);
      setIsSpeaking(false);
    }, 3000);
  };

  const handleQuickAction = (label: string) => {
    setIsSpeaking(true);
    const actionResponses: Record<string, string> = {
      "Focus Boost": "Let's try a quick body doubling session. I'll stay here while you work on one small task for 5 minutes. What would you like to focus on?",
      "Today's Strategy": "Based on your patterns, mornings seem to be your peak focus time. I recommend tackling your most challenging task in the next 2 hours. Would you like me to help you break it down?",
      "Vent Session": "I'm here to listen. There's no judgment here. Take your time and share whatever's on your mind. I'll listen and support you.",
      "Review Progress": "Looking at your recent sessions, I've noticed you've been making great progress with the Pomodoro technique. Your focus sessions have increased by 15% this week. Would you like more details?",
    };
    
    setTimeout(() => {
      setCurrentMessage(actionResponses[label]);
      setConversationHistory([
        ...conversationHistory,
        { role: "user", content: `Selected: ${label}` },
        { role: "assistant", content: actionResponses[label] },
      ]);
      setIsSpeaking(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background gradient-calm flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Nutrail
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon">
              <History className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col container mx-auto max-w-4xl p-6">
        {/* Companion Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Companion Active</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-1">
            Your Personal Companion
          </h1>
          <p className="text-muted-foreground text-sm">
            I remember our conversations and adapt to your needs
          </p>
        </div>

        {/* Current Message */}
        <Card className="shadow-card mb-8 flex-1 flex flex-col min-h-[200px]">
          <CardContent className="p-6 flex-1 flex items-center justify-center">
            <div className="text-center max-w-lg">
              <p className="text-lg text-foreground leading-relaxed">
                {currentMessage}
              </p>
              {isSpeaking && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-primary rounded-full animate-voice-wave"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Interface */}
        <div className="flex flex-col items-center mb-8">
          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
            onStart={handleStartListening}
            onStop={handleStopListening}
            size="lg"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.label)}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300 text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary mb-3 group-hover:gradient-hero group-hover:text-primary-foreground transition-all duration-300">
                {action.icon}
              </div>
              <p className="font-medium text-foreground text-sm mb-1">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </button>
          ))}
        </div>

        {/* Safety Notice */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            This companion uses Gemma Shield 2B guardrails. If you're in crisis, please contact emergency services.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CompanionPage;
