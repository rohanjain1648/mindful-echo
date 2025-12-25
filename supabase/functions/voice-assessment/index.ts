import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supported Indian languages with their Google TTS voice configurations
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', googleVoice: 'en-US-Neural2-F' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', googleVoice: 'hi-IN-Neural2-A' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', googleVoice: 'ta-IN-Neural2-A' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', googleVoice: 'te-IN-Standard-A' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', googleVoice: 'kn-IN-Standard-A' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', googleVoice: 'bn-IN-Standard-A' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', googleVoice: 'mr-IN-Standard-A' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', googleVoice: 'gu-IN-Standard-A' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', googleVoice: 'ml-IN-Standard-A' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', googleVoice: 'pa-IN-Standard-A' },
];

// Google TTS voice mapping for different assistant personalities
const VOICE_PERSONALITIES: Record<string, Record<string, string>> = {
  'sarah': { // Warm & Supportive - Female
    'en': 'en-US-Neural2-F',
    'hi': 'hi-IN-Neural2-A',
    'ta': 'ta-IN-Neural2-A',
    'te': 'te-IN-Standard-A',
    'kn': 'kn-IN-Standard-A',
    'bn': 'bn-IN-Standard-A',
    'mr': 'mr-IN-Standard-A',
    'gu': 'gu-IN-Standard-A',
    'ml': 'ml-IN-Standard-A',
    'pa': 'pa-IN-Standard-A',
  },
  'laura': { // Gentle & Calm - Female
    'en': 'en-US-Neural2-C',
    'hi': 'hi-IN-Neural2-D',
    'ta': 'ta-IN-Neural2-C',
    'te': 'te-IN-Standard-B',
    'kn': 'kn-IN-Standard-B',
    'bn': 'bn-IN-Standard-B',
    'mr': 'mr-IN-Standard-B',
    'gu': 'gu-IN-Standard-B',
    'ml': 'ml-IN-Standard-B',
    'pa': 'pa-IN-Standard-B',
  },
  'liam': { // Encouraging - Male
    'en': 'en-US-Neural2-D',
    'hi': 'hi-IN-Neural2-B',
    'ta': 'ta-IN-Neural2-B',
    'te': 'te-IN-Standard-A',
    'kn': 'kn-IN-Standard-A',
    'bn': 'bn-IN-Standard-A',
    'mr': 'mr-IN-Standard-A',
    'gu': 'gu-IN-Standard-A',
    'ml': 'ml-IN-Standard-A',
    'pa': 'pa-IN-Standard-A',
  },
  'george': { // Professional - Male
    'en': 'en-US-Neural2-J',
    'hi': 'hi-IN-Neural2-C',
    'ta': 'ta-IN-Neural2-D',
    'te': 'te-IN-Standard-B',
    'kn': 'kn-IN-Standard-B',
    'bn': 'bn-IN-Standard-B',
    'mr': 'mr-IN-Standard-B',
    'gu': 'gu-IN-Standard-B',
    'ml': 'ml-IN-Standard-B',
    'pa': 'pa-IN-Standard-B',
  },
};

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
function getSystemInstruction(language: string, isFirstMessage: boolean, currentQuestionIndex: number): string {
  const baseInstruction = `You are a compassionate mental wellness assessment companion named Nutrail. You are conducting an ADHD assessment through voice conversation.

LANGUAGE: Respond in ${language}. Be conversational and warm.

YOUR ROLE:
- You ask 20 assessment questions one by one
- Listen to user responses with empathy
- Provide brief acknowledgments before moving to the next question
- Keep responses SHORT (1-2 sentences max for acknowledgments)
- After question 20, offer to show the assessment report

QUESTIONS TO ASK (in order):
${ASSESSMENT_QUESTIONS.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}

IMPORTANT RULES:
- Be empathetic but concise
- Never provide medical diagnoses
- NEVER repeat a question you already asked
- NEVER re-introduce yourself after the first message
- If user shows distress, offer supportive words
- Keep the conversation flowing naturally`;

  if (isFirstMessage) {
    return baseInstruction + `

THIS IS THE START OF THE CONVERSATION:
- Greet the user warmly and briefly explain you'll be asking 20 questions about their experiences
- Then ask ONLY Question 1: "${ASSESSMENT_QUESTIONS[0].text}"
- Do NOT ask multiple questions at once`;
  } else {
    return baseInstruction + `

CURRENT STATUS:
- You have already introduced yourself and started the assessment
- You are now on Question ${currentQuestionIndex + 1} of 20
- DO NOT re-introduce yourself or repeat the greeting
- DO NOT repeat any previous questions
- Briefly acknowledge the user's previous response (1-2 sentences max)
- Then ask the NEXT question: "${ASSESSMENT_QUESTIONS[Math.min(currentQuestionIndex, 19)]?.text || 'Thank you for completing the assessment. Would you like to see your detailed report now?'}"
${currentQuestionIndex >= 20 ? '\n- The assessment is complete. Ask if they would like to see their detailed report.' : ''}`;
  }
}

// Generate TTS using Google Cloud TTS
async function generateGoogleTTS(text: string, languageCode: string, voiceName: string, apiKey: string): Promise<string | null> {
  try {
    console.log('[VoiceAssessment] Using Google Cloud TTS...');
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: languageCode,
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95, // Slightly slower for clarity
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VoiceAssessment] Google TTS error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[VoiceAssessment] Google TTS generated successfully');
    return data.audioContent; // Already base64 encoded
  } catch (err) {
    console.error('[VoiceAssessment] Google TTS failed:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!GOOGLE_API_KEY || !LOVABLE_API_KEY) {
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
      const messageCount = messages.length;
      const questionIndex = Math.floor(messageCount / 2);
      
      // Create session on first message
      if (messageCount <= 1 && sessionId) {
        console.log('[VoiceAssessment] Creating session:', sessionId);
        const { data: existingSession } = await supabase
          .from('assessment_sessions')
          .select('id')
          .eq('session_id', sessionId)
          .maybeSingle();
        
        if (!existingSession) {
          const { error: sessionError } = await supabase.from('assessment_sessions').insert({
            session_id: sessionId,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            total_questions: 20,
          });
          
          if (sessionError) {
            console.error('[VoiceAssessment] Session creation error:', sessionError);
          } else {
            console.log('[VoiceAssessment] Session created successfully');
          }
        } else {
          console.log('[VoiceAssessment] Session already exists');
        }
      }
      
      const isFirstMessage = messages.length <= 1;
      const currentQuestionIndex = Math.floor((messages.length - 1) / 2);
      
      console.log('[VoiceAssessment] isFirstMessage:', isFirstMessage, 'currentQuestionIndex:', currentQuestionIndex);
      
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
            { role: 'system', content: getSystemInstruction(selectedLanguage.name, isFirstMessage, currentQuestionIndex) },
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
      console.log('[VoiceAssessment] AI response:', assistantText.substring(0, 100));

      // Generate TTS using Google Cloud TTS with selected voice personality
      const googleLanguageCode = selectedLanguage.code === 'en' ? 'en-US' : `${selectedLanguage.code}-IN`;
      
      // Get the voice based on selected personality (sarah, laura, liam, george) and language
      const voicePersonality = voiceId?.toLowerCase() || 'sarah';
      const voiceMap = VOICE_PERSONALITIES[voicePersonality] || VOICE_PERSONALITIES['sarah'];
      const googleVoiceName = voiceMap[selectedLanguage.code] || voiceMap['en'] || 'en-US-Neural2-F';
      
      console.log('[VoiceAssessment] Using voice:', voicePersonality, '->', googleVoiceName);
      
      const base64Audio = await generateGoogleTTS(
        assistantText,
        googleLanguageCode,
        googleVoiceName,
        GOOGLE_API_KEY
      );

      let ttsError = null;
      let ttsProvider = 'none';
      
      if (base64Audio) {
        ttsProvider = 'google';
      } else {
        ttsError = 'Google TTS generation failed';
      }

      // Check if assessment is complete
      const isComplete = messageCount >= 40 || 
                        assistantText.toLowerCase().includes('would you like to see your') ||
                        (assistantText.toLowerCase().includes('report') && messageCount >= 38);

      // Analyze sentiment
      let sentiment = 0;
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content?.toLowerCase() || '';
      
      const positiveWords = ['good', 'great', 'well', 'fine', 'okay', 'better', 'easy', 'rarely', 'sometimes'];
      const negativeWords = ['bad', 'hard', 'difficult', 'struggle', 'always', 'never', 'terrible', 'awful', 'constantly', 'often'];
      
      const posCount = positiveWords.filter(w => lastUserMessage.includes(w)).length;
      const negCount = negativeWords.filter(w => lastUserMessage.includes(w)).length;
      
      if (posCount > negCount) sentiment = 1;
      else if (negCount > posCount) sentiment = -1;

      // Store user response in assessment_responses
      const userMessages = messages.filter((m: any) => m.role === 'user');
      const userMessageCount = userMessages.length;
      
      if (sessionId && userMessageCount >= 2) {
        const userResponse = userMessages[userMessages.length - 1]?.content || '';
        const answerQuestionIndex = userMessageCount - 2;
        const currentQuestion = ASSESSMENT_QUESTIONS[answerQuestionIndex];
        
        if (currentQuestion && userResponse && userResponse.toLowerCase() !== 'start the assessment') {
          let emotionDetected = 'neutral';
          if (sentiment === 1) emotionDetected = 'positive';
          else if (sentiment === -1) emotionDetected = 'concerned';
          if (lastUserMessage.includes('frustrat')) emotionDetected = 'frustrated';
          if (lastUserMessage.includes('stress') || lastUserMessage.includes('overwhelm')) emotionDetected = 'stressed';
          if (lastUserMessage.includes('anxious') || lastUserMessage.includes('worry')) emotionDetected = 'anxious';

          console.log('[VoiceAssessment] Saving response for question index:', answerQuestionIndex);
          const { error: responseError } = await supabase.from('assessment_responses').insert({
            session_id: sessionId,
            question_index: answerQuestionIndex,
            question_text: currentQuestion.text,
            user_response: userResponse,
            ai_acknowledgment: assistantText.substring(0, 200),
            emotion_detected: emotionDetected,
            sentiment_score: sentiment,
          });
          
          if (responseError) {
            console.error('[VoiceAssessment] Response save error:', responseError);
          }
        }
      }

      // Update session if complete
      if (isComplete && sessionId) {
        await supabase
          .from('assessment_sessions')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId);
      }

      return new Response(JSON.stringify({ 
        text: assistantText,
        audioContent: base64Audio,
        isComplete,
        sentiment,
        questionIndex,
        ttsError,
        ttsProvider,
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
              content: `You are a mental health assessment analyzer. Based on the conversation transcript provided, generate a structured report with:
1. Overall observation
2. Key patterns identified
3. Areas of strength
4. Areas of concern
5. Recommendations

Be empathetic and non-diagnostic. Use professional but accessible language.` 
            },
            { role: 'user', content: `Analyze this assessment conversation and provide a report:\n\n${JSON.stringify(messages)}` },
          ],
        }),
      });

      if (!reportResponse.ok) {
        throw new Error('Failed to generate report');
      }

      const reportData = await reportResponse.json();
      const report = reportData.choices?.[0]?.message?.content || 'Unable to generate report';

      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[VoiceAssessment] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
