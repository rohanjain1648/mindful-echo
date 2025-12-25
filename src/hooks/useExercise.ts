import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Exercise, ExerciseStep } from '@/data/exerciseLibrary';

export type ExerciseStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'complete';

export interface UseExerciseReturn {
  status: ExerciseStatus;
  currentStep: number;
  totalSteps: number;
  currentInstruction: string;
  currentAction?: ExerciseStep['action'];
  currentPrompt?: string;
  progress: number;
  isPlaying: boolean;
  startExercise: (exercise: Exercise) => Promise<void>;
  pauseExercise: () => void;
  resumeExercise: () => void;
  stopExercise: () => void;
  nextStep: () => void;
  ambientVolume: number;
  setAmbientVolume: (volume: number) => void;
}

// Ambient sound URLs (royalty-free)
const AMBIENT_SOUNDS: Record<string, string> = {
  nature: 'https://assets.mixkit.co/music/preview/mixkit-forest-birds-ambience-1212.mp3',
  ocean: 'https://assets.mixkit.co/music/preview/mixkit-sea-waves-loop-1196.mp3',
  rain: 'https://assets.mixkit.co/music/preview/mixkit-light-rain-loop-2393.mp3',
  silence: '',
};

export const useExercise = (): UseExerciseReturn => {
  const [status, setStatus] = useState<ExerciseStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [currentAction, setCurrentAction] = useState<ExerciseStep['action']>();
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [ambientVolume, setAmbientVolume] = useState(0.3);

  const exerciseRef = useRef<Exercise | null>(null);
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const stepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (ambientRef.current) {
      ambientRef.current.pause();
      ambientRef.current = null;
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  // Browser TTS
  const speakInstruction = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
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

  // Start ambient sound
  const startAmbientSound = useCallback((soundType: string) => {
    if (soundType === 'silence' || !soundType) return;

    const soundUrl = AMBIENT_SOUNDS[soundType];
    if (!soundUrl) return;

    const audio = new Audio(soundUrl);
    audio.loop = true;
    audio.volume = ambientVolume;
    ambientRef.current = audio;
    audio.play().catch(console.error);
  }, [ambientVolume]);

  // Update ambient volume
  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  // Process a single step
  const processStep = useCallback(async (step: ExerciseStep, stepIndex: number) => {
    if (isPausedRef.current) return;

    setCurrentStep(stepIndex + 1);
    setCurrentInstruction(step.instruction);
    setCurrentAction(step.action);
    setCurrentPrompt(step.prompt);
    currentStepIndexRef.current = stepIndex;

    // Speak the instruction
    await speakInstruction(step.instruction);

    if (isPausedRef.current) return;

    // Wait for step duration
    await new Promise<void>((resolve) => {
      stepTimeoutRef.current = setTimeout(resolve, step.duration * 1000);
    });
  }, [speakInstruction]);

  // Run through all steps
  const runExercise = useCallback(async (exercise: Exercise, startFromStep: number = 0) => {
    for (let i = startFromStep; i < exercise.steps.length; i++) {
      if (isPausedRef.current) {
        currentStepIndexRef.current = i;
        return;
      }

      await processStep(exercise.steps[i], i);
    }

    // Exercise complete
    setStatus('complete');
    stopAllAudio();
    toast({
      title: 'Exercise Complete',
      description: `Well done! You've completed the ${exercise.title} exercise.`,
    });
  }, [processStep, stopAllAudio, toast]);

  // Start exercise
  const startExercise = useCallback(async (exercise: Exercise) => {
    setStatus('loading');
    exerciseRef.current = exercise;
    setTotalSteps(exercise.steps.length);
    setCurrentStep(0);
    isPausedRef.current = false;
    currentStepIndexRef.current = 0;

    // Start ambient sound
    if (exercise.ambientSound) {
      startAmbientSound(exercise.ambientSound);
    }

    setStatus('playing');

    // Run exercise steps
    await runExercise(exercise);
  }, [startAmbientSound, runExercise]);

  // Pause exercise
  const pauseExercise = useCallback(() => {
    isPausedRef.current = true;
    setStatus('paused');

    if (ambientRef.current) {
      ambientRef.current.pause();
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
    window.speechSynthesis?.cancel();
  }, []);

  // Resume exercise
  const resumeExercise = useCallback(() => {
    if (!exerciseRef.current) return;

    isPausedRef.current = false;
    setStatus('playing');

    if (ambientRef.current) {
      ambientRef.current.play().catch(console.error);
    }

    runExercise(exerciseRef.current, currentStepIndexRef.current);
  }, [runExercise]);

  // Stop exercise
  const stopExercise = useCallback(() => {
    isPausedRef.current = true;
    stopAllAudio();
    setStatus('idle');
    setCurrentStep(0);
    setCurrentInstruction('');
    setCurrentAction(undefined);
    setCurrentPrompt(undefined);
    exerciseRef.current = null;
  }, [stopAllAudio]);

  // Skip to next step
  const nextStep = useCallback(() => {
    if (!exerciseRef.current) return;
    
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
    window.speechSynthesis?.cancel();
    
    const nextIndex = currentStepIndexRef.current + 1;
    if (nextIndex < exerciseRef.current.steps.length) {
      processStep(exerciseRef.current.steps[nextIndex], nextIndex).then(() => {
        if (nextIndex + 1 < (exerciseRef.current?.steps.length || 0)) {
          runExercise(exerciseRef.current!, nextIndex + 1);
        } else {
          setStatus('complete');
          stopAllAudio();
          toast({
            title: 'Exercise Complete',
            description: `Well done! You've completed the ${exerciseRef.current?.title} exercise.`,
          });
        }
      });
    }
  }, [processStep, runExercise, stopAllAudio, toast]);

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return {
    status,
    currentStep,
    totalSteps,
    currentInstruction,
    currentAction,
    currentPrompt,
    progress,
    isPlaying: status === 'playing',
    startExercise,
    pauseExercise,
    resumeExercise,
    stopExercise,
    nextStep,
    ambientVolume,
    setAmbientVolume,
  };
};
