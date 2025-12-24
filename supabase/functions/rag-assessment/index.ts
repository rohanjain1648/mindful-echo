import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ShieldGemma-inspired safety policies for content moderation
const SAFETY_POLICIES = `
You are a content safety classifier. Evaluate the user input against these safety policies:

1. "No Dangerous Content": Content shall not contain or seek generation of content that harms oneself and/or others (e.g., firearms, explosives, terrorism, suicide instructions, self-harm methods).

2. "No Harassment": Content shall not contain malicious, intimidating, bullying, or abusive content targeting individuals (e.g., physical threats, disparaging victims).

3. "No Hate Speech": Content shall not target identity/protected attributes or dehumanize based on race, ethnicity, religion, disability, age, nationality, sexual orientation, gender, etc.

4. "No Sexually Explicit Information": Content shall not contain sexually explicit material (medical/health terms are permitted).

5. "Crisis Safety": Flag if content indicates immediate crisis (active suicidal ideation with plan, self-harm in progress).

IMPORTANT - MENTAL HEALTH CONTEXT:
- Users may discuss emotions, struggles, mental health challenges - this is ACCEPTABLE
- Discussing ADHD, anxiety, depression, past trauma is ACCEPTABLE
- Expressions of frustration, sadness, difficulty are ACCEPTABLE
- Only flag content seeking to HARM self/others or containing hate/harassment

Respond with JSON:
{
  "is_safe": boolean,
  "confidence": 0.0-1.0,
  "violated_policies": ["policy names if violated"],
  "risk_level": "none" | "low" | "medium" | "high" | "critical",
  "is_crisis": boolean,
  "reason": "Brief explanation if flagged",
  "safe_response_suggestion": "Compassionate redirect if flagged"
}
`;

// Content safety check function
async function checkContentSafety(content: string, apiKey: string): Promise<{
  is_safe: boolean;
  confidence: number;
  violated_policies: string[];
  risk_level: string;
  is_crisis: boolean;
  reason: string;
  safe_response_suggestion: string;
}> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SAFETY_POLICIES },
          { role: 'user', content: `Evaluate this user input for safety:\n\n"${content}"` }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Safety check failed:', response.status);
      return { is_safe: true, confidence: 0, violated_policies: [], risk_level: "none", is_crisis: false, reason: "", safe_response_suggestion: "" };
    }

    const data = await response.json();
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch (error) {
    console.error('Safety check error:', error);
    return { is_safe: true, confidence: 0, violated_policies: [], risk_level: "none", is_crisis: false, reason: "", safe_response_suggestion: "" };
  }
}

const CRISIS_RESOURCES = {
  message: "I care about your wellbeing. If you're in crisis, please reach out for immediate support:",
  resources: [
    { name: "988 Suicide & Crisis Lifeline", contact: "Call or text 988", region: "US" },
    { name: "Crisis Text Line", contact: "Text HOME to 741741", region: "US" },
    { name: "International Association for Suicide Prevention", contact: "https://www.iasp.info/resources/Crisis_Centres/", region: "International" }
  ]
};

// ADHD Knowledge Base extracted from the PDF
const ADHD_KNOWLEDGE_BASE = `
# ADHD PATTERNS AND CATEGORIES:
- IMPULSIVITY: Answering before questions finish, interrupting, blurting out thoughts
- HYPERACTIVITY: Fidgeting, restlessness, difficulty staying seated, constant movement
- INATTENTION/Cognitive & Attention-Related: Careless mistakes, difficulty sustaining attention, mind wandering
- Emotional Dysregulation: Difficulty controlling anger, frustration, mood swings, sensitivity to criticism
- Social & Communication: Interrupting conversations, difficulty listening, social pacing issues
- Work/School Challenges: Task avoidance, procrastination, difficulty with deadlines, organization issues
- Behavioral & Daily Life: Forgetfulness, losing items, difficulty with routines

# KEY DETECTION PATTERNS:

## 1. Interrupting/Finishing Sentences
- Parents, teachers, peers notice person often blurts out
- Impulsivity & hyperactivity: ADHD brain struggles with inhibitory control
- Working memory lapses: Fear of forgetting idea if not expressed immediately
- Dopamine-seeking: Interjecting gives quick reward hit of stimulation

## 2. Fidgeting and Restlessness
- Constantly moves hands, taps fingers, bounces legs, shifts in chair
- ADHD brains are under-stimulated; movement provides extra dopamine
- Physical motion helps maintain alertness and focus
- Executive dysfunction makes passive attention uncomfortable

## 3. Difficulty Staying Seated
- Frequently getting up, leading to discomfort during stillness
- ADHD brains have underaroused dopamine systems
- Movement provides self-regulation and maintains alertness
- Can appear as anxiety but is actually self-regulation behavior

## 4. Careless Mistakes/Attention to Details
- Typos, miscalculations, missing steps, skipped items
- Deficits in sustained and selective attention
- Brain seeks novelty, leading to mental drift during repetitive tasks
- Working memory overload causes loss of detail recall mid-task

## 5. Not Listening When Spoken To
- Mind seems elsewhere, "zoned out" during conversations
- Attention dysregulation, not defiance
- Brain involuntarily tunes out when stimulation drops
- Low dopamine and norepinephrine reduce signal-to-noise ratio

## 6. Difficulty Organizing Tasks
- Struggling to break down projects into sequential steps
- Impairment in prefrontal cortex for planning and sequencing
- Difficulty managing time, materials, and deadlines
- Poor prioritization abilities

## 7. Avoids Sustained Mental Effort
- Putting off tasks like reading, writing, form-filling
- Brain associates effort with discomfort due to dopamine deficits
- Procrastination as coping mechanism
- Difficulty with boring or low-stimulation tasks

## 8. Losing Things
- Frequently misplaces keys, phone, wallet, documents
- Working memory deficits make tracking items difficult
- Inattention to where items are placed
- Executive dysfunction affects organizational systems

## 9. Easily Distracted
- External sounds, movements, thoughts pull attention away
- ADHD brain has difficulty filtering irrelevant stimuli
- Novelty-seeking interrupts ongoing tasks
- Difficulty returning to original task after distraction

## 10. Forgetfulness in Daily Activities
- Missing appointments, forgetting commitments
- Working memory limitations
- Time blindness - poor perception of time passing
- Difficulty with prospective memory (remembering to do future tasks)

## EMOTIONAL PATTERNS:

### Rejection Sensitive Dysphoria (RSD)
- Extreme emotional sensitivity to perceived rejection or criticism
- Intense emotional pain from disapproval or exclusion
- Can trigger shame spirals, withdrawal, or anger
- Often misdiagnosed as mood disorders

### Emotional Dysregulation
- Difficulty controlling anger or frustration
- Low frustration tolerance - quick to anger over small setbacks
- Mood swings and hypersensitivity to criticism
- Emotional impulsivity - reacting before thinking

### Time Blindness
- Poor perception of time passing
- Underestimating how long tasks take
- Difficulty planning ahead
- Chronic lateness or rushing at last minute

## COPING STRATEGIES FROM KNOWLEDGE BASE:

### For Impulsivity:
- Practice waiting until others finish speaking
- Use pause techniques before responding
- Mindfulness meditation (even 10 min/day helps)
- Consistent sleep to reduce impulsivity

### For Hyperactivity:
- Keep fidget toys or stress balls available
- Use standing desks or balance cushions
- Take movement breaks every 20-30 minutes
- 30 minutes daily cardio (walking, cycling, yoga)

### For Inattention:
- Use Pomodoro technique (25 min work, 5 min break)
- Create checklists for repetitive tasks
- Use visual or tactile prompts
- Schedule important tasks during peak focus times

### For Organization:
- Use task management apps (Trello, Todoist, Asana)
- Break large projects into micro-steps
- Set reminders and alarms
- Create templates for repeated tasks

### For Emotional Regulation:
- Practice mindfulness and progressive muscle relaxation
- Use mood journaling to track triggers
- Develop pause-and-breathe techniques
- Create a calm-down toolkit (breathing exercises, grounding)
`;

// The 20 assessment questions based on ADHD symptom categories
const ASSESSMENT_QUESTIONS = [
  {
    index: 0,
    text: "How often do you find yourself interrupting others or finishing their sentences before they're done speaking?",
    category: "impulsivity",
    followUp: "Can you share a recent example of when this happened?"
  },
  {
    index: 1,
    text: "Can you describe a recent situation where you struggled to stay seated when you needed to?",
    category: "hyperactivity",
    followUp: "How did that make you feel, and what did you do to cope?"
  },
  {
    index: 2,
    text: "How would you rate your ability to focus on tasks that don't immediately interest you?",
    category: "inattention",
    followUp: "What strategies have you tried to maintain focus?"
  },
  {
    index: 3,
    text: "Tell me about your experience with starting projects versus finishing them.",
    category: "executive_function",
    followUp: "What typically happens when you're in the middle of a project?"
  },
  {
    index: 4,
    text: "How often do you feel restless or like you need to be constantly moving?",
    category: "hyperactivity",
    followUp: "What does this restlessness feel like in your body?"
  },
  {
    index: 5,
    text: "Describe how you typically handle waiting in lines or for appointments.",
    category: "impulsivity",
    followUp: "What thoughts or feelings come up during these waiting times?"
  },
  {
    index: 6,
    text: "How would you describe your sleep patterns and quality?",
    category: "daily_life",
    followUp: "Do racing thoughts or restlessness affect your ability to fall asleep?"
  },
  {
    index: 7,
    text: "Tell me about a time when you made an impulsive decision you later regretted.",
    category: "impulsivity",
    followUp: "What do you think triggered that impulsive decision?"
  },
  {
    index: 8,
    text: "How do you usually feel when faced with multiple deadlines at once?",
    category: "executive_function",
    followUp: "How do you typically prioritize when everything feels urgent?"
  },
  {
    index: 9,
    text: "Describe your experience with keeping track of important items like keys or phone.",
    category: "inattention",
    followUp: "What systems, if any, have you tried to help with this?"
  },
  {
    index: 10,
    text: "How often do you find your mind wandering during conversations?",
    category: "inattention",
    followUp: "What kind of topics or situations make this more likely to happen?"
  },
  {
    index: 11,
    text: "Tell me about your emotional reactions when things don't go as planned.",
    category: "emotional_regulation",
    followUp: "How long do these emotional reactions typically last?"
  },
  {
    index: 12,
    text: "How would you describe your ability to prioritize tasks?",
    category: "executive_function",
    followUp: "What makes prioritizing difficult for you?"
  },
  {
    index: 13,
    text: "Describe a situation where time seemed to slip away from you.",
    category: "time_blindness",
    followUp: "How often does this happen, and what are you usually doing?"
  },
  {
    index: 14,
    text: "How do you typically feel about routines and schedules?",
    category: "daily_life",
    followUp: "What happens when your routine gets disrupted?"
  },
  {
    index: 15,
    text: "Tell me about your experience with following through on commitments.",
    category: "executive_function",
    followUp: "What typically gets in the way of completing commitments?"
  },
  {
    index: 16,
    text: "How would you describe your energy levels throughout the day?",
    category: "hyperactivity",
    followUp: "Are there certain times when you feel more focused or energized?"
  },
  {
    index: 17,
    text: "Describe how criticism or rejection affects you emotionally.",
    category: "emotional_regulation",
    followUp: "How do you typically cope with these feelings?"
  },
  {
    index: 18,
    text: "How do you cope when you feel overwhelmed by responsibilities?",
    category: "emotional_regulation",
    followUp: "What signals tell you that you're becoming overwhelmed?"
  },
  {
    index: 19,
    text: "What strategies have you tried for managing focus, and how effective were they?",
    category: "coping_strategies",
    followUp: "What do you think made some strategies work better than others?"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { action, questionIndex, userResponse, sessionId, conversationHistory } = await req.json();

    if (action === 'get_questions') {
      return new Response(JSON.stringify({ questions: ASSESSMENT_QUESTIONS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'process_response') {
      // Check content safety BEFORE processing
      console.log('Checking safety for assessment response:', userResponse?.substring(0, 50));
      const safetyResult = await checkContentSafety(userResponse, LOVABLE_API_KEY);
      
      // Log moderation event
      const shouldLog = safetyResult.is_crisis || !safetyResult.is_safe || safetyResult.risk_level !== 'none';
      if (shouldLog) {
        await supabase.from('moderation_logs').insert({
          source: 'assessment',
          content_preview: userResponse?.substring(0, 200) || '',
          is_blocked: !safetyResult.is_safe && safetyResult.risk_level !== 'low',
          is_crisis: safetyResult.is_crisis,
          risk_level: safetyResult.risk_level,
          violated_policies: safetyResult.violated_policies || [],
          confidence: safetyResult.confidence,
          reason: safetyResult.reason,
          safe_response_suggestion: safetyResult.safe_response_suggestion,
          session_id: sessionId,
        });
        console.log('Logged moderation event to database');
      }
      
      // Handle crisis situations with resources
      if (safetyResult.is_crisis) {
        console.log('Crisis detected in assessment, providing resources');
        const nextQuestion = questionIndex < ASSESSMENT_QUESTIONS.length - 1 
          ? ASSESSMENT_QUESTIONS[questionIndex + 1] 
          : null;
          
        return new Response(JSON.stringify({
          acknowledgment: `${safetyResult.safe_response_suggestion || "I hear that you're going through something really difficult."} ${CRISIS_RESOURCES.message}`,
          sentiment: "concerned",
          sentiment_score: 0.3,
          emotion_detected: "distress",
          patterns_observed: ["crisis_support_needed"],
          category_relevance: "high",
          is_crisis: true,
          crisis_resources: CRISIS_RESOURCES.resources,
          nextQuestion,
          isComplete: questionIndex >= ASSESSMENT_QUESTIONS.length - 1
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Block harmful content
      if (!safetyResult.is_safe && safetyResult.risk_level !== 'low') {
        console.log('Harmful content blocked in assessment:', safetyResult.violated_policies);
        const nextQuestion = questionIndex < ASSESSMENT_QUESTIONS.length - 1 
          ? ASSESSMENT_QUESTIONS[questionIndex + 1] 
          : null;
          
        return new Response(JSON.stringify({
          acknowledgment: safetyResult.safe_response_suggestion || "Let's refocus on understanding your experiences. Would you like to share more about how you've been feeling?",
          sentiment: "neutral",
          sentiment_score: 0.5,
          emotion_detected: "neutral",
          patterns_observed: [],
          category_relevance: "low",
          content_blocked: true,
          nextQuestion,
          isComplete: questionIndex >= ASSESSMENT_QUESTIONS.length - 1
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const currentQuestion = ASSESSMENT_QUESTIONS[questionIndex];
      
      // Build context from conversation history
      const historyContext = conversationHistory?.length > 0 
        ? `Previous conversation:\n${conversationHistory.map((h: any) => 
            `Q: ${h.question}\nUser: ${h.response}`
          ).join('\n\n')}\n\n`
        : '';

      const systemPrompt = `You are a compassionate, evidence-based mental health assessment AI specializing in ADHD and mental wellness. 
Your role is to:
1. Listen empathetically to user responses
2. Acknowledge their experiences with warmth and understanding
3. Ask clarifying follow-up questions when helpful
4. Identify ADHD-related patterns based on the knowledge base

ADHD KNOWLEDGE BASE:
${ADHD_KNOWLEDGE_BASE}

CURRENT ASSESSMENT CONTEXT:
- This is question ${questionIndex + 1} of 20
- Question Category: ${currentQuestion.category}
- Question Asked: "${currentQuestion.text}"

RESPONSE GUIDELINES:
- Be warm, empathetic, and non-judgmental
- Acknowledge what the user shared
- If their response indicates ADHD patterns, gently note relevant observations
- Keep responses concise (2-3 sentences for acknowledgment)
- Do NOT diagnose - only observe patterns
- End with a brief, supportive transition to the next question

OUTPUT FORMAT:
Respond with JSON containing:
{
  "acknowledgment": "Your empathetic response acknowledging what they shared",
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "sentiment_score": 0.0-1.0 (0 = very negative, 1 = very positive),
  "emotion_detected": "primary emotion observed (e.g., frustration, anxiety, hope, resignation)",
  "patterns_observed": ["array of ADHD-related patterns detected"],
  "category_relevance": "how relevant this response is to ADHD assessment (high/medium/low)"
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${historyContext}User's response to the current question: "${userResponse}"` }
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Usage limit reached. Please try again later.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content;
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch {
        parsedResponse = {
          acknowledgment: "Thank you for sharing that with me. I appreciate your openness.",
          sentiment: "neutral",
          sentiment_score: 0.5,
          emotion_detected: "neutral",
          patterns_observed: [],
          category_relevance: "medium"
        };
      }

      // Get next question if not at the end
      const nextQuestion = questionIndex < ASSESSMENT_QUESTIONS.length - 1 
        ? ASSESSMENT_QUESTIONS[questionIndex + 1] 
        : null;

      return new Response(JSON.stringify({
        ...parsedResponse,
        nextQuestion,
        isComplete: questionIndex >= ASSESSMENT_QUESTIONS.length - 1
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate_report') {
      const systemPrompt = `You are an expert mental health analyst specializing in ADHD assessment.
Based on the user's responses throughout the assessment, generate a comprehensive but supportive report.

ADHD KNOWLEDGE BASE:
${ADHD_KNOWLEDGE_BASE}

ASSESSMENT RESPONSES:
${conversationHistory.map((h: any, i: number) => 
  `Q${i + 1}: ${h.question}\nResponse: ${h.response}\nSentiment: ${h.sentiment}\nPatterns: ${h.patterns?.join(', ') || 'None noted'}`
).join('\n\n')}

Generate a comprehensive report in JSON format:
{
  "overall_sentiment_score": 0.0-1.0,
  "primary_patterns": ["top 3-5 ADHD-related patterns observed"],
  "strengths": ["3-5 strengths the person demonstrated"],
  "challenges": ["3-5 main challenges they face"],
  "category_scores": {
    "impulsivity": 0-10,
    "hyperactivity": 0-10,
    "inattention": 0-10,
    "emotional_regulation": 0-10,
    "executive_function": 0-10,
    "time_management": 0-10
  },
  "recommendations": [
    {
      "area": "category name",
      "suggestion": "specific actionable recommendation",
      "priority": "high/medium/low"
    }
  ],
  "summary": "A warm, supportive 2-3 paragraph summary of findings",
  "next_steps": ["3-5 suggested next steps"],
  "disclaimer": "Standard disclaimer about this not being a diagnosis"
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Please generate the comprehensive assessment report based on the responses provided.' }
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Report generation error:', response.status, errorText);
        throw new Error(`Failed to generate report: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content;
      
      let report;
      try {
        report = JSON.parse(content);
      } catch {
        report = {
          overall_sentiment_score: 0.5,
          primary_patterns: ["Unable to analyze patterns"],
          strengths: ["Completed the assessment"],
          challenges: ["Unable to determine specific challenges"],
          category_scores: {},
          recommendations: [],
          summary: "Thank you for completing the assessment. Please consult with a healthcare professional for a comprehensive evaluation.",
          next_steps: ["Consult with a healthcare professional"],
          disclaimer: "This assessment is not a diagnosis. Please consult with a qualified healthcare professional."
        };
      }

      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAG assessment error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
