import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ShieldGemma-inspired safety policies
const SAFETY_POLICIES = `
You are a content safety classifier. Evaluate the user input against these safety policies:

1. "No Dangerous Content": The content shall not contain or seek generation of content that harms oneself and/or others (e.g., accessing or building firearms and explosive devices, promotion of terrorism, instructions for suicide, self-harm methods).

2. "No Harassment": The content shall not contain or seek generation of content that is malicious, intimidating, bullying, or abusive targeting another individual (e.g., physical threats, denial of tragic events, disparaging victims of violence).

3. "No Hate Speech": The content shall not contain or seek generation of content targeting identity and/or protected attributes (e.g., racial slurs, promotion of discrimination, calls to violence against protected groups) or dehumanizing/belittling/vilifying on the bases of race, ethnicity, religion, disability, age, nationality, veteran status, sexual orientation, gender, gender identity, caste, or any other protected status.

4. "No Sexually Explicit Information": The content shall not contain or seek generation of sexually explicit content (e.g., sexually graphic descriptions, content aimed at causing arousal). Medical or scientific terms related to human anatomy or health education are permitted.

5. "Crisis Safety": For mental health applications - if content indicates immediate crisis (active suicidal ideation with plan, self-harm in progress), flag for crisis intervention resources.

IMPORTANT CONTEXT FOR MENTAL HEALTH APPS:
- This is a mental health support application
- Users may discuss difficult emotions, past struggles, and mental health challenges
- Discussing ADHD symptoms, anxiety, depression, past trauma is ACCEPTABLE
- Expressions of frustration, sadness, or difficulty are ACCEPTABLE
- Seeking support for mental health challenges is ACCEPTABLE
- Only flag content that seeks to HARM self/others or contains hate/harassment

Respond with JSON:
{
  "is_safe": boolean,
  "confidence": 0.0-1.0,
  "violated_policies": ["list of violated policy names, empty if safe"],
  "risk_level": "none" | "low" | "medium" | "high" | "critical",
  "is_crisis": boolean,
  "reason": "Brief explanation if flagged, empty if safe",
  "safe_response_suggestion": "If flagged, suggest a compassionate redirect"
}
`;

export async function checkContentSafety(
  content: string, 
  LOVABLE_API_KEY: string
): Promise<{
  is_safe: boolean;
  confidence: number;
  violated_policies: string[];
  risk_level: string;
  is_crisis: boolean;
  reason: string;
  safe_response_suggestion: string;
}> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
    console.error('Content safety check failed:', response.status);
    // Fail open but log - allow content through if safety check fails
    return {
      is_safe: true,
      confidence: 0,
      violated_policies: [],
      risk_level: "none",
      is_crisis: false,
      reason: "",
      safe_response_suggestion: ""
    };
  }

  const data = await response.json();
  const content_result = data.choices?.[0]?.message?.content;

  try {
    return JSON.parse(content_result);
  } catch {
    return {
      is_safe: true,
      confidence: 0,
      violated_policies: [],
      risk_level: "none",
      is_crisis: false,
      reason: "",
      safe_response_suggestion: ""
    };
  }
}

// Crisis resources to provide when needed
const CRISIS_RESOURCES = {
  message: "I care about your wellbeing. If you're in crisis, please reach out for immediate support:",
  resources: [
    { name: "988 Suicide & Crisis Lifeline", contact: "Call or text 988", region: "US" },
    { name: "Crisis Text Line", contact: "Text HOME to 741741", region: "US" },
    { name: "International Association for Suicide Prevention", contact: "https://www.iasp.info/resources/Crisis_Centres/", region: "International" }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { content, action } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check') {
      const result = await checkContentSafety(content, LOVABLE_API_KEY);
      
      // Add crisis resources if crisis detected
      if (result.is_crisis) {
        return new Response(JSON.stringify({
          ...result,
          crisis_resources: CRISIS_RESOURCES
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Content guardrails error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
