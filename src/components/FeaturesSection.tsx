import { Mic, Brain, Shield, BarChart3, Heart, Sparkles } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard = ({ icon, title, description, delay = 0 }: FeatureCardProps) => (
  <div 
    className="group p-6 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-float transition-all duration-500 hover:-translate-y-1"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-primary-foreground mb-4 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export const FeaturesSection = () => {
  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: "Voice-First Assessment",
      description: "Natural conversations with our AI that understands context and responds with empathy through 20 comprehensive questions.",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "RAG-Powered Intelligence",
      description: "Advanced retrieval-augmented generation ensures responses are grounded in validated ADHD research and strategies.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Sentiment Analysis Reports",
      description: "Detailed emotional insights from your responses help you understand patterns and track your mental wellness journey.",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Emotional TTS Memory",
      description: "Your personal voice companion remembers your experiences and adapts with emotionally-aware responses.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safety Guardrails",
      description: "Built-in Gemma Shield 2B protection ensures safe, supportive conversations while detecting any concerning content.",
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Personalized Toolkit",
      description: "Access grounding exercises and ADHD task-anchoring prompts customized to your unique needs and preferences.",
    },
  ];

  return (
    <section id="features" className="py-24 px-6 bg-background relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Platform Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Everything You Need for
            <span className="text-gradient"> Mental Wellness</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our comprehensive platform combines cutting-edge AI with evidence-based ADHD strategies 
            to provide personalized support at every step of your journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
