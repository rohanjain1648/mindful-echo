import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: Date;
}

interface Memory {
  id: string;
  memory_type: string;
  content: string;
  importance_score: number;
  emotional_context?: string;
}

interface GroundingExercise {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  instructions: { steps: string[] };
  audio_cues: string[];
}

interface CompanionResponse {
  response: string;
  emotion: string;
  detected_user_emotion: string;
  should_save_memory: boolean;
  suggest_exercise: boolean;
  suggested_exercise_category?: string;
}

export const useCompanion = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [exercises, setExercises] = useState<GroundingExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentExercise, setCurrentExercise] = useState<GroundingExercise | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Fetch initial data (memories, exercises)
  const fetchInitialData = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/companion-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'get_memories' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMemories(data.memories || []);
        setExercises(data.exercises || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, []);

  // Send message and get AI response
  const sendMessage = useCallback(async (content: string): Promise<CompanionResponse | null> => {
    if (!content.trim()) return null;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/companion-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'chat',
            sessionId,
            message: content.trim(),
            conversationHistory: messages.slice(-10).map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: 'Please wait',
            description: 'Rate limit reached. Try again in a moment.',
            variant: 'destructive',
          });
          return null;
        }
        throw new Error('Failed to get response');
      }

      const data: CompanionResponse = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        emotion: data.emotion,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If exercise suggested, find and set it
      if (data.suggest_exercise && data.suggested_exercise_category) {
        const exercise = exercises.find(e => e.category === data.suggested_exercise_category);
        if (exercise) {
          setCurrentExercise(exercise);
        }
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, exercises, toast]);

  // Generate TTS audio for a message
  const speakMessage = useCallback(async (text: string, emotion?: string) => {
    setIsSpeaking(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/companion-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ text, emotion }),
        }
      );

      if (!response.ok) {
        throw new Error('TTS failed');
      }

      const data = await response.json();
      
      if (data.audioContent) {
        // Use data URI for proper decoding
        const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
        };
        
        audio.onerror = () => {
          console.error('Audio playback error');
          setIsSpeaking(false);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      toast({
        title: 'Voice unavailable',
        description: 'Could not play audio response.',
      });
    }
  }, [toast]);

  // Stop current audio
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  // Get a grounding exercise
  const getExercise = useCallback((category?: string) => {
    if (category) {
      const exercise = exercises.find(e => e.category === category);
      setCurrentExercise(exercise || null);
      return exercise;
    }
    // Get random exercise
    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
    setCurrentExercise(randomExercise || null);
    return randomExercise;
  }, [exercises]);

  // Clear current exercise
  const clearExercise = useCallback(() => {
    setCurrentExercise(null);
  }, []);

  // Initialize session
  useEffect(() => {
    fetchInitialData();
    
    // Create session record
    supabase.from('companion_sessions').insert({
      session_id: sessionId,
      started_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error('Failed to create session:', error);
    });

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi there! I'm your mental wellness companion. I'm here to listen, support you, and help you navigate your day. How are you feeling right now?",
      emotion: 'warm',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [fetchInitialData, sessionId]);

  return {
    messages,
    memories,
    exercises,
    isLoading,
    isSpeaking,
    sessionId,
    currentExercise,
    sendMessage,
    speakMessage,
    stopSpeaking,
    getExercise,
    clearExercise,
  };
};
