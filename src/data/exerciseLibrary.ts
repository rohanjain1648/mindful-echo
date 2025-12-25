// Exercise types for guided toolkit exercises
export type ExerciseType = 'breathing' | 'grounding' | 'focus' | 'clarity' | 'relaxation';

export interface ExerciseStep {
  instruction: string;
  duration: number; // in seconds
  action?: 'inhale' | 'hold' | 'exhale' | 'input' | 'observe' | 'relax';
  prompt?: string; // For interactive exercises like brain dump
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: ExerciseType;
  duration: number; // total duration in minutes
  icon: string; // icon name from lucide
  steps: ExerciseStep[];
  ambientSound?: 'nature' | 'ocean' | 'rain' | 'silence';
}

// Box Breathing - 4-4-4-4 technique
const boxBreathingSteps: ExerciseStep[] = [
  { instruction: "Find a comfortable position and relax your shoulders.", duration: 5, action: 'relax' },
  { instruction: "We'll begin with box breathing. Inhale slowly through your nose for 4 counts.", duration: 4, action: 'inhale' },
  { instruction: "Hold your breath gently for 4 counts.", duration: 4, action: 'hold' },
  { instruction: "Exhale slowly through your mouth for 4 counts.", duration: 4, action: 'exhale' },
  { instruction: "Hold empty for 4 counts.", duration: 4, action: 'hold' },
  // Repeat 4 more times
  { instruction: "Inhale... slowly and deeply.", duration: 4, action: 'inhale' },
  { instruction: "Hold...", duration: 4, action: 'hold' },
  { instruction: "Exhale... release any tension.", duration: 4, action: 'exhale' },
  { instruction: "Hold empty...", duration: 4, action: 'hold' },
  { instruction: "Inhale... filling your lungs.", duration: 4, action: 'inhale' },
  { instruction: "Hold... stay present.", duration: 4, action: 'hold' },
  { instruction: "Exhale... let go completely.", duration: 4, action: 'exhale' },
  { instruction: "Hold...", duration: 4, action: 'hold' },
  { instruction: "Inhale... you're doing great.", duration: 4, action: 'inhale' },
  { instruction: "Hold...", duration: 4, action: 'hold' },
  { instruction: "Exhale... feel the calm.", duration: 4, action: 'exhale' },
  { instruction: "Hold...", duration: 4, action: 'hold' },
  { instruction: "Last round. Inhale deeply.", duration: 4, action: 'inhale' },
  { instruction: "Hold...", duration: 4, action: 'hold' },
  { instruction: "Exhale completely.", duration: 4, action: 'exhale' },
  { instruction: "Hold...", duration: 4, action: 'hold' },
  { instruction: "Return to normal breathing. Notice how you feel.", duration: 5, action: 'relax' },
  { instruction: "Well done. You've completed the box breathing exercise.", duration: 3, action: 'relax' },
];

// 5-4-3-2-1 Senses Grounding
const sensesGroundingSteps: ExerciseStep[] = [
  { instruction: "Let's ground yourself in the present moment using your senses.", duration: 5, action: 'relax' },
  { instruction: "Look around you. Name 5 things you can see.", duration: 15, action: 'observe', prompt: "What 5 things can you see?" },
  { instruction: "Take a moment to really notice each one.", duration: 5, action: 'observe' },
  { instruction: "Now, notice 4 things you can touch or feel.", duration: 12, action: 'observe', prompt: "What 4 things can you feel?" },
  { instruction: "Feel the texture, temperature, or pressure of each.", duration: 5, action: 'observe' },
  { instruction: "Listen carefully. What are 3 sounds you can hear?", duration: 10, action: 'observe', prompt: "What 3 sounds can you hear?" },
  { instruction: "Some might be distant, others close by.", duration: 5, action: 'observe' },
  { instruction: "What are 2 things you can smell right now?", duration: 8, action: 'observe', prompt: "What 2 things can you smell?" },
  { instruction: "If nothing comes to mind, that's okay.", duration: 4, action: 'observe' },
  { instruction: "Finally, notice 1 thing you can taste.", duration: 6, action: 'observe', prompt: "What 1 thing can you taste?" },
  { instruction: "Take a deep breath. You are here, present, and grounded.", duration: 5, action: 'relax' },
  { instruction: "Excellent work. You've reconnected with the present moment.", duration: 4, action: 'relax' },
];

// Body Scan Relaxation
const bodyScanSteps: ExerciseStep[] = [
  { instruction: "Settle into a comfortable position. Close your eyes if you'd like.", duration: 6, action: 'relax' },
  { instruction: "Take three deep breaths to begin.", duration: 8, action: 'inhale' },
  { instruction: "Bring your attention to the top of your head. Notice any tension there.", duration: 8, action: 'observe' },
  { instruction: "Let that tension soften and release.", duration: 5, action: 'relax' },
  { instruction: "Move down to your forehead and eyebrows. Smooth out any lines of stress.", duration: 8, action: 'relax' },
  { instruction: "Relax your eyes, your cheeks, and your jaw.", duration: 8, action: 'relax' },
  { instruction: "Let your jaw hang slightly open if comfortable.", duration: 5, action: 'relax' },
  { instruction: "Notice your neck and shoulders. These often hold so much tension.", duration: 8, action: 'observe' },
  { instruction: "Let your shoulders drop away from your ears.", duration: 6, action: 'relax' },
  { instruction: "Feel the tension melting down through your arms, to your elbows, wrists, and fingertips.", duration: 10, action: 'relax' },
  { instruction: "Bring attention to your chest and upper back. Breathe into any tightness.", duration: 10, action: 'inhale' },
  { instruction: "Move down to your belly. Let it be soft and relaxed.", duration: 8, action: 'relax' },
  { instruction: "Notice your lower back and hips. Release any holding.", duration: 8, action: 'relax' },
  { instruction: "Let the relaxation flow through your thighs, knees, and calves.", duration: 10, action: 'relax' },
  { instruction: "All the way down to your ankles, feet, and toes.", duration: 8, action: 'relax' },
  { instruction: "Your whole body is now relaxed and at peace.", duration: 6, action: 'relax' },
  { instruction: "Take one more deep breath, and when you're ready, gently open your eyes.", duration: 8, action: 'inhale' },
  { instruction: "Wonderful. You've completed the body scan. Carry this calm with you.", duration: 5, action: 'relax' },
];

// Task Anchoring - Break down overwhelming tasks
const taskAnchoringSteps: ExerciseStep[] = [
  { instruction: "Let's break down an overwhelming task into manageable steps.", duration: 5, action: 'relax' },
  { instruction: "Think of a task that feels overwhelming right now.", duration: 8, action: 'observe', prompt: "What task feels overwhelming?" },
  { instruction: "Take a deep breath. We're going to make this easier.", duration: 5, action: 'inhale' },
  { instruction: "What is the very first, smallest step you could take?", duration: 10, action: 'input', prompt: "What's the first tiny step?" },
  { instruction: "Good. That's your anchor. Write it down if you can.", duration: 6, action: 'observe' },
  { instruction: "Now, what's the next small step after that?", duration: 10, action: 'input', prompt: "What comes next?" },
  { instruction: "Keep going. What's step three?", duration: 10, action: 'input', prompt: "And then?" },
  { instruction: "Perfect. You've created three micro-steps.", duration: 5, action: 'relax' },
  { instruction: "Each completed step releases a small dopamine reward.", duration: 5, action: 'observe' },
  { instruction: "Set a timer for 5 minutes and start with just step one.", duration: 5, action: 'observe' },
  { instruction: "Remember: progress, not perfection.", duration: 4, action: 'relax' },
  { instruction: "You've anchored your task. Now take action!", duration: 5, action: 'relax' },
];

// Brain Dump - Thought offloading
const brainDumpSteps: ExerciseStep[] = [
  { instruction: "This is your brain dump. A space to release mental clutter.", duration: 5, action: 'relax' },
  { instruction: "Take a deep breath. There's no wrong way to do this.", duration: 5, action: 'inhale' },
  { instruction: "What's on your mind right now? Let it flow without judgment.", duration: 20, action: 'input', prompt: "What's on your mind?" },
  { instruction: "Good. Keep going. What worries or to-dos are floating around?", duration: 20, action: 'input', prompt: "Any worries or tasks?" },
  { instruction: "What emotions are you holding? Name them if you can.", duration: 15, action: 'input', prompt: "What are you feeling?" },
  { instruction: "Is there anything you've been avoiding thinking about?", duration: 15, action: 'input', prompt: "Anything you're avoiding?" },
  { instruction: "Take a breath. You've released a lot.", duration: 5, action: 'exhale' },
  { instruction: "Now, look at what you've dumped. Is anything urgent?", duration: 10, action: 'observe' },
  { instruction: "Pick one thing to address today. Just one.", duration: 8, action: 'input', prompt: "What's most important?" },
  { instruction: "The rest can wait. Give yourself permission to let it go for now.", duration: 6, action: 'relax' },
  { instruction: "Take a final deep breath. Your mind is clearer.", duration: 5, action: 'exhale' },
  { instruction: "Well done. You've created space in your mind.", duration: 4, action: 'relax' },
];

export const EXERCISE_LIBRARY: Exercise[] = [
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    description: '4-4-4-4 breathing technique to calm your nervous system and regain focus.',
    type: 'breathing',
    duration: 4,
    icon: 'Wind',
    steps: boxBreathingSteps,
    ambientSound: 'silence',
  },
  {
    id: 'senses-grounding',
    title: '5-4-3-2-1 Senses',
    description: 'Sensory awareness exercise to ground yourself in the present moment.',
    type: 'grounding',
    duration: 3,
    icon: 'TreePine',
    steps: sensesGroundingSteps,
    ambientSound: 'nature',
  },
  {
    id: 'body-scan',
    title: 'Body Scan',
    description: 'Progressive relaxation to release physical tension and hyperactivity.',
    type: 'relaxation',
    duration: 8,
    icon: 'Waves',
    steps: bodyScanSteps,
    ambientSound: 'rain',
  },
  {
    id: 'task-anchoring',
    title: 'Task Anchoring',
    description: 'Break down overwhelming tasks into micro-steps with dopamine checkpoints.',
    type: 'focus',
    duration: 5,
    icon: 'Target',
    steps: taskAnchoringSteps,
    ambientSound: 'silence',
  },
  {
    id: 'brain-dump',
    title: 'Brain Dump',
    description: 'Voice-guided thought offloading to clear mental clutter and reduce anxiety.',
    type: 'clarity',
    duration: 10,
    icon: 'Lightbulb',
    steps: brainDumpSteps,
    ambientSound: 'nature',
  },
];

export const getExerciseById = (id: string): Exercise | undefined => {
  return EXERCISE_LIBRARY.find(e => e.id === id);
};

export const getExercisesByType = (type: ExerciseType): Exercise[] => {
  return EXERCISE_LIBRARY.filter(e => e.type === type);
};
