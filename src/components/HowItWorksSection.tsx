import { CheckCircle2, ArrowRight, MessageCircle, FileText, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Voice Assessment",
    description: "Complete a 20-question assessment through natural voice conversation with our AI companion.",
    icon: <MessageCircle className="w-6 h-6" />,
    color: "from-primary to-primary-glow",
  },
  {
    number: "02", 
    title: "Sentiment Analysis",
    description: "Our AI analyzes your emotional patterns and responses to generate a comprehensive wellness report.",
    icon: <FileText className="w-6 h-6" />,
    color: "from-warm to-warm/80",
  },
  {
    number: "03",
    title: "Personalized Journey",
    description: "Continue with your AI companion who remembers your experiences and guides you through ADHD strategies.",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-accent-foreground to-accent-foreground/80",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 px-6 gradient-calm relative overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Journey to
            <span className="text-gradient"> Mental Clarity</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Three simple steps to begin your personalized ADHD support experience with our voice-first platform.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 -translate-y-1/2" />

          <div className="grid lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="bg-card rounded-3xl p-8 shadow-card hover:shadow-float transition-all duration-500 hover:-translate-y-2 relative z-10">
                  {/* Step number badge */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-primary-foreground font-display text-xl font-bold mb-6 shadow-soft`}>
                    {step.number}
                  </div>

                  <h3 className="font-display text-2xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                  </p>

                  <div className="flex items-center text-primary font-medium">
                    {step.icon}
                    <span className="ml-2">Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-4 z-20 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-card shadow-soft flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
