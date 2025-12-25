import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Wind, 
  Timer, 
  Lightbulb, 
  TreePine, 
  Waves,
  ChevronRight,
  Sparkles,
  Play,
  Moon
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ToolkitItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  duration: string;
  category: string;
  onClick?: () => void;
}

const ToolkitItem = ({ icon, title, description, duration, category, onClick }: ToolkitItemProps) => (
  <Card className="group cursor-pointer hover:border-primary/30" onClick={onClick}>
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:gradient-hero group-hover:text-primary-foreground transition-all duration-300">
          {icon}
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
          {category}
        </span>
      </div>
      <CardTitle className="text-lg mt-3">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Timer className="w-4 h-4" />
          {duration}
        </span>
        <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10">
          <Play className="w-4 h-4 mr-1" />
          Start
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const ToolkitSection = () => {
  const navigate = useNavigate();

  const exercises = [
    {
      icon: <Moon className="w-6 h-6" />,
      title: "Guided Meditation",
      description: "AI-guided meditation sessions with ambient sounds and calming voice narration.",
      duration: "5-15 min",
      category: "Mindfulness",
      onClick: () => navigate('/meditation'),
    },
    {
      icon: <Wind className="w-6 h-6" />,
      title: "Box Breathing",
      description: "4-4-4-4 breathing technique to calm your nervous system and regain focus.",
      duration: "4 min",
      category: "Grounding",
      onClick: () => navigate('/box-breathing'),
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Task Anchoring",
      description: "Break down overwhelming tasks into micro-steps with dopamine checkpoints.",
      duration: "5 min",
      category: "Focus",
      onClick: () => navigate('/task-anchoring'),
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Brain Dump",
      description: "Voice-guided thought offloading to clear mental clutter and reduce anxiety.",
      duration: "10 min",
      category: "Clarity",
      onClick: () => navigate('/brain-dump'),
    },
    {
      icon: <TreePine className="w-6 h-6" />,
      title: "5-4-3-2-1 Senses",
      description: "Sensory awareness exercise to ground yourself in the present moment.",
      duration: "3 min",
      category: "Grounding",
      onClick: () => navigate('/senses-grounding'),
    },
    {
      icon: <Waves className="w-6 h-6" />,
      title: "Body Scan",
      description: "Progressive relaxation to release physical tension and hyperactivity.",
      duration: "8 min",
      category: "Relaxation",
      onClick: () => navigate('/body-scan'),
    },
  ];

  return (
    <section id="toolkit" className="py-24 px-6 bg-card relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-warm/5 rounded-full blur-3xl" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              On-Demand Resources
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Your ADHD
              <span className="text-gradient"> Toolkit</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Access curated grounding exercises and task-anchoring prompts anytime you need 
              support—all customized to your preferences.
            </p>
          </div>
          <Button variant="outline" className="mt-6 md:mt-0">
            View All Exercises
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <ToolkitItem key={exercise.title} {...exercise} />
          ))}
        </div>

        {/* Pro tip banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-warm/10 border border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-foreground mb-1">Pro Tip</h4>
                <p className="text-muted-foreground text-sm">
                  Your AI companion learns which exercises work best for you and will suggest them 
                  based on your current emotional state and time of day.
                </p>
              </div>
            </div>
            <Button variant="default" size="sm" className="shrink-0">
              Enable Smart Suggestions
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
