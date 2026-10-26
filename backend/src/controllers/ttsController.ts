import { Request, Response } from 'express';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VALID_INDIAN_VOICES: Record<string, string> = {
  'en-IN-NeerjaExpressiveNeural': 'en-IN-NeerjaExpressiveNeural',
  'en-IN-NeerjaNeural': 'en-IN-NeerjaNeural',
  'hi-IN-SwaraNeural': 'hi-IN-SwaraNeural',
  'en-IN-PrabhatNeural': 'en-IN-PrabhatNeural',
  'hi-IN-MadhurNeural': 'hi-IN-MadhurNeural',
};

export async function handleTTS(req: Request, res: Response) {
  try {
    const { text, voice = 'en-IN-NeerjaExpressiveNeural' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const selectedVoice = VALID_INDIAN_VOICES[voice] || 'en-IN-NeerjaExpressiveNeural';
    const tts = new MsEdgeTTS();
    await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Voice-Used', selectedVoice);

    audioStream.pipe(res);
  } catch (error: any) {
    console.error('Backend TTS error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Speech synthesis failed', details: error?.message });
    }
  }
}
