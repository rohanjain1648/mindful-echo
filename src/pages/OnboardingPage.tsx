import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Brain, Shield, Lock, Heart, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [consents, setConsents] = useState({
    dataProcessing: false,
    voiceRecording: false,
    sessionHistory: false,
    ageConfirmation: false,
  });
  const navigate = useNavigate();

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleConsentChange = (key: keyof typeof consents) => {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canProceedStep1 = consents.dataProcessing && consents.ageConfirmation;
  const canProceedStep2 = consents.voiceRecording;

  const handleContinueToAssessment = () => {
    navigate("/assessment");
  };

  return (
    <div className="min-h-screen bg-background gradient-calm flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-warm/5 rounded-full blur-3xl" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">
              Nutrail
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Let's Get Started
          </h1>
          <p className="text-muted-foreground">
            Just a few quick steps before your personalized assessment
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="shadow-float">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  Privacy & Consent
                </CardTitle>
                <CardDescription>
                  Your privacy is our priority. Please review and accept our terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-secondary/50 border border-border">
                    <Checkbox
                      id="dataProcessing"
                      checked={consents.dataProcessing}
                      onCheckedChange={() => handleConsentChange("dataProcessing")}
                    />
                    <div className="flex-1">
                      <label htmlFor="dataProcessing" className="text-sm font-medium text-foreground cursor-pointer">
                        Data Processing Consent *
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        I agree to have my responses processed by AI for personalized mental wellness support. 
                        All data is encrypted and HIPAA compliant.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-secondary/50 border border-border">
                    <Checkbox
                      id="ageConfirmation"
                      checked={consents.ageConfirmation}
                      onCheckedChange={() => handleConsentChange("ageConfirmation")}
                    />
                    <div className="flex-1">
                      <label htmlFor="ageConfirmation" className="text-sm font-medium text-foreground cursor-pointer">
                        Age Confirmation *
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        I confirm that I am 18 years or older, or have parental/guardian consent.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Lock className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Your conversations are end-to-end encrypted and never shared with third parties.
                  </p>
                </div>

                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-primary" />
                  Voice & Session Preferences
                </CardTitle>
                <CardDescription>
                  Customize how you interact with your AI companion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-secondary/50 border border-border">
                    <Checkbox
                      id="voiceRecording"
                      checked={consents.voiceRecording}
                      onCheckedChange={() => handleConsentChange("voiceRecording")}
                    />
                    <div className="flex-1">
                      <label htmlFor="voiceRecording" className="text-sm font-medium text-foreground cursor-pointer">
                        Voice Recording Permission *
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Allow microphone access for voice conversations. Recordings are processed in real-time 
                        and not permanently stored unless you opt-in below.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-secondary/50 border border-border">
                    <Checkbox
                      id="sessionHistory"
                      checked={consents.sessionHistory}
                      onCheckedChange={() => handleConsentChange("sessionHistory")}
                    />
                    <div className="flex-1">
                      <label htmlFor="sessionHistory" className="text-sm font-medium text-foreground cursor-pointer">
                        Session History (Optional)
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Save anonymized session topics and successful strategies for your reference. 
                        You can delete this data anytime.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1"
                    disabled={!canProceedStep2}
                    onClick={() => setStep(3)}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader className="text-center">
                <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle>You're All Set!</CardTitle>
                <CardDescription>
                  You're ready to begin your personalized 20-question assessment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h4 className="font-medium text-foreground mb-3">What to expect:</h4>
                  <ul className="space-y-2">
                    {[
                      "20 voice-based questions about your focus and emotional patterns",
                      "Real-time sentiment analysis of your responses",
                      "A detailed wellness report at the end",
                      "Option to continue with your personalized AI companion",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-warm/10 border border-warm/20">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Remember:</strong> Take your time with each question. 
                    There are no right or wrong answers—this is about understanding your unique experience.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={handleContinueToAssessment}
                  >
                    Begin Assessment
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Skip link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default OnboardingPage;
