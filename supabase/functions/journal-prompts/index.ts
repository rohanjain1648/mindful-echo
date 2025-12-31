import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, assessmentContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a compassionate mental health journaling assistant specializing in ADHD support. 
Generate 3 thoughtful journaling prompts based on the user's current mood and context.

Guidelines:
- Be warm, non-judgmental, and supportive
- For ADHD users, keep prompts focused and not overwhelming
- Include a mix of reflection, gratitude, and forward-looking prompts
- Make prompts specific enough to guide writing but open enough for personal expression
- If mood is low/anxious, include grounding and self-compassion prompts
- If mood is positive, include prompts to capture and remember good moments

Return a JSON object with this structure:
{
  "prompts": [
    {
      "title": "Short title",
      "prompt": "The full journaling prompt",
      "category": "reflection" | "gratitude" | "growth" | "grounding" | "celebration"
    }
  ],
  "encouragement": "A brief encouraging message for the user"
}`;

    const userMessage = `Current mood: ${mood || 'not specified'}
${assessmentContext ? `Recent assessment insights: ${assessmentContext}` : 'No recent assessment data available.'}

Generate personalized journaling prompts for this user.`;

    console.log('Generating journal prompts for mood:', mood);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    const parsed = JSON.parse(content);
    console.log('Generated prompts successfully');

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating journal prompts:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      prompts: [
        {
          title: "Today's Reflection",
          prompt: "What's one thing that happened today that you want to remember? How did it make you feel?",
          category: "reflection"
        },
        {
          title: "Gratitude Moment",
          prompt: "Name three small things you're grateful for right now, no matter how simple.",
          category: "gratitude"
        },
        {
          title: "Self-Compassion",
          prompt: "If your best friend was feeling the way you are right now, what would you say to them?",
          category: "grounding"
        }
      ],
      encouragement: "Take your time. There's no right or wrong way to journal."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
