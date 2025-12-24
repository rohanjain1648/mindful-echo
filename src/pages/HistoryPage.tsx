import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Calendar, Clock, FileText, ChevronRight, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface AssessmentSession {
  id: string;
  session_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number | null;
}

interface AssessmentResponse {
  id: string;
  question_index: number;
  question_text: string;
  user_response: string;
  ai_acknowledgment: string | null;
  emotion_detected: string | null;
  sentiment_score: number | null;
  created_at: string;
}

interface AssessmentReport {
  id: string;
  session_id: string;
  primary_patterns: string[] | null;
  strengths: string[] | null;
  challenges: string[] | null;
}

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [responses, setResponses] = useState<Record<string, AssessmentResponse[]>>({});
  const [reports, setReports] = useState<Record<string, AssessmentReport>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchSessions();
    }
  }, [user, authLoading, navigate]);

  const fetchSessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("assessment_sessions")
        .select("*")
        .order("started_at", { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch reports for all sessions
      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map(s => s.session_id);
        const { data: reportsData } = await supabase
          .from("assessment_reports")
          .select("*")
          .in("session_id", sessionIds);

        if (reportsData) {
          const reportsMap: Record<string, AssessmentReport> = {};
          reportsData.forEach(report => {
            reportsMap[report.session_id] = report;
          });
          setReports(reportsMap);
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (sessionId: string) => {
    if (responses[sessionId]) return;

    try {
      const { data, error } = await supabase
        .from("assessment_responses")
        .select("*")
        .eq("session_id", sessionId)
        .order("question_index", { ascending: true });

      if (error) throw error;
      setResponses(prev => ({ ...prev, [sessionId]: data || [] }));
    } catch (error) {
      console.error("Error fetching responses:", error);
    }
  };

  const handleSessionExpand = (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      fetchResponses(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingSession(sessionId);
    try {
      // Delete related data first (responses, reports)
      await supabase.from("assessment_responses").delete().eq("session_id", sessionId);
      await supabase.from("assessment_reports").delete().eq("session_id", sessionId);
      await supabase.from("assessment_sessions").delete().eq("session_id", sessionId);

      // Update local state
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      setResponses(prev => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });
      setReports(prev => {
        const updated = { ...prev };
        delete updated[sessionId];
        return updated;
      });

      toast.success("Session deleted successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    } finally {
      setDeletingSession(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmotionColor = (emotion: string | null) => {
    if (!emotion) return "text-muted-foreground";
    const emotionLower = emotion.toLowerCase();
    if (emotionLower.includes("positive") || emotionLower.includes("happy")) return "text-green-400";
    if (emotionLower.includes("negative") || emotionLower.includes("sad")) return "text-red-400";
    if (emotionLower.includes("neutral")) return "text-blue-400";
    return "text-muted-foreground";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Assessment History
              </h1>
              <p className="text-muted-foreground mt-1">
                View all your past assessment sessions and transcripts
              </p>
            </div>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No assessments yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Start your first assessment to see your history here
                </p>
                <Button onClick={() => navigate("/onboarding")}>
                  Start Assessment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors"
                >
                  <CardHeader 
                    className="cursor-pointer"
                    onClick={() => handleSessionExpand(session.session_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-3">
                            Assessment Session
                            {getStatusBadge(session.status)}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(session.started_at), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(session.started_at), "h:mm a")}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                        <div className="flex items-center gap-3">
                        {reports[session.session_id] && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/report?session=${session.session_id}`);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Report
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                              disabled={deletingSession === session.session_id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this session?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the assessment session, all responses, and the report. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteSession(session.session_id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <ChevronRight 
                          className={`w-5 h-5 text-muted-foreground transition-transform ${
                            expandedSession === session.session_id ? "rotate-90" : ""
                          }`} 
                        />
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSession === session.session_id && (
                    <CardContent className="border-t border-border/50 pt-4">
                      <h4 className="font-semibold text-foreground mb-4">Transcript</h4>
                      {responses[session.session_id] ? (
                        responses[session.session_id].length > 0 ? (
                          <Accordion type="single" collapsible className="space-y-2">
                            {responses[session.session_id].map((response, index) => (
                              <AccordionItem 
                                key={response.id} 
                                value={response.id}
                                className="border border-border/50 rounded-lg px-4"
                              >
                                <AccordionTrigger className="hover:no-underline">
                                  <div className="flex items-center gap-3 text-left">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                                      {index + 1}
                                    </span>
                                    <span className="text-sm text-foreground line-clamp-1">
                                      {response.question_text}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 pb-4">
                                  <div className="space-y-4 pl-11">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Your Response</p>
                                      <p className="text-foreground bg-muted/50 p-3 rounded-lg">
                                        {response.user_response}
                                      </p>
                                    </div>
                                    {response.ai_acknowledgment && (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">AI Acknowledgment</p>
                                        <p className="text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                                          {response.ai_acknowledgment}
                                        </p>
                                      </div>
                                    )}
                                    {response.emotion_detected && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Detected emotion:</span>
                                        <span className={getEmotionColor(response.emotion_detected)}>
                                          {response.emotion_detected}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No responses recorded for this session
                          </p>
                        )
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-pulse text-muted-foreground">Loading transcript...</div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoryPage;
