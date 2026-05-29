import { NextResponse } from 'next/server';

// Simple WAV generator: returns silence for a duration derived from text length.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text: string = (body?.text) || '';

    const chars = Math.max(1, text.length);
    const durationSeconds = Math.min(60, Math.max(1, Math.ceil(chars / 50)));

    const sampleRate = 22050;
    const numSamples = sampleRate * durationSeconds;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = bytesPerSample * 1;
    const byteRate = sampleRate * blockAlign;

    // WAV header (PCM 16-bit little endian)
    const header = new ArrayBuffer(44);
    const dv = new DataView(header);
    function writeString(offset: number, str: string) {
      for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i));
    }
    writeString(0, 'RIFF');
    dv.setUint32(4, 36 + numSamples * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    dv.setUint32(16, 16, true); // subchunk1Size
    dv.setUint16(20, 1, true); // PCM
    dv.setUint16(22, 1, true); // channels
    dv.setUint32(24, sampleRate, true);
    dv.setUint32(28, byteRate, true);
    dv.setUint16(32, blockAlign, true);
    dv.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    dv.setUint32(40, numSamples * bytesPerSample, true);

    // Silence (zeros)
    const samples = new Uint8Array(numSamples * bytesPerSample);

    const wav = new Uint8Array(44 + samples.length);
    wav.set(new Uint8Array(header), 0);
    wav.set(samples, 44);

    return new NextResponse(wav, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename="audiovox-export.wav"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'failed to generate audio' }, { status: 500 });
  }
}
