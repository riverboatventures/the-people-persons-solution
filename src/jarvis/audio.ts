import type { VoiceState } from '../hooks/useVoice';

const buffers = new WeakMap<AnalyserNode, Uint8Array<ArrayBuffer>>();

/** Fills `out` with 0..1 magnitudes — from the mic when available, otherwise synthesised per voice state. */
export function sampleSpectrum(
  analyser: AnalyserNode | null,
  state: VoiceState,
  t: number,
  out: Float32Array,
  seed = 0,
) {
  if (analyser && state === 'listening') {
    let buf = buffers.get(analyser);
    if (!buf) {
      buf = new Uint8Array(analyser.frequencyBinCount);
      buffers.set(analyser, buf);
    }
    analyser.getByteFrequencyData(buf);
    const usable = Math.floor(buf.length * 0.6);
    for (let i = 0; i < out.length; i++) {
      // Mirror around the centre so the waveform looks symmetric.
      const k = Math.abs(i - (out.length - 1) / 2) / (out.length / 2);
      const v = buf[Math.floor(k * usable)] / 255;
      out[i] = Math.min(1, v * 1.4);
    }
    return;
  }
  const energy = state === 'speaking' ? 0.85 : state === 'listening' ? 0.45 : state === 'thinking' ? 0.3 : 0.26;
  for (let i = 0; i < out.length; i++) {
    const x = i / out.length;
    const env = Math.sin(Math.PI * x) ** 1.4;
    const n =
      Math.sin(t * 6.1 + i * 0.55 + seed) * 0.5 +
      Math.sin(t * 3.7 - i * 0.31 + seed * 2) * 0.35 +
      Math.sin(t * 11.3 + i * 1.7) * 0.15 * (state === 'speaking' ? 1 : 0.3);
    out[i] = Math.max(0.04, env * energy * (0.55 + 0.45 * n));
  }
}

export function averageLevel(arr: Float32Array) {
  let s = 0;
  for (let i = 0; i < arr.length; i++) s += arr[i];
  return arr.length ? s / arr.length : 0;
}
