import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calm, soothing voices for meditation
const MEDITATION_VOICES = {
  'sarah': 'EXAVITQu4vr4xnSDxMaL', // Warm & Supportive
  'laura': 'FGY2WhTYpPnrIDTdsKH5', // Gentle & Calm
  'lily': 'pFZP5JQG7iQjIQuC4Bku', // Soft spoken
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    const { text, voice = 'sarah', isOmChant = false } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    console.log('[MeditationTTS] Generating audio for:', text.substring(0, 50) + '...');
    console.log('[MeditationTTS] Voice:', voice, 'isOmChant:', isOmChant);

    let base64Audio = null;
    let ttsProvider = 'none';

    // For OM chanting, we use a special approach with slower, more resonant settings
    const voiceId = MEDITATION_VOICES[voice as keyof typeof MEDITATION_VOICES] || MEDITATION_VOICES.sarah;
    
    // Voice settings optimized for meditation - slower, calmer
    const meditationVoiceSettings = {
      stability: 0.85, // Very stable for calm meditation
      similarity_boost: 0.6,
      style: isOmChant ? 0.1 : 0.3, // Lower style for OM to be more monotone
      use_speaker_boost: false, // Softer delivery
    };

    // Try ElevenLabs first
    if (ELEVENLABS_API_KEY) {
      try {
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: isOmChant ? 'Ommmmm... Ommmmm... Ommmmm...' : text,
              model_id: 'eleven_multilingual_v2',
              output_format: 'mp3_44100_128',
              voice_settings: meditationVoiceSettings,
            }),
          }
        );

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          base64Audio = base64Encode(audioBuffer);
          ttsProvider = 'elevenlabs';
          console.log('[MeditationTTS] ElevenLabs audio generated successfully');
        } else {
          console.error('[MeditationTTS] ElevenLabs error:', ttsResponse.status);
        }
      } catch (err) {
        console.error('[MeditationTTS] ElevenLabs failed:', err);
      }
    }

    // Fallback to OpenAI TTS
    if (!base64Audio && OPENAI_API_KEY) {
      try {
        console.log('[MeditationTTS] Trying OpenAI TTS fallback...');
        const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1-hd', // Higher quality for meditation
            input: isOmChant ? 'Ommmmm... Ommmmm... Ommmmm...' : text,
            voice: 'nova', // Calm, soothing voice
            response_format: 'mp3',
            speed: isOmChant ? 0.7 : 0.85, // Slower for meditation, even slower for OM
          }),
        });

        if (openaiResponse.ok) {
          const audioBuffer = await openaiResponse.arrayBuffer();
          base64Audio = base64Encode(audioBuffer);
          ttsProvider = 'openai';
          console.log('[MeditationTTS] OpenAI TTS generated successfully');
        } else {
          console.error('[MeditationTTS] OpenAI TTS error:', openaiResponse.status);
        }
      } catch (err) {
        console.error('[MeditationTTS] OpenAI TTS failed:', err);
      }
    }

    if (!base64Audio) {
      return new Response(JSON.stringify({ 
        error: 'TTS generation failed',
        text: text, // Return text so frontend can use browser TTS
      }), {
        status: 200, // Still 200 so frontend can fallback gracefully
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      audioContent: base64Audio,
      ttsProvider,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[MeditationTTS] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
