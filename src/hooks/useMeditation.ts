import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MeditationScript, MeditationStep } from '@/data/meditationLibrary';

export type MeditationStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'complete';

export interface UseMeditationReturn {
  status: MeditationStatus;
  currentStep: number;
  totalSteps: number;
  currentInstruction: string;
  progress: number;
  isPlaying: boolean;
  startMeditation: (script: MeditationScript) => Promise<void>;
  pauseMeditation: () => void;
  resumeMeditation: () => void;
  stopMeditation: () => void;
  ambientVolume: number;
  setAmbientVolume: (volume: number) => void;
}

// Ambient sound URLs (royalty-free)
const AMBIENT_SOUNDS: Record<string, string> = {
  nature: 'https://assets.mixkit.co/music/preview/mixkit-forest-birds-ambience-1212.mp3',
  ocean: 'https://assets.mixkit.co/music/preview/mixkit-sea-waves-loop-1196.mp3',
  rain: 'https://assets.mixkit.co/music/preview/mixkit-light-rain-loop-2393.mp3',
  silence: '',
  om: '', // OM will be generated via TTS
};

export const useMeditation = (): UseMeditationReturn => {
  const [status, setStatus] = useState<MeditationStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [ambientVolume, setAmbientVolume] = useState(0.3);

  const scriptRef = useRef<MeditationScript | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);
  const currentStepIndexRef = useRef(0);

  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (ambientRef.current) {
      ambientRef.current.pause();
      ambientRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  }, []);

  // Browser TTS fallback
  const speakWithBrowserTTS = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slower for meditation
      utterance.pitch = 0.9;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const calmVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                        voices.find(v => v.lang.startsWith('en')) ||
                        voices[0];
      if (calmVoice) {
        utterance.voice = calmVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Generate TTS audio for instruction
  const generateTTSAudio = useCallback(async (text: string, isOmChant: boolean = false): Promise<string | null> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meditation-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ text, isOmChant }),
        }
      );

      const data = await response.json();
      return data.audioContent || null;
    } catch (err) {
      console.error('[Meditation] TTS generation failed:', err);
      return null;
    }
  }, []);

  // Play audio from base64
  const playAudioFromBase64 = useCallback((base64Audio: string): Promise<void> => {
    return new Promise((resolve) => {
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => resolve();
      audio.onerror = () => resolve();

      audio.play().catch(() => resolve());
    });
  }, []);

  // Start ambient sound
  const startAmbientSound = useCallback(async (soundType: string) => {
    if (soundType === 'silence') return;

    if (soundType === 'om') {
      // Generate OM chanting audio
      const omAudio = await generateTTSAudio('', true);
      if (omAudio) {
        const audio = new Audio(`data:audio/mpeg;base64,${omAudio}`);
        audio.loop = true;
        audio.volume = ambientVolume;
        ambientRef.current = audio;
        audio.play().catch(console.error);
      }
      return;
    }

    const soundUrl = AMBIENT_SOUNDS[soundType];
    if (!soundUrl) return;

    const audio = new Audio(soundUrl);
    audio.loop = true;
    audio.volume = ambientVolume;
    ambientRef.current = audio;
    audio.play().catch(console.error);
  }, [ambientVolume, generateTTSAudio]);

  // Update ambient volume
  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  // Process a single meditation step
  const processStep = useCallback(async (step: MeditationStep, stepIndex: number) => {
    if (isPausedRef.current) return;

    setCurrentStep(stepIndex + 1);
    setCurrentInstruction(step.instruction);
    currentStepIndexRef.current = stepIndex;

    // Generate and play TTS
    const audioContent = await generateTTSAudio(step.instruction);
    
    if (isPausedRef.current) return;

    if (audioContent) {
      await playAudioFromBase64(audioContent);
    } else {
      // Fallback to browser TTS
      await speakWithBrowserTTS(step.instruction);
    }

    if (isPausedRef.current) return;

    // Wait for pause duration
    await new Promise<void>((resolve) => {
      pauseTimeoutRef.current = setTimeout(resolve, step.pauseDuration * 1000);
    });
  }, [generateTTSAudio, playAudioFromBase64, speakWithBrowserTTS]);

  // Run through all meditation steps
  const runMeditation = useCallback(async (script: MeditationScript, startFromStep: number = 0) => {
    for (let i = startFromStep; i < script.steps.length; i++) {
      if (isPausedRef.current) {
        currentStepIndexRef.current = i;
        return;
      }

      await processStep(script.steps[i], i);
    }

    // Meditation complete
    setStatus('complete');
    stopAllAudio();
    toast({
      title: 'Meditation Complete',
      description: 'Well done! You\'ve completed your meditation session.',
    });
  }, [processStep, stopAllAudio, toast]);

  // Start meditation
  const startMeditation = useCallback(async (script: MeditationScript) => {
    setStatus('loading');
    scriptRef.current = script;
    setTotalSteps(script.steps.length);
    setCurrentStep(0);
    isPausedRef.current = false;
    currentStepIndexRef.current = 0;

    // Start ambient sound
    await startAmbientSound(script.ambientSound);

    setStatus('playing');

    // Run meditation steps
    await runMeditation(script);
  }, [startAmbientSound, runMeditation]);

  // Pause meditation
  const pauseMeditation = useCallback(() => {
    isPausedRef.current = true;
    setStatus('paused');

    // Pause all audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (ambientRef.current) {
      ambientRef.current.pause();
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    window.speechSynthesis?.cancel();
  }, []);

  // Resume meditation
  const resumeMeditation = useCallback(() => {
    if (!scriptRef.current) return;

    isPausedRef.current = false;
    setStatus('playing');

    // Resume ambient sound
    if (ambientRef.current) {
      ambientRef.current.play().catch(console.error);
    }

    // Continue from current step
    runMeditation(scriptRef.current, currentStepIndexRef.current);
  }, [runMeditation]);

  // Stop meditation
  const stopMeditation = useCallback(() => {
    isPausedRef.current = true;
    stopAllAudio();
    window.speechSynthesis?.cancel();
    setStatus('idle');
    setCurrentStep(0);
    setCurrentInstruction('');
    scriptRef.current = null;
  }, [stopAllAudio]);

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return {
    status,
    currentStep,
    totalSteps,
    currentInstruction,
    progress,
    isPlaying: status === 'playing',
    startMeditation,
    pauseMeditation,
    resumeMeditation,
    stopMeditation,
    ambientVolume,
    setAmbientVolume,
  };
};
