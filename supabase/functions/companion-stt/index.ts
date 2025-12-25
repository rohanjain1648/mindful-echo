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
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    const { audio, languageCode = 'en-US' } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('[CompanionSTT] Processing audio with Google Speech-to-Text...');

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: languageCode,
            enableAutomaticPunctuation: true,
            model: 'latest_long',
            alternativeLanguageCodes: ['hi-IN', 'ta-IN', 'te-IN', 'kn-IN', 'bn-IN', 'mr-IN', 'gu-IN', 'ml-IN', 'pa-IN'],
          },
          audio: {
            content: audio,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CompanionSTT] Google STT error:', response.status, errorText);
      throw new Error(`Google STT error: ${response.status}`);
    }

    const result = await response.json();
    const transcript = result.results?.[0]?.alternatives?.[0]?.transcript || '';
    
    console.log('[CompanionSTT] Transcription successful:', transcript.substring(0, 50) + '...');

    return new Response(JSON.stringify({ text: transcript }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CompanionSTT] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Transcription failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
