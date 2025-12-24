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

// ADHD support knowledge base for companion responses
const COMPANION_KNOWLEDGE = `
You are a compassionate AI companion specializing in ADHD and mental wellness support. You have long-term memory of past conversations and use this to provide personalized, contextual support.

KEY PRINCIPLES:
1. Always be warm, empathetic, and non-judgmental
2. Reference past conversations and memories when relevant
3. Suggest evidence-based strategies from the toolkit
4. Guide users through grounding exercises when they're overwhelmed
5. Celebrate wins and acknowledge struggles
6. Use emotional TTS cues to convey appropriate tone

ADHD-SPECIFIC STRATEGIES:
- Pomodoro Technique: 25-min work, 5-min break cycles
- Body Doubling: Working alongside others for accountability
- Time Boxing: Setting external timers and visual cues
- Task Chunking: Breaking large tasks into micro-steps
- Dopamine Menu: List of healthy stimulating activities
- Environment Design: Reducing distractions, organizing spaces
- Movement Breaks: Short physical activity to reset focus
- Mindfulness: Brief grounding exercises for emotional regulation

GROUNDING EXERCISES:
- 4-7-8 Breathing: Inhale 4s, hold 7s, exhale 8s
- 5-4-3-2-1 Sensory: 5 see, 4 touch, 3 hear, 2 smell, 1 taste
- Body Scan: Progressive relaxation from head to toe
- Quick Movement Reset: Shake, roll shoulders, breathe, stretch
- Task Anchoring: Write ONE task, set timer, focus, break

EMOTIONAL RESPONSES:
- For anxiety/stress: Calm, slow-paced, grounding focus
- For frustration: Validating, solution-focused, patient
- For sadness: Warm, supportive, gentle encouragement
- For overwhelm: Structured, step-by-step, breaking things down
- For motivation: Encouraging, celebratory, momentum-building
`;

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

    const { action, sessionId, message, conversationHistory } = await req.json();

    if (action === 'get_memories') {
      // Fetch long-term memories ordered by importance and recency
      const { data: memories } = await supabase
        .from('companion_memories')
        .select('*')
        .order('importance_score', { ascending: false })
        .order('last_referenced_at', { ascending: false })
        .limit(20);

      // Fetch successful strategies
      const { data: strategies } = await supabase
        .from('companion_strategies')
        .select('*')
        .order('effectiveness_rating', { ascending: false })
        .limit(10);

      // Fetch grounding exercises
      const { data: exercises } = await supabase
        .from('grounding_exercises')
        .select('*');

      return new Response(JSON.stringify({ 
        memories: memories || [], 
        strategies: strategies || [],
        exercises: exercises || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'chat') {
      // Check content safety BEFORE processing
      console.log('Checking content safety for message:', message?.substring(0, 50));
      const safetyResult = await checkContentSafety(message, LOVABLE_API_KEY);
      
      // Log moderation event
      const shouldLog = safetyResult.is_crisis || !safetyResult.is_safe || safetyResult.risk_level !== 'none';
      if (shouldLog) {
        await supabase.from('moderation_logs').insert({
          source: 'companion',
          content_preview: message?.substring(0, 200) || '',
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
        console.log('Crisis detected, providing resources');
        return new Response(JSON.stringify({
          response: `${safetyResult.safe_response_suggestion || "I hear that you're going through something really difficult right now."} ${CRISIS_RESOURCES.message}`,
          emotion: "gentle",
          is_crisis: true,
          crisis_resources: CRISIS_RESOURCES.resources,
          detected_user_emotion: "distress",
          should_save_memory: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Block harmful content
      if (!safetyResult.is_safe && safetyResult.risk_level !== 'low') {
        console.log('Harmful content blocked:', safetyResult.violated_policies);
        return new Response(JSON.stringify({
          response: safetyResult.safe_response_suggestion || "I'm here to support your mental wellness journey. Let's focus on how I can help you feel better today.",
          emotion: "calm",
          content_blocked: true,
          blocked_reason: safetyResult.reason,
          detected_user_emotion: "neutral",
          should_save_memory: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch relevant memories for context
      const { data: memories } = await supabase
        .from('companion_memories')
        .select('*')
        .order('importance_score', { ascending: false })
        .limit(10);

      const { data: strategies } = await supabase
        .from('companion_strategies')
        .select('*')
        .order('effectiveness_rating', { ascending: false })
        .limit(5);

      // Build memory context
      const memoryContext = memories && memories.length > 0 
        ? `\n\nLONG-TERM MEMORIES ABOUT THIS USER:\n${memories.map(m => 
            `- [${m.memory_type}] ${m.content} (importance: ${m.importance_score}/10)`
          ).join('\n')}`
        : '';

      const strategyContext = strategies && strategies.length > 0
        ? `\n\nSTRATEGIES THAT HAVE WORKED FOR THIS USER:\n${strategies.map(s => 
            `- ${s.strategy_name}: ${s.description} (effectiveness: ${s.effectiveness_rating}/10)`
          ).join('\n')}`
        : '';

      // Build conversation history context
      const historyContext = conversationHistory?.length > 0 
        ? `\n\nRECENT CONVERSATION:\n${conversationHistory.slice(-10).map((h: any) => 
            `${h.role === 'user' ? 'User' : 'Companion'}: ${h.content}`
          ).join('\n')}`
        : '';

      const systemPrompt = `${COMPANION_KNOWLEDGE}
${memoryContext}
${strategyContext}
${historyContext}

RESPONSE GUIDELINES:
- Keep responses conversational and supportive (2-4 sentences usually)
- Reference memories when relevant ("I remember you mentioned...")
- Suggest strategies from the toolkit when appropriate
- Offer grounding exercises when user seems distressed
- Use emotional cues for TTS (indicate the emotional tone)
- Ask follow-up questions to deepen understanding
- Celebrate progress and acknowledge effort

OUTPUT FORMAT (JSON):
{
  "response": "Your empathetic response text here",
  "emotion": "the primary emotion to convey (calm/encouraging/warm/gentle/uplifting)",
  "detected_user_emotion": "user's apparent emotional state",
  "should_save_memory": boolean,
  "memory_to_save": {
    "type": "experience|preference|strategy|trigger|strength|challenge|insight",
    "content": "what to remember",
    "importance": 1-10,
    "tags": ["relevant", "tags"]
  },
  "suggest_exercise": boolean,
  "suggested_exercise_category": "breathing|grounding|sensory|movement|cognitive|null"
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
            { role: 'user', content: message }
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
            status: 429,
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
          response: "I'm here with you. How are you feeling right now?",
          emotion: "warm",
          detected_user_emotion: "neutral",
          should_save_memory: false,
        };
      }

      // Save memory if indicated
      if (parsedResponse.should_save_memory && parsedResponse.memory_to_save) {
        const mem = parsedResponse.memory_to_save;
        await supabase.from('companion_memories').insert({
          memory_type: mem.type || 'insight',
          content: mem.content,
          emotional_context: parsedResponse.detected_user_emotion,
          importance_score: mem.importance || 5,
          source_session_id: sessionId,
          tags: mem.tags || [],
        });
        console.log('Saved new memory:', mem.content);
      }

      // Save message to conversation history
      await supabase.from('companion_messages').insert([
        {
          session_id: sessionId,
          role: 'user',
          content: message,
          emotion_detected: parsedResponse.detected_user_emotion,
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: parsedResponse.response,
          emotion_detected: parsedResponse.emotion,
        }
      ]);

      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_exercise') {
      const { category } = await req.json();
      
      let query = supabase.from('grounding_exercises').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data: exercises } = await query.limit(1);
      
      return new Response(JSON.stringify({ exercise: exercises?.[0] || null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save_strategy_feedback') {
      const { strategyId, wasSuccessful } = await req.json();
      
      if (strategyId) {
        // Update strategy effectiveness
        const { data: strategy } = await supabase
          .from('companion_strategies')
          .select('*')
          .eq('id', strategyId)
          .single();
          
        if (strategy) {
          const newTimesSuccessful = wasSuccessful 
            ? (strategy.times_successful || 0) + 1 
            : strategy.times_successful || 0;
          const newTimesSuggested = (strategy.times_suggested || 0) + 1;
          const newRating = Math.round((newTimesSuccessful / newTimesSuggested) * 10);
          
          await supabase
            .from('companion_strategies')
            .update({
              times_suggested: newTimesSuggested,
              times_successful: newTimesSuccessful,
              effectiveness_rating: Math.max(1, Math.min(10, newRating)),
              last_used_at: new Date().toISOString(),
            })
            .eq('id', strategyId);
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Companion chat error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
