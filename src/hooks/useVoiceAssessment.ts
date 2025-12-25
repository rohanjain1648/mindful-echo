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
  googleVoice: string; // Google TTS voice name
}

export const ASSISTANT_VOICES: VoiceConfig[] = [
  { id: 'sarah', label: 'Sarah', description: 'Warm & Supportive', googleVoice: 'en-US-Neural2-F' },
  { id: 'laura', label: 'Laura', description: 'Gentle & Calm', googleVoice: 'en-US-Neural2-C' },
  { id: 'liam', label: 'Liam', description: 'Encouraging', googleVoice: 'en-US-Neural2-D' },
  { id: 'george', label: 'George', description: 'Professional', googleVoice: 'en-US-Neural2-J' },
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
  const isCompleteRef = useRef(false);
  const startListeningRef = useRef<(() => void) | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Browser TTS fallback when ElevenLabs is unavailable
  const speakWithBrowserTTS = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.log('[VoiceAssessment] Browser TTS not supported');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                          voices.find(v => v.lang.startsWith('en')) ||
                          voices[0];
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }, [speechRate]);

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

  const playAudio = useCallback(async (base64Audio: string, shouldListenAfter: boolean = true) => {
    stopAudio();
    
    console.log('[VoiceAssessment] Playing audio, will listen after:', shouldListenAfter);
    
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
    const audio = new Audio(audioUrl);
    audio.playbackRate = speechRate;
    audioRef.current = audio;

    setIsAssistantSpeaking(true);

    return new Promise<void>((resolve) => {
      audio.onended = () => {
        console.log('[VoiceAssessment] Audio ended, shouldListenAfter:', shouldListenAfter);
        setIsAssistantSpeaking(false);
        resolve();
      };

      audio.onerror = (e) => {
        console.error('[VoiceAssessment] Audio playback error:', e);
        setIsAssistantSpeaking(false);
        resolve();
      };

      audio.play().catch((err) => {
        console.error('[VoiceAssessment] Failed to play audio:', err);
        setIsAssistantSpeaking(false);
        resolve();
      });
    });
  }, [speechRate, stopAudio]);

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
        isCompleteRef.current = true;
      }

      // Play audio response if available, or use browser TTS as fallback
      if (data.audioContent) {
        await playAudio(data.audioContent);
      } else if (data.text) {
        // Fallback to browser speech synthesis when ElevenLabs TTS fails
        console.log('[VoiceAssessment] Using browser TTS fallback');
        setIsAssistantSpeaking(true);
        await speakWithBrowserTTS(data.text);
        setIsAssistantSpeaking(false);
      }
      
      // Start listening after response (if not complete)
      if (!data.isComplete) {
        console.log('[VoiceAssessment] Response received, starting to listen...');
        // Small delay to ensure audio finished
        setTimeout(() => {
          startListeningRef.current?.();
        }, data.audioContent ? 100 : 500);
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
    console.log('[VoiceAssessment] Starting speech recognition...');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('[VoiceAssessment] Speech recognition not supported');
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser. Please use Chrome.',
        variant: 'destructive',
      });
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }

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

    console.log('[VoiceAssessment] Recognition language:', recognition.lang);

    let finalTranscript = '';
    let silenceTimeout: ReturnType<typeof setTimeout>;

    recognition.onstart = () => {
      console.log('[VoiceAssessment] Recognition started');
      setIsUserSpeaking(true);
    };

    recognition.onresult = (event) => {
      let interim = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + ' ';
          console.log('[VoiceAssessment] Final transcript:', text);
        } else {
          interim += text;
          console.log('[VoiceAssessment] Interim:', text);
        }
      }

      // Reset silence timeout - send message after 2 seconds of silence
      clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(() => {
        if (finalTranscript.trim()) {
          console.log('[VoiceAssessment] Silence detected, sending message:', finalTranscript.trim());
          const messageToSend = finalTranscript.trim();
          finalTranscript = '';
          
          // Stop recognition before sending
          try {
            recognition.stop();
          } catch (e) {
            // Ignore
          }
          
          sendMessage(messageToSend);
        }
      }, 2000);
    };

    recognition.onerror = (event) => {
      console.error('[VoiceAssessment] Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart on no speech after a brief delay
        setTimeout(() => {
          if (recognitionRef.current === recognition) {
            try {
              recognition.start();
            } catch (e) {
              console.log('[VoiceAssessment] Could not restart recognition');
            }
          }
        }, 100);
      } else if (event.error === 'aborted') {
        // User or system aborted, this is fine
        setIsUserSpeaking(false);
      } else {
        setIsUserSpeaking(false);
        toast({
          title: 'Microphone Error',
          description: `Speech recognition error: ${event.error}. Please try again.`,
          variant: 'destructive',
        });
      }
    };

    recognition.onend = () => {
      console.log('[VoiceAssessment] Recognition ended');
      setIsUserSpeaking(false);
      clearTimeout(silenceTimeout);
      
      // If there's remaining transcript, send it
      if (finalTranscript.trim()) {
        console.log('[VoiceAssessment] Sending remaining transcript on end:', finalTranscript.trim());
        sendMessage(finalTranscript.trim());
        finalTranscript = '';
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
      console.log('[VoiceAssessment] Recognition start() called');
    } catch (err) {
      console.error('[VoiceAssessment] Failed to start recognition:', err);
      setIsUserSpeaking(false);
    }
  }, [selectedLanguage, sendMessage, toast]);

  // Keep the ref updated so callbacks can access startListening
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const startSession = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);
    messagesRef.current = [];
    sessionIdRef.current = crypto.randomUUID();
    setIsComplete(false);
    isCompleteRef.current = false;

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

      // Play greeting audio then start listening, or use browser TTS fallback
      if (data.audioContent) {
        await playAudio(data.audioContent);
        console.log('[VoiceAssessment] Greeting finished, starting to listen...');
        startListeningRef.current?.();
      } else if (data.text) {
        // Fallback to browser TTS
        console.log('[VoiceAssessment] Using browser TTS for greeting');
        setIsAssistantSpeaking(true);
        await speakWithBrowserTTS(data.text);
        setIsAssistantSpeaking(false);
        startListeningRef.current?.();
      }

    } catch (err) {
      console.error('Start session error:', err);
      setError('Failed to start session. Please try again.');
      setStatus('error');
    }
  }, [selectedLanguage, selectedVoice, playAudio, speakWithBrowserTTS]);

  const endSession = useCallback(() => {
    console.log('[VoiceAssessment] Ending session...');
    stopAudio();
    stopListening();
    setStatus('ended');
  }, [stopAudio, stopListening]);

  const resetSession = useCallback(() => {
    console.log('[VoiceAssessment] Resetting session...');
    stopAudio();
    stopListening();
    setTranscript([]);
    messagesRef.current = [];
    sessionIdRef.current = crypto.randomUUID();
    setIsComplete(false);
    isCompleteRef.current = false;
    setError(null);
    setStatus('idle');
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
    resetSession,
    stopAudio,
    startListening,
    stopListening,
    generateReport,
  };
};
