import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supported Indian languages with their voice configurations
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', voiceId: 'EXAVITQu4vr4xnSDxMaL' },
];

// The 20 assessment questions
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

// Get system instruction for voice agent
function getSystemInstruction(language: string): string {
  return `You are a compassionate mental wellness assessment companion named Nutrail. You are conducting an ADHD assessment through voice conversation.

LANGUAGE: Respond in ${language}. Be conversational and warm.

YOUR ROLE:
- You ask 20 assessment questions one by one
- Listen to user responses with empathy
- Provide brief acknowledgments before moving to the next question
- Keep responses SHORT (1-2 sentences max for acknowledgments)
- After question 20, offer to show the assessment report

CONVERSATION FLOW:
1. Greet the user warmly and explain you'll be asking 20 questions
2. Ask questions naturally, one at a time
3. After each response, acknowledge briefly and transition to next question
4. Track which question you're on (1-20)
5. After the last question (20), say: "Thank you for sharing. I've completed the assessment. Would you like to see your detailed report now?"

IMPORTANT RULES:
- Be empathetic but concise
- Never provide medical diagnoses
- If user shows distress, offer supportive words
- Keep the conversation flowing naturally
- Use the user's name if they provide it

CURRENT QUESTIONS TO ASK (in order):
${ASSESSMENT_QUESTIONS.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}

Start by introducing yourself and asking the first question.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY || !LOVABLE_API_KEY) {
      throw new Error('Required API keys are not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { action, language, messages, sessionId, voiceId } = await req.json();

    // Get supported languages
    if (action === 'get_languages') {
      return new Response(JSON.stringify({ languages: SUPPORTED_LANGUAGES }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get questions
    if (action === 'get_questions') {
      return new Response(JSON.stringify({ questions: ASSESSMENT_QUESTIONS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process conversation and generate response
    if (action === 'chat') {
      const selectedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
      
      // Call AI to generate response
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: getSystemInstruction(selectedLanguage.name) },
            ...messages,
          ],
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error('AI gateway error');
      }

      const aiData = await aiResponse.json();
      const assistantText = aiData.choices?.[0]?.message?.content || '';

      // Generate TTS for the response
      const ttsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || selectedLanguage.voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: assistantText,
            model_id: 'eleven_multilingual_v2',
            output_format: 'mp3_44100_128',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.4,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!ttsResponse.ok) {
        console.error('TTS error:', ttsResponse.status);
        // Return text without audio if TTS fails
        return new Response(JSON.stringify({ 
          text: assistantText,
          audioContent: null,
          error: 'TTS generation failed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      const base64Audio = base64Encode(audioBuffer);

      // Check if assessment is complete
      const isComplete = assistantText.toLowerCase().includes('would you like to see your') ||
                        assistantText.toLowerCase().includes('report') && messages.length >= 40;

      return new Response(JSON.stringify({ 
        text: assistantText,
        audioContent: base64Audio,
        isComplete,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate report
    if (action === 'generate_report') {
      const reportResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert ADHD assessment analyst. Based on the conversation history, generate a comprehensive assessment report.

Return a JSON object with this exact structure:
{
  "overall_sentiment_score": 0.0-1.0,
  "primary_patterns": ["pattern1", "pattern2"],
  "strengths": ["strength1", "strength2"],
  "challenges": ["challenge1", "challenge2"],
  "category_scores": {
    "impulsivity": 0.0-1.0,
    "hyperactivity": 0.0-1.0,
    "inattention": 0.0-1.0,
    "executive_function": 0.0-1.0,
    "emotional_regulation": 0.0-1.0
  },
  "recommendations": [
    {"area": "area1", "suggestion": "suggestion1", "priority": "high|medium|low"}
  ],
  "summary": "2-3 sentence summary",
  "next_steps": ["step1", "step2"],
  "disclaimer": "This is a screening tool, not a diagnosis. Please consult a healthcare professional."
}`
            },
            ...messages,
            { role: 'user', content: 'Generate the assessment report based on our conversation.' }
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!reportResponse.ok) {
        throw new Error('Failed to generate report');
      }

      const reportData = await reportResponse.json();
      const report = JSON.parse(reportData.choices?.[0]?.message?.content || '{}');

      // Store report in database
      await supabase.from('assessment_reports').insert({
        session_id: sessionId,
        overall_sentiment_score: report.overall_sentiment_score,
        primary_patterns: report.primary_patterns,
        strengths: report.strengths,
        challenges: report.challenges,
        recommendations: report.recommendations,
        detailed_analysis: {
          category_scores: report.category_scores,
          summary: report.summary,
          next_steps: report.next_steps,
        },
      });

      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Voice assessment error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
