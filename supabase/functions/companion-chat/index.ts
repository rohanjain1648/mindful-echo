import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
