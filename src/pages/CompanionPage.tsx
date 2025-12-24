import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceOrb } from "@/components/VoiceOrb";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Settings, 
  History, 
  Sparkles, 
  MessageCircle, 
  Shield,
  Home,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Wind,
  Activity,
  Heart,
  Target,
  X,
  Mic,
  MicOff,
  Keyboard
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCompanion } from "@/hooks/useCompanion";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

const CompanionPage = () => {
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    memories,
    isLoading,
    isSpeaking,
    currentExercise,
    sendMessage,
    speakMessage,
    stopSpeaking,
    getExercise,
    clearExercise,
  } = useCompanion();

  // Voice recorder with transcript callback
  const handleTranscript = useCallback(async (text: string) => {
    if (text.trim()) {
      await sendMessage(text);
    }
  }, [sendMessage]);

  const { 
    isRecording, 
    isTranscribing, 
    toggleRecording 
  } = useVoiceRecorder({
    onTranscript: handleTranscript,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.id !== 'welcome') {
        speakMessage(lastMessage.content, lastMessage.emotion);
      }
    }
  }, [messages, autoSpeak, speakMessage]);

  const quickActions = [
    { 
      icon: <Wind className="w-5 h-5" />, 
      label: "Breathing", 
      description: "Calm your mind",
      action: () => getExercise('breathing')
    },
    { 
      icon: <Activity className="w-5 h-5" />, 
      label: "Movement", 
      description: "Reset your energy",
      action: () => getExercise('movement')
    },
    { 
      icon: <Target className="w-5 h-5" />, 
      label: "Focus", 
      description: "Task anchoring",
      action: () => getExercise('cognitive')
    },
    { 
      icon: <Heart className="w-5 h-5" />, 
      label: "Grounding", 
      description: "5-4-3-2-1 exercise",
      action: () => getExercise('grounding')
    },
  ];

  const handleSendMessage = async () => {
    if (!textInput.trim() || isLoading) return;
    const message = textInput.trim();
    setTextInput("");
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = async (label: string, action: () => void) => {
    action();
    await sendMessage(`I'd like to try a ${label.toLowerCase()} exercise`);
  };

  const isProcessing = isLoading || isTranscribing;

  return (
    <div className="min-h-screen bg-background gradient-calm flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setAutoSpeak(!autoSpeak)}
              title={autoSpeak ? "Mute voice" : "Enable voice"}
            >
              {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
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
      <main className="flex-1 flex flex-col container mx-auto max-w-4xl p-4 md:p-6">
        {/* Companion Status */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-destructive' : 'bg-primary'} animate-pulse`} />
            <span className="text-sm font-medium text-primary">
              {isRecording ? 'Listening...' : isTranscribing ? 'Transcribing...' : isSpeaking ? 'Speaking...' : isLoading ? 'Thinking...' : 'Companion Active'}
            </span>
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-1">
            Your Personal Companion
          </h1>
          {memories.length > 0 && (
            <p className="text-muted-foreground text-xs">
              I remember {memories.length} things about you
            </p>
          )}
        </div>

        {/* Grounding Exercise Modal */}
        {currentExercise && (
          <Card className="shadow-float mb-4 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
                    {currentExercise.category === 'breathing' && <Wind className="w-5 h-5 text-primary-foreground" />}
                    {currentExercise.category === 'movement' && <Activity className="w-5 h-5 text-primary-foreground" />}
                    {currentExercise.category === 'cognitive' && <Target className="w-5 h-5 text-primary-foreground" />}
                    {currentExercise.category === 'grounding' && <Sparkles className="w-5 h-5 text-primary-foreground" />}
                    {currentExercise.category === 'sensory' && <Heart className="w-5 h-5 text-primary-foreground" />}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{currentExercise.name}</h3>
                    <p className="text-xs text-muted-foreground">{currentExercise.duration_minutes} minutes</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearExercise}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ol className="space-y-3">
                {currentExercise.instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <Button 
                variant="warm" 
                className="w-full mt-4"
                onClick={() => {
                  if (currentExercise) {
                    speakMessage(currentExercise.instructions.steps.join('. '), 'calm');
                  }
                }}
                disabled={isSpeaking}
              >
                {isSpeaking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Reading aloud...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Read Exercise Aloud
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Conversation Area */}
        <Card className="shadow-card mb-4 flex-1 flex flex-col min-h-[300px] max-h-[400px]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => speakMessage(message.content, message.emotion)}
                          disabled={isSpeaking}
                        >
                          <Volume2 className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(isLoading || isTranscribing) && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {isTranscribing ? 'Transcribing your voice...' : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </Card>

        {/* Input Interface */}
        <div className="flex flex-col items-center mb-4">
          {inputMode === 'voice' ? (
            <>
              {/* Voice Input Mode */}
              <div className="relative">
                <VoiceOrb
                  isListening={isRecording}
                  isSpeaking={isSpeaking || isTranscribing}
                  onStart={toggleRecording}
                  onStop={toggleRecording}
                  size="lg"
                />
                {isRecording && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs text-destructive font-medium animate-pulse">
                      Tap to stop recording
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-8">
                <p className="text-muted-foreground text-sm">
                  {isRecording 
                    ? 'Listening... Tap when done' 
                    : isTranscribing 
                    ? 'Processing your voice...'
                    : 'Tap to speak'}
                </p>
              </div>

              <Button
                variant="ghost"
                className="mt-4 text-xs"
                onClick={() => setInputMode('text')}
                disabled={isRecording || isTranscribing}
              >
                <Keyboard className="w-3 h-3 mr-1" />
                Type instead
              </Button>
            </>
          ) : (
            <>
              {/* Text Input Mode */}
              <div className="w-full">
                <div className="relative">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Share what's on your mind..."
                    className="min-h-[80px] pr-24 resize-none"
                    disabled={isProcessing}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setInputMode('voice')}
                      disabled={isProcessing}
                      title="Switch to voice"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSendMessage}
                      disabled={!textInput.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Press Enter to send • Click <Mic className="w-3 h-3 inline" /> for voice
                </p>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.label, action.action)}
              disabled={isProcessing || isRecording}
              className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-soft transition-all duration-300 text-center group disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary mx-auto mb-2 group-hover:gradient-hero group-hover:text-primary-foreground transition-all duration-300">
                {action.icon}
              </div>
              <p className="font-medium text-foreground text-xs">{action.label}</p>
            </button>
          ))}
        </div>

        {/* Safety Notice */}
        <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-3">
          <Shield className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            Safety guardrails active. If you're in crisis, please contact emergency services.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CompanionPage;
