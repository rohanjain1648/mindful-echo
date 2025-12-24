import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice IDs for different emotional tones
const VOICE_CONFIG = {
  default: "EXAVITQu4vr4xnSDxMaL", // Sarah - warm and supportive
  calm: "FGY2WhTYpPnrIDTdsKH5", // Laura - gentle
  encouraging: "TX3LPaxmHKxFdv7VOQHJ", // Liam - uplifting
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { text, emotion, voiceId } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Select voice based on emotion or use provided voiceId
    let selectedVoice = voiceId || VOICE_CONFIG.default;
    
    // Adjust voice settings based on detected emotion
    let stability = 0.5;
    let similarityBoost = 0.75;
    let style = 0.5;
    
    if (emotion) {
      switch (emotion.toLowerCase()) {
        case 'anxious':
        case 'stressed':
        case 'overwhelmed':
          stability = 0.7; // More stable for calming effect
          style = 0.3; // Less expressive, more soothing
          selectedVoice = VOICE_CONFIG.calm;
          break;
        case 'sad':
        case 'down':
        case 'discouraged':
          stability = 0.6;
          style = 0.4; // Gentle and warm
          selectedVoice = VOICE_CONFIG.calm;
          break;
        case 'frustrated':
        case 'angry':
          stability = 0.8; // Very stable to be grounding
          style = 0.2;
          selectedVoice = VOICE_CONFIG.calm;
          break;
        case 'hopeful':
        case 'motivated':
        case 'happy':
          stability = 0.4;
          style = 0.6; // More expressive and upbeat
          selectedVoice = VOICE_CONFIG.encouraging;
          break;
        default:
          // Keep defaults
      }
    }

    console.log(`Generating speech with voice: ${selectedVoice}, emotion: ${emotion || 'neutral'}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    return new Response(JSON.stringify({ audioContent: base64Audio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('TTS error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate speech' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
