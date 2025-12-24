import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  ArrowRight, 
  Download, 
  Share2, 
  TrendingUp, 
  TrendingDown,
  Target,
  Heart,
  Zap,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const ReportPage = () => {
  const navigate = useNavigate();

  // Sample report data (in production, this would come from AI analysis)
  const sentimentData = {
    overall: 68,
    categories: [
      { name: "Focus & Attention", score: 45, trend: "down" },
      { name: "Emotional Regulation", score: 72, trend: "up" },
      { name: "Impulsivity Management", score: 58, trend: "neutral" },
      { name: "Task Completion", score: 52, trend: "down" },
      { name: "Hyperactivity", score: 65, trend: "neutral" },
      { name: "Time Perception", score: 48, trend: "down" },
    ],
    strengths: [
      "Strong awareness of emotional patterns",
      "Good verbal expression skills",
      "Motivated to seek support",
      "Creative problem-solving abilities",
    ],
    challenges: [
      "Difficulty sustaining attention on non-preferred tasks",
      "Time management and estimation challenges",
      "Impulsive decision-making patterns",
      "Task initiation difficulties",
    ],
    recommendations: [
      {
        title: "Pomodoro Technique",
        description: "25-minute focused work sessions with 5-minute breaks to improve sustained attention.",
        priority: "high",
      },
      {
        title: "Time Boxing",
        description: "Set external timers and visual cues to improve time awareness and task transitions.",
        priority: "high",
      },
      {
        title: "Body Doubling",
        description: "Work alongside others (virtually or in-person) to maintain focus and accountability.",
        priority: "medium",
      },
      {
        title: "Dopamine Menu",
        description: "Create a list of healthy stimulating activities for low-energy periods.",
        priority: "medium",
      },
    ],
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-primary";
    if (score >= 50) return "text-warm";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-primary";
    if (score >= 50) return "bg-warm";
    return "bg-destructive";
  };

  const handleContinueWithCompanion = () => {
    navigate("/companion");
  };

  return (
    <div className="min-h-screen bg-background gradient-calm">
      {/* Header */}
      <header className="p-6 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-soft">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Nutrail
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl p-6 pb-24">
        {/* Report Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Assessment Report
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Your Wellness
            <span className="text-gradient"> Insights</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Based on your 20-question assessment, here's a comprehensive analysis of your 
            focus patterns, emotional responses, and personalized recommendations.
          </p>
        </div>

        {/* Overall Score Card */}
        <Card className="shadow-float mb-8 overflow-hidden">
          <div className="gradient-hero p-8 text-center">
            <h2 className="font-display text-6xl font-bold text-primary-foreground mb-2">
              {sentimentData.overall}
            </h2>
            <p className="text-primary-foreground/80">Overall Wellness Score</p>
          </div>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">Emotional Awareness</p>
                <p className="text-sm text-muted-foreground">Above Average</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">Focus Patterns</p>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">Energy Management</p>
                <p className="text-sm text-muted-foreground">Moderate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              Detailed Category Analysis
            </CardTitle>
            <CardDescription>
              Sentiment scores across key ADHD-related areas based on your responses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sentimentData.categories.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{category.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-display font-bold ${getScoreColor(category.score)}`}>
                        {category.score}%
                      </span>
                      {category.trend === "up" && <TrendingUp className="w-4 h-4 text-primary" />}
                      {category.trend === "down" && <TrendingDown className="w-4 h-4 text-destructive" />}
                    </div>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(category.score)}`}
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Challenges */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="w-6 h-6" />
                Your Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {sentimentData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-warm">
                <AlertCircle className="w-6 h-6" />
                Areas for Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {sentimentData.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-warm/20 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-3 h-3 text-warm" />
                    </div>
                    <span className="text-muted-foreground">{challenge}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Evidence-based strategies tailored to your unique profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {sentimentData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-display font-semibold text-foreground">{rec.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      rec.priority === "high" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {rec.priority === "high" ? "Recommended" : "Try Later"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Continue CTA */}
        <Card className="shadow-float bg-gradient-to-r from-primary/5 to-warm/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Continue Your Journey
            </h3>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Would you like to continue with your personalized AI companion? It remembers 
              your preferences and provides ongoing support with emotional TTS and long-term memory.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="xl" onClick={handleContinueWithCompanion}>
                Continue with AI Companion
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Link to="/">
                <Button variant="outline" size="lg">
                  Maybe Later
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReportPage;
