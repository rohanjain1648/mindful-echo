import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice configurations for different emotional tones using Google TTS
const VOICE_CONFIG = {
  default: { name: 'en-US-Neural2-F', languageCode: 'en-US' }, // Warm female voice
  calm: { name: 'en-US-Neural2-C', languageCode: 'en-US' }, // Gentle voice
  encouraging: { name: 'en-US-Neural2-D', languageCode: 'en-US' }, // Uplifting voice
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const { text, emotion } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Select voice based on emotion
    let selectedVoice = VOICE_CONFIG.default;
    let speakingRate = 1.0;
    let pitch = 0;
    
    if (emotion) {
      switch (emotion.toLowerCase()) {
        case 'anxious':
        case 'stressed':
        case 'overwhelmed':
          selectedVoice = VOICE_CONFIG.calm;
          speakingRate = 0.9; // Slower for calming effect
          pitch = -1;
          break;
        case 'sad':
        case 'down':
        case 'discouraged':
          selectedVoice = VOICE_CONFIG.calm;
          speakingRate = 0.95;
          pitch = -0.5;
          break;
        case 'frustrated':
        case 'angry':
          selectedVoice = VOICE_CONFIG.calm;
          speakingRate = 0.85;
          pitch = -2;
          break;
        case 'hopeful':
        case 'motivated':
        case 'happy':
          selectedVoice = VOICE_CONFIG.encouraging;
          speakingRate = 1.05;
          pitch = 1;
          break;
        default:
          // Keep defaults
      }
    }

    console.log(`[CompanionTTS] Generating speech with Google TTS, emotion: ${emotion || 'neutral'}`);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: selectedVoice.languageCode,
            name: selectedVoice.name,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate,
            pitch,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CompanionTTS] Google TTS error:', response.status, errorText);
      throw new Error(`Google TTS error: ${response.status}`);
    }

    const data = await response.json();
    const base64Audio = data.audioContent;

    console.log('[CompanionTTS] Google TTS generated successfully');

    return new Response(JSON.stringify({ audioContent: base64Audio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CompanionTTS] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate speech' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
