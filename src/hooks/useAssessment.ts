import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  index: number;
  text: string;
  category: string;
  followUp: string;
}

interface ConversationEntry {
  question: string;
  response: string;
  sentiment?: string;
  sentiment_score?: number;
  emotion_detected?: string;
  patterns?: string[];
}

interface AssessmentResponse {
  acknowledgment: string;
  sentiment: string;
  sentiment_score: number;
  emotion_detected: string;
  patterns_observed: string[];
  category_relevance: string;
  nextQuestion?: Question;
  isComplete: boolean;
}

interface AssessmentReport {
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

export const useAssessment = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const { toast } = useToast();

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'get_questions' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assessment questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const processResponse = useCallback(async (userResponse: string): Promise<AssessmentResponse | null> => {
    if (!questions[currentQuestionIndex]) return null;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'process_response',
            questionIndex: currentQuestionIndex,
            userResponse,
            sessionId,
            conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast({
            title: 'Rate Limited',
            description: 'Please wait a moment before continuing.',
            variant: 'destructive',
          });
          return null;
        }
        throw new Error(errorData.error || 'Failed to process response');
      }

      const data: AssessmentResponse = await response.json();

      // Add to conversation history
      const newEntry: ConversationEntry = {
        question: questions[currentQuestionIndex].text,
        response: userResponse,
        sentiment: data.sentiment,
        sentiment_score: data.sentiment_score,
        emotion_detected: data.emotion_detected,
        patterns: data.patterns_observed,
      };
      setConversationHistory(prev => [...prev, newEntry]);

      // Store in database
      await supabase.from('assessment_responses').insert({
        session_id: sessionId,
        question_index: currentQuestionIndex,
        question_text: questions[currentQuestionIndex].text,
        user_response: userResponse,
        ai_acknowledgment: data.acknowledgment,
        sentiment_score: data.sentiment_score,
        emotion_detected: data.emotion_detected,
      });

      return data;
    } catch (error) {
      console.error('Error processing response:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your response. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [questions, currentQuestionIndex, sessionId, conversationHistory, toast]);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const skipQuestion = useCallback(() => {
    // Add empty entry to history
    if (questions[currentQuestionIndex]) {
      const newEntry: ConversationEntry = {
        question: questions[currentQuestionIndex].text,
        response: '[Skipped]',
        sentiment: 'neutral',
        sentiment_score: 0.5,
      };
      setConversationHistory(prev => [...prev, newEntry]);
    }
    goToNextQuestion();
  }, [questions, currentQuestionIndex, goToNextQuestion]);

  const generateReport = useCallback(async (): Promise<AssessmentReport | null> => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rag-assessment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'generate_report',
            sessionId,
            conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const reportData: AssessmentReport = await response.json();
      setReport(reportData);

      // Store report in database
      await supabase.from('assessment_reports').insert({
        session_id: sessionId,
        overall_sentiment_score: reportData.overall_sentiment_score,
        primary_patterns: reportData.primary_patterns,
        strengths: reportData.strengths,
        challenges: reportData.challenges,
        recommendations: reportData.recommendations,
        detailed_analysis: {
          category_scores: reportData.category_scores,
          summary: reportData.summary,
          next_steps: reportData.next_steps,
        },
      });

      // Update session as completed
      await supabase.from('assessment_sessions').upsert({
        session_id: sessionId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      return reportData;
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate your report. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, conversationHistory, toast]);

  const currentQuestion = questions[currentQuestionIndex];
  const isComplete = currentQuestionIndex >= questions.length && questions.length > 0;
  const progress = questions.length > 0 
    ? ((currentQuestionIndex + 1) / questions.length) * 100 
    : 0;

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    conversationHistory,
    isLoading,
    isProcessing,
    isComplete,
    progress,
    sessionId,
    report,
    fetchQuestions,
    processResponse,
    goToNextQuestion,
    skipQuestion,
    generateReport,
  };
};
