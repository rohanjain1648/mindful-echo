import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
  Loader2,
  Info,
  Copy,
  Twitter,
  Linkedin,
  MessageCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReportData {
  overall_sentiment_score: number;
  primary_patterns: string[];
  strengths: string[];
  challenges: string[];
  category_scores: Record<string, number>;
  recommendations: Array<{
    area: string;
    suggestion: string;
    priority: string;
  }>;
  summary: string;
  next_steps: string[];
  disclaimer: string;
}

const ReportPage = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    toast.info("Generating PDF...");
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      // Calculate how many pages we need
      const scaledHeight = imgHeight * ratio;
      const pageCount = Math.ceil(scaledHeight / pdfHeight);
      
      for (let i = 0; i < pageCount; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(
          imgData,
          'PNG',
          imgX,
          -(i * pdfHeight),
          imgWidth * ratio,
          imgHeight * ratio
        );
      }
      
      pdf.save('wellness-report.pdf');
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const shareUrl = window.location.href;
  const shareTitle = "My Wellness Assessment Report";
  const shareText = `Check out my wellness assessment results! Overall score: ${Math.round((reportData?.overall_sentiment_score || 0.68) * 100)}%`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
    }
  };

  useEffect(() => {
    // Try to get report from session storage
    const storedReport = sessionStorage.getItem('assessmentReport');
    if (storedReport) {
      try {
        setReportData(JSON.parse(storedReport));
      } catch (e) {
        console.error('Failed to parse report:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Fallback data for display
  const displayData = reportData || {
    overall_sentiment_score: 0.68,
    primary_patterns: [
      "Attention regulation challenges",
      "Time perception difficulties",
      "Emotional sensitivity patterns"
    ],
    strengths: [
      "Strong self-awareness",
      "Good verbal expression skills",
      "Motivated to seek support",
      "Creative thinking abilities",
    ],
    challenges: [
      "Sustaining attention on non-preferred tasks",
      "Time management and estimation",
      "Impulsive decision-making patterns",
      "Task initiation difficulties",
    ],
    category_scores: {
      impulsivity: 6,
      hyperactivity: 5,
      inattention: 7,
      emotional_regulation: 6,
      executive_function: 7,
      time_management: 8,
    },
    recommendations: [
      {
        area: "Focus",
        suggestion: "Use Pomodoro Technique with 25-minute focused sessions",
        priority: "high",
      },
      {
        area: "Time",
        suggestion: "Set visual timers and external cues for time awareness",
        priority: "high",
      },
      {
        area: "Accountability",
        suggestion: "Try body doubling - work alongside others for focus",
        priority: "medium",
      },
      {
        area: "Energy",
        suggestion: "Create a 'dopamine menu' of healthy stimulating activities",
        priority: "medium",
      },
    ],
    summary: "Based on your assessment responses, you demonstrate strong self-awareness and a genuine desire to understand and improve your focus patterns. Your responses indicate some common ADHD-related challenges around attention regulation, time perception, and task initiation.",
    next_steps: [
      "Try the recommended focus strategies",
      "Continue with AI companion for ongoing support",
      "Consider professional evaluation if needed"
    ],
    disclaimer: "This assessment is not a clinical diagnosis. Please consult with a qualified healthcare professional for a comprehensive evaluation.",
  };

  const overallScore = Math.round((reportData?.overall_sentiment_score || 0.68) * 100);

  const categoryLabels: Record<string, string> = {
    impulsivity: "Impulsivity Management",
    hyperactivity: "Hyperactivity Control",
    inattention: "Focus & Attention",
    emotional_regulation: "Emotional Regulation",
    executive_function: "Executive Function",
    time_management: "Time Management",
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-primary";
    if (score <= 6) return "text-warm";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score <= 3) return "bg-primary";
    if (score <= 6) return "bg-warm";
    return "bg-destructive";
  };

  const handleContinueWithCompanion = () => {
    navigate("/companion");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background gradient-calm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your report...</p>
        </div>
      </div>
    );
  }

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
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer">
                  <Twitter className="w-4 h-4 mr-2" />
                  Share on X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareLinkedIn} className="cursor-pointer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  Share on LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsApp} className="cursor-pointer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share on WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main ref={reportRef} className="container mx-auto max-w-5xl p-6 pb-24 bg-background">
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

        {/* AI Analysis Indicator */}
        {reportData && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium">AI-Generated Analysis</p>
              <p className="text-xs text-muted-foreground">
                This report was generated using our RAG-based AI system trained on evidence-based ADHD research.
              </p>
            </div>
          </div>
        )}

        {/* Overall Score Card */}
        <Card className="shadow-float mb-8 overflow-hidden">
          <div className="gradient-hero p-8 text-center">
            <h2 className="font-display text-6xl font-bold text-primary-foreground mb-2">
              {overallScore}
            </h2>
            <p className="text-primary-foreground/80">Overall Wellness Score</p>
          </div>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">Emotional Awareness</p>
                <p className="text-sm text-muted-foreground">
                  {overallScore >= 70 ? "Strong" : overallScore >= 50 ? "Developing" : "Needs Attention"}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">Focus Patterns</p>
                <p className="text-sm text-muted-foreground">
                  {displayData.category_scores?.inattention <= 5 ? "Well Managed" : "Needs Support"}
                </p>
              </div>
              <div className="text-center p-4 rounded-xl bg-secondary/50">
                <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-display font-semibold text-foreground">Energy Management</p>
                <p className="text-sm text-muted-foreground">
                  {displayData.category_scores?.hyperactivity <= 5 ? "Balanced" : "Variable"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {displayData.summary && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Info className="w-6 h-6 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{displayData.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Primary Patterns */}
        {displayData.primary_patterns?.length > 0 && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-primary" />
                Observed Patterns
              </CardTitle>
              <CardDescription>
                Key patterns identified from your assessment responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {displayData.primary_patterns.map((pattern, index) => (
                  <span
                    key={index}
                    className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {Object.keys(displayData.category_scores || {}).length > 0 && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                Detailed Category Analysis
              </CardTitle>
              <CardDescription>
                Scores across key ADHD-related areas (lower = better managed).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(displayData.category_scores).map(([key, score]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">
                        {categoryLabels[key] || key}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-display font-bold ${getScoreColor(score as number)}`}>
                          {score}/10
                        </span>
                        {(score as number) <= 3 && <TrendingDown className="w-4 h-4 text-primary" />}
                        {(score as number) >= 7 && <TrendingUp className="w-4 h-4 text-destructive" />}
                      </div>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score as number)}`}
                        style={{ width: `${((score as number) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                {(displayData.strengths || []).map((strength, index) => (
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
                {(displayData.challenges || []).map((challenge, index) => (
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
              {(displayData.recommendations || []).map((rec, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-display font-semibold text-foreground">{rec.area}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      rec.priority === "high" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {rec.priority === "high" ? "Recommended" : "Try Later"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        {displayData.next_steps?.length > 0 && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ArrowRight className="w-6 h-6 text-primary" />
                Suggested Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {displayData.next_steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <div className="mb-8 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            {displayData.disclaimer || "This assessment is not a clinical diagnosis. Please consult with a qualified healthcare professional for a comprehensive evaluation."}
          </p>
        </div>

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
