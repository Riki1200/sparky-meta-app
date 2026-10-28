/**
 * Audio processing utilities for Meta Muse Voice Transcribe (muse-voice-transcribe-1.0).
 * Prepares 16-bit PCM mono WAV at 16,000 Hz, strictly conforming to Meta API requirements.
 */

function writeAsciiString(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Encodes Float32 audio samples (-1.0 to 1.0) into a canonical 16-bit PCM mono WAV buffer.
 */
export function encodeFloat32To16BitPCM(
  samples: Float32Array,
  sampleRate: number = 16000
): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeAsciiString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAsciiString(view, 8, 'WAVE');

  // fmt subchunk
  writeAsciiString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true); // AudioFormat 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeAsciiString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM sample values
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

/**
 * Converts any audio Blob (e.g. webm from MediaRecorder) to 16kHz mono 16-bit PCM WAV.
 */
export async function convertAudioBlobToWav16kMono(audioBlob: Blob): Promise<Blob> {
  if (typeof window === 'undefined') {
    return audioBlob;
  }

  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  const OfflineContextClass =
    window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;

  if (!AudioContextClass || !OfflineContextClass) {
    console.warn('AudioContext not supported in this browser, sending raw audio blob');
    return audioBlob;
  }

  let audioCtx: AudioContext | null = null;
  try {
    audioCtx = new AudioContextClass();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const targetSampleRate = 16000;
    const targetLength = Math.max(1, Math.ceil(decodedBuffer.duration * targetSampleRate));

    const offlineCtx = new OfflineContextClass(1, targetLength, targetSampleRate);
    const sourceNode = offlineCtx.createBufferSource();
    sourceNode.buffer = decodedBuffer;
    sourceNode.connect(offlineCtx.destination);
    sourceNode.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const channelData = renderedBuffer.getChannelData(0);

    const wavBuffer = encodeFloat32To16BitPCM(channelData, targetSampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } catch (err) {
    console.warn('Could not convert audio to 16kHz WAV, returning original blob:', err);
    return audioBlob;
  } finally {
    if (audioCtx) {
      audioCtx.close().catch(() => {});
    }
  }
}
