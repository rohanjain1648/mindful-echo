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
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');

    const { text, isOmChant = false } = await req.json();

    // For OM chant, we don't need text input
    if (!text && !isOmChant) {
      throw new Error('Text is required');
    }

    const textToSpeak = isOmChant ? 'Ommmmm... Ommmmm... Ommmmm...' : text;

    console.log('[MeditationTTS] Generating audio for:', textToSpeak.substring(0, 50) + '...');
    console.log('[MeditationTTS] isOmChant:', isOmChant);

    let base64Audio = null;
    let ttsProvider = 'none';

    // Use Google Cloud TTS
    if (GOOGLE_API_KEY) {
      try {
        console.log('[MeditationTTS] Using Google Cloud TTS...');
        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text: textToSpeak },
              voice: {
                languageCode: 'en-US',
                name: 'en-US-Neural2-F', // Calm, soothing female voice
              },
              audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: isOmChant ? 0.7 : 0.85, // Slower for meditation
                pitch: isOmChant ? -3 : -1, // Lower pitch for OM
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          base64Audio = data.audioContent;
          ttsProvider = 'google';
          console.log('[MeditationTTS] Google TTS generated successfully');
        } else {
          const errorText = await response.text();
          console.error('[MeditationTTS] Google TTS error:', response.status, errorText);
        }
      } catch (err) {
        console.error('[MeditationTTS] Google TTS failed:', err);
      }
    } else {
      console.error('[MeditationTTS] GOOGLE_API_KEY not configured');
    }

    if (!base64Audio) {
      return new Response(JSON.stringify({ 
        error: 'TTS generation failed',
        text: text,
      }), {
        status: 200,
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
