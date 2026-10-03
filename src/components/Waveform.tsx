import { useEffect, useRef, type RefObject } from 'react';
import type { VoiceState } from '../hooks/useVoice';
import { sampleSpectrum } from '../jarvis/audio';

interface WaveformProps {
  analyserRef?: RefObject<AnalyserNode | null>;
  state: VoiceState;
  bars?: number;
  hue?: number;
  className?: string;
  /** Multiplies amplitude; use < 1 for ambient decoration. */
  gain?: number;
  seed?: number;
  /** Draw a dotted baseline instead of bars when quiet (agent "standby" look). */
  variant?: 'bars' | 'dots';
}

export function Waveform({
  analyserRef,
  state,
  bars = 48,
  hue = 190,
  className = '',
  gain = 1,
  seed = 0,
  variant = 'bars',
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const data = new Float32Array(bars);
    let raf = 0;

    const draw = (ms: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      sampleSpectrum(analyserRef?.current ?? null, state, ms / 1000, data, seed);

      const step = w / bars;
      const bw = Math.max(1, step * 0.45);
      const mid = h / 2;
      for (let i = 0; i < bars; i++) {
        const amp = Math.min(1, data[i] * gain);
        const x = i * step + (step - bw) / 2;
        if (variant === 'dots') {
          const y = mid + Math.sin(ms / 400 + i * 0.6 + seed) * amp * h * 0.35;
          ctx.fillStyle = `hsla(${hue}, 95%, 65%, ${0.35 + amp})`;
          ctx.beginPath();
          ctx.arc(x + bw / 2, y, 1.4, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        const bh = Math.max(1.5, amp * h * 0.92);
        const grad = ctx.createLinearGradient(0, mid - bh / 2, 0, mid + bh / 2);
        grad.addColorStop(0, `hsla(${hue}, 100%, 75%, 0.15)`);
        grad.addColorStop(0.5, `hsla(${hue}, 100%, 65%, ${0.55 + amp * 0.45})`);
        grad.addColorStop(1, `hsla(${hue}, 100%, 75%, 0.15)`);
        ctx.fillStyle = grad;
        ctx.fillRect(x, mid - bh / 2, bw, bh);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyserRef, state, bars, hue, gain, seed, variant]);

  return <canvas ref={canvasRef} className={`waveform ${className}`} />;
}
