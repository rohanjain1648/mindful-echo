import { useState, useCallback, useRef, useEffect } from 'react';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export type SessionStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  voiceId: string;
}

export interface TranscriptItem {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface VoiceConfig {
  id: string;
  label: string;
  description: string;
}

export const ASSISTANT_VOICES: VoiceConfig[] = [
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah', description: 'Warm & Supportive' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', label: 'Laura', description: 'Gentle & Calm' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', label: 'Liam', description: 'Encouraging' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'George', description: 'Professional' },
];

export const useVoiceAssessment = () => {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(ASSISTANT_VOICES[0].id);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<Array<{ role: string; content: string }>>([]);
  const sessionIdRef = useRef(crypto.randomUUID());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isProcessingRef = useRef(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch available languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-assessment`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ action: 'get_languages' }),
          }
        );
        const data = await response.json();
        setLanguages(data.languages || []);
        if (data.languages?.length > 0) {
          setSelectedLanguage(data.languages[0]);
        }
      } catch (err) {
        console.error('Failed to fetch languages:', err);
      }
    };
    fetchLanguages();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      stopListening();
    };
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsAssistantSpeaking(false);
  }, []);

  const playAudio = useCallback(async (base64Audio: string) => {
    stopAudio();
    
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
    const audio = new Audio(audioUrl);
    audio.playbackRate = speechRate;
    audioRef.current = audio;

    setIsAssistantSpeaking(true);

    audio.onended = () => {
      setIsAssistantSpeaking(false);
      // Start listening after assistant finishes
      if (status === 'active' && !isComplete) {
        startListening();
      }
    };

    audio.onerror = () => {
      setIsAssistantSpeaking(false);
      console.error('Audio playback error');
    };

    try {
      await audio.play();
    } catch (err) {
      console.error('Failed to play audio:', err);
      setIsAssistantSpeaking(false);
    }
  }, [speechRate, status, isComplete]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsUserSpeaking(false);
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    if (isProcessingRef.current || !userText.trim()) return;
    
    isProcessingRef.current = true;
    
    // Add user message to transcript
    setTranscript(prev => [...prev, { 
      role: 'user', 
      text: userText, 
      timestamp: Date.now() 
    }]);

    // Add to messages for API
    messagesRef.current.push({ role: 'user', content: userText });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'chat',
            language: selectedLanguage?.code || 'en',
            messages: messagesRef.current,
            sessionId: sessionIdRef.current,
            voiceId: selectedVoice,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: 'Please wait',
            description: 'Rate limit reached. Please wait a moment.',
            variant: 'destructive',
          });
        }
        throw new Error('Failed to process message');
      }

      const data = await response.json();

      // Add assistant message to transcript
      setTranscript(prev => [...prev, { 
        role: 'assistant', 
        text: data.text, 
        timestamp: Date.now() 
      }]);

      // Add to messages for API
      messagesRef.current.push({ role: 'assistant', content: data.text });

      // Check if complete
      if (data.isComplete) {
        setIsComplete(true);
      }

      // Play audio response
      if (data.audioContent) {
        await playAudio(data.audioContent);
      }

    } catch (err) {
      console.error('Send message error:', err);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      isProcessingRef.current = false;
    }
  }, [selectedLanguage, selectedVoice, playAudio, toast]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    stopListening();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage?.code === 'en' ? 'en-US' : 
                       selectedLanguage?.code === 'hi' ? 'hi-IN' :
                       selectedLanguage?.code === 'ta' ? 'ta-IN' :
                       selectedLanguage?.code === 'te' ? 'te-IN' :
                       selectedLanguage?.code === 'kn' ? 'kn-IN' :
                       selectedLanguage?.code === 'bn' ? 'bn-IN' :
                       selectedLanguage?.code === 'mr' ? 'mr-IN' :
                       selectedLanguage?.code === 'gu' ? 'gu-IN' :
                       selectedLanguage?.code === 'ml' ? 'ml-IN' :
                       selectedLanguage?.code === 'pa' ? 'pa-IN' : 'en-US';

    let finalTranscript = '';
    let silenceTimeout: NodeJS.Timeout;

    recognition.onstart = () => {
      setIsUserSpeaking(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      // Reset silence timeout
      clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(() => {
        if (finalTranscript.trim()) {
          stopListening();
          sendMessage(finalTranscript.trim());
          finalTranscript = '';
        }
      }, 2000); // 2 seconds of silence
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsUserSpeaking(false);
      }
    };

    recognition.onend = () => {
      setIsUserSpeaking(false);
      if (finalTranscript.trim()) {
        sendMessage(finalTranscript.trim());
        finalTranscript = '';
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [selectedLanguage, stopListening, sendMessage, toast]);

  const startSession = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);
    messagesRef.current = [];
    sessionIdRef.current = crypto.randomUUID();
    setIsComplete(false);

    try {
      // Get initial greeting from AI
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'chat',
            language: selectedLanguage?.code || 'en',
            messages: [{ role: 'user', content: 'Start the assessment' }],
            sessionId: sessionIdRef.current,
            voiceId: selectedVoice,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();

      // Add greeting to transcript and messages
      setTranscript([{ 
        role: 'assistant', 
        text: data.text, 
        timestamp: Date.now() 
      }]);
      messagesRef.current.push({ role: 'assistant', content: data.text });

      setStatus('active');

      // Play greeting audio
      if (data.audioContent) {
        await playAudio(data.audioContent);
      }

    } catch (err) {
      console.error('Start session error:', err);
      setError('Failed to start session. Please try again.');
      setStatus('error');
    }
  }, [selectedLanguage, selectedVoice, playAudio]);

  const endSession = useCallback(() => {
    stopAudio();
    stopListening();
    setStatus('ended');
  }, [stopAudio, stopListening]);

  const generateReport = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'generate_report',
            messages: messagesRef.current,
            sessionId: sessionIdRef.current,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const report = await response.json();
      sessionStorage.setItem('assessmentReport', JSON.stringify(report));
      navigate('/report');
      
    } catch (err) {
      console.error('Generate report error:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    }
  }, [navigate, toast]);

  return {
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
    stopAudio,
    startListening,
    stopListening,
    generateReport,
  };
};
