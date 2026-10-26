if (typeof process !== 'undefined') {
  process.env.WS_NO_BUFFER_UTIL = '1';
}

import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { cleanTextForSpeech } from '@/lib/llm';

// Supported natural Indian voices
const VALID_INDIAN_VOICES: Record<string, string> = {
  'en-IN-NeerjaExpressiveNeural': 'en-IN-NeerjaExpressiveNeural',
  'en-IN-NeerjaNeural': 'en-IN-NeerjaNeural',
  'hi-IN-SwaraNeural': 'hi-IN-SwaraNeural',
  'en-IN-PrabhatNeural': 'en-IN-PrabhatNeural',
  'hi-IN-MadhurNeural': 'hi-IN-MadhurNeural',
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, voice = 'en-IN-NeerjaExpressiveNeural' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText.trim()) {
      return NextResponse.json({ error: 'No speakable text' }, { status: 400 });
    }

    // Select valid Indian voice or fallback to Neerja Expressive
    const selectedVoice = VALID_INDIAN_VOICES[voice] || 'en-IN-NeerjaExpressiveNeural';

    const tts = new MsEdgeTTS();
    await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanedText);

    const chunks: Uint8Array[] = [];

    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(new Uint8Array(chunk));
      });
      audioStream.on('end', () => resolve());
      audioStream.on('error', (err: any) => reject(err));
    });

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const audioBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const outputBuffer = Buffer.from(audioBuffer);

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400',
        'X-Voice-Used': selectedVoice,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/tts:', error);
    return NextResponse.json(
      { error: 'Speech synthesis failed', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
