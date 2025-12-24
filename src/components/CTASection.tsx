import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Lock, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export const CTASection = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="bg-card rounded-3xl p-12 md:p-16 shadow-float border border-border/50 text-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-warm/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Start Your Journey Today
          </span>

          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 relative z-10">
            Ready to Transform Your
            <span className="text-gradient"> Mental Wellness?</span>
          </h2>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 relative z-10">
            Join thousands of individuals who are already experiencing the benefits of personalized 
            AI-powered ADHD support. Your first assessment is completely free.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 relative z-10">
            <Link to="/onboarding">
              <Button variant="hero" size="xl">
                Begin Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-border/50 relative z-10">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Lock className="w-4 h-4 text-primary" />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Heart className="w-4 h-4 text-primary" />
              <span>Clinician Reviewed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
