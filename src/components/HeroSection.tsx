import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { VoiceOrb } from "@/components/VoiceOrb";
import { ArrowRight, CheckCircle2, Sparkles, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

export const HeroSection = () => {
  const stats = [
    { value: "10K+", label: "Users Helped" },
    { value: "98%", label: "Satisfaction" },
    { value: "24/7", label: "AI Support" },
  ];

  const highlights = [
    "Evidence-based ADHD strategies",
    "Private & secure conversations",
    "Personalized recommendations",
  ];

  return (
    <section className="relative min-h-screen pt-24 pb-16 px-6 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroBg})` }} />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-warm/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-8rem)]">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Mental Wellness</span>
            </div>

            {/* Main Headline */}
            <h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              Your Voice-First
              <span className="text-gradient block">Mental Health Companion</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-xl text-muted-foreground leading-relaxed max-w-xl animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              Experience personalized mental health support through natural voice conversations. Our AI understands your
              unique journey and provides evidence-based mental health strategies.
            </p>

            {/* Highlights */}
            <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              {highlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full gradient-hero flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium">{highlight}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up"
              style={{ animationDelay: "400ms" }}
            >
              <Link to="/onboarding">
                <Button variant="hero" size="xl">
                  Start Free Assessment
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Voice Interface Preview */}
          <div
            className="relative flex items-center justify-center animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <GlassCard className="p-12 relative">
              {/* Decorative orbs */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-warm/10 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <p className="text-muted-foreground mb-8 text-center">Try our voice interface</p>

                <VoiceOrb size="lg" />

                <div className="mt-12 text-center">
                  <p className="text-foreground font-medium mb-2">"Tell me about your focus challenges today"</p>
                  <p className="text-muted-foreground text-sm">Sample conversation starter</p>
                </div>

                {/* Testimonial snippet */}
                <div className="mt-8 p-4 bg-secondary/50 rounded-xl max-w-xs">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-warm fill-warm" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    "Finally, an AI that actually understands ADHD. The voice conversations feel natural and
                    supportive."
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Sarah M.</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
};
