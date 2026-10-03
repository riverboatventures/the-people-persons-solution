import { useEffect, useRef, type RefObject } from 'react';
import type { VoiceState } from '../hooks/useVoice';
import { averageLevel, sampleSpectrum } from '../jarvis/audio';

interface JarvisCoreProps {
  state: VoiceState;
  analyserRef: RefObject<AnalyserNode | null>;
  onActivate: () => void;
}

type Vec3 = [number, number, number];

const STATE_LABEL: Record<VoiceState, string> = {
  idle: 'Standing by',
  listening: 'Listening…',
  thinking: 'Processing…',
  speaking: 'Speaking',
};

function fibonacciSphere(n: number): Vec3[] {
  const pts: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  return pts;
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot);
  if (om < 1e-4) return a;
  const s = Math.sin(om);
  const k1 = Math.sin((1 - t) * om) / s;
  const k2 = Math.sin(t * om) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

/** The animated holographic core: wireframe globe, data links, orbiting satellites and a ripple platform. */
export function JarvisCore({ state, analyserRef, onActivate }: JarvisCoreProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const nodes = fibonacciSphere(260);
    const links = Array.from({ length: 14 }, () => {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      return { a, b, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.6 };
    });
    const orbits = [
      { r: 1.42, tiltX: 1.25, tiltZ: 0.35, speed: 0.55, phase: 0 },
      { r: 1.52, tiltX: 1.1, tiltZ: -0.55, speed: -0.38, phase: 2 },
      { r: 1.28, tiltX: 0.35, tiltZ: 0.15, speed: 0.8, phase: 4 },
    ];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      vx: (Math.random() - 0.5) * 0.01,
      vy: -0.004 - Math.random() * 0.01,
    }));
    const spectrum = new Float32Array(32);
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let level = 0;
    let rot = 0;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      pointer.tx = 0;
      pointer.ty = 0;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    const frame = (ms: number) => {
      const dt = Math.min(0.05, (ms - last) / 1000);
      last = ms;
      const t = ms / 1000;
      const st = stateRef.current;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      sampleSpectrum(analyserRef.current, st, t, spectrum);
      const target = averageLevel(spectrum) * (st === 'idle' ? 0.6 : 1.6);
      level += (target - level) * Math.min(1, dt * 8);

      pointer.x += (pointer.tx - pointer.x) * dt * 3;
      pointer.y += (pointer.ty - pointer.y) * dt * 3;

      const spin = st === 'thinking' ? 0.9 : st === 'speaking' ? 0.45 : 0.22;
      rot += dt * spin;

      const cx = w / 2;
      const cy = h * 0.48;
      const R = Math.min(w * 0.3, h * 0.3) * (1 + level * 0.06);
      const tilt = 0.38 + pointer.y * 0.15;
      const yaw = rot + pointer.x * 0.35;
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
      const cosX = Math.cos(tilt), sinX = Math.sin(tilt);
      const hue = st === 'thinking' ? 205 : 190;

      const project = (p: Vec3, scale = R): [number, number, number] => {
        const x1 = p[0] * cosY - p[2] * sinY;
        const z1 = p[0] * sinY + p[2] * cosY;
        const y2 = p[1] * cosX - z1 * sinX;
        const z2 = p[1] * sinX + z1 * cosX;
        return [cx + x1 * scale, cy + y2 * scale, z2];
      };

      // Ambient particles
      for (const pt of particles) {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt * (1 + level * 4);
        if (pt.y < -0.02) {
          pt.y = 1.02;
          pt.x = Math.random();
        }
        const a = 0.15 + pt.z * 0.5;
        ctx.fillStyle = `hsla(${hue}, 100%, 75%, ${a})`;
        ctx.fillRect(pt.x * w, pt.y * h, 1 + pt.z * 1.2, 1 + pt.z * 1.2);
      }

      // Ripple platform beneath the globe
      const py = cy + R * 1.32;
      ctx.save();
      ctx.translate(cx, py);
      ctx.scale(1, 0.2);
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.35 + i / 4) % 1;
        ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${(1 - k) * 0.45})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, R * (0.4 + k * 1.1), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.55)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.9);
      pg.addColorStop(0, `hsla(${hue}, 100%, 60%, ${0.35 + level * 0.4})`);
      pg.addColorStop(1, 'hsla(200, 100%, 50%, 0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Light beam from platform to core
      const beam = ctx.createLinearGradient(0, cy, 0, py);
      beam.addColorStop(0, 'hsla(195, 100%, 60%, 0)');
      beam.addColorStop(1, `hsla(${hue}, 100%, 60%, ${0.08 + level * 0.25})`);
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.35, py);
      ctx.lineTo(cx + R * 0.35, py);
      ctx.lineTo(cx + R * 0.12, cy);
      ctx.lineTo(cx - R * 0.12, cy);
      ctx.fill();

      // Core glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.05, cx, cy, R * 1.5);
      glow.addColorStop(0, `hsla(${hue}, 100%, 70%, ${0.32 + level * 0.5})`);
      glow.addColorStop(0.45, `hsla(${hue + 10}, 100%, 45%, ${0.12 + level * 0.18})`);
      glow.addColorStop(1, 'hsla(210, 100%, 30%, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Back half of orbits (drawn before the globe so the globe occludes them)
      const drawOrbits = (front: boolean) => {
        for (const o of orbits) {
          const cz = Math.cos(o.tiltZ), sz = Math.sin(o.tiltZ);
          const cxo = Math.cos(o.tiltX), sxo = Math.sin(o.tiltX);
          const ringPoint = (a: number): Vec3 => {
            let x = Math.cos(a), y = 0, z = Math.sin(a);
            const y1 = y * cxo - z * sxo; const z1 = y * sxo + z * cxo; y = y1; z = z1;
            const x2 = x * cz - y * sz; const y2 = x * sz + y * cz; x = x2; y = y2;
            return [x * o.r, y * o.r, z * o.r];
          };
          ctx.lineWidth = 1;
          ctx.beginPath();
          let started = false;
          for (let i = 0; i <= 120; i++) {
            const [x, y, z] = project(ringPoint((i / 120) * Math.PI * 2));
            const isFront = z > 0;
            if (isFront === front) {
              if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
            } else started = false;
          }
          ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${front ? 0.5 : 0.16})`;
          ctx.stroke();

          // Satellite with trail
          const sa = t * o.speed * (1 + level) + o.phase;
          for (let k = 12; k >= 0; k--) {
            const [x, y, z] = project(ringPoint(sa - k * 0.035 * Math.sign(o.speed)));
            if ((z > 0) !== front) continue;
            const a = (1 - k / 13) * (front ? 1 : 0.35);
            ctx.fillStyle = `hsla(${hue}, 100%, ${k === 0 ? 90 : 70}%, ${a})`;
            ctx.beginPath();
            ctx.arc(x, y, k === 0 ? 3.2 : 2 * (1 - k / 13) + 0.4, 0, Math.PI * 2);
            ctx.fill();
            if (k === 0) {
              const sg = ctx.createRadialGradient(x, y, 0, x, y, 14);
              sg.addColorStop(0, `hsla(${hue}, 100%, 80%, ${front ? 0.7 : 0.25})`);
              sg.addColorStop(1, 'hsla(190, 100%, 60%, 0)');
              ctx.fillStyle = sg;
              ctx.beginPath();
              ctx.arc(x, y, 14, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      };
      drawOrbits(false);

      // Globe wireframe: latitudes and meridians, split by depth
      const back = new Path2D();
      const front = new Path2D();
      const addCurve = (pointAt: (s: number) => Vec3, segs: number) => {
        let prev = project(pointAt(0));
        for (let i = 1; i <= segs; i++) {
          const cur = project(pointAt(i / segs));
          const path = (prev[2] + cur[2]) / 2 > 0 ? front : back;
          path.moveTo(prev[0], prev[1]);
          path.lineTo(cur[0], cur[1]);
          prev = cur;
        }
      };
      for (let lat = -75; lat <= 75; lat += 15) {
        const phi = (lat * Math.PI) / 180;
        const y = Math.sin(phi), r = Math.cos(phi);
        addCurve((s) => [Math.cos(s * Math.PI * 2) * r, y, Math.sin(s * Math.PI * 2) * r], 72);
      }
      for (let lon = 0; lon < 180; lon += 15) {
        const th = (lon * Math.PI) / 180;
        addCurve((s) => {
          const a = s * Math.PI * 2;
          return [Math.cos(a) * Math.cos(th), Math.sin(a), Math.cos(a) * Math.sin(th)];
        }, 72);
      }
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = `hsla(${hue}, 90%, 60%, 0.12)`;
      ctx.stroke(back);
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${0.32 + level * 0.3})`;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
      ctx.shadowBlur = 6;
      ctx.stroke(front);
      ctx.shadowBlur = 0;

      // Surface nodes
      for (const n of nodes) {
        const [x, y, z] = project(n);
        const depth = (z + 1) / 2;
        const a = 0.12 + depth * 0.75;
        const s = 0.6 + depth * 1.4;
        ctx.fillStyle = `hsla(${hue}, 100%, ${70 + depth * 20}%, ${a})`;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }

      // Data links: glowing great-circle arcs with travelling pulses
      for (const l of links) {
        const pulse = (Math.sin(t * l.speed * 2 + l.phase) + 1) / 2;
        if (pulse < 0.25) continue;
        ctx.beginPath();
        let headX = 0, headY = 0, headZ = 0;
        const head = (t * l.speed + l.phase) % 1;
        for (let i = 0; i <= 24; i++) {
          const s = i / 24;
          const p = slerp(l.a, l.b, s);
          const lift = 1 + Math.sin(s * Math.PI) * 0.18;
          const [x, y, z] = project([p[0] * lift, p[1] * lift, p[2] * lift]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          if (Math.abs(s - head) < 1 / 48) { headX = x; headY = y; headZ = z; }
        }
        ctx.strokeStyle = `hsla(${hue - 10}, 100%, 75%, ${(pulse - 0.25) * 0.6})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        if (headZ > -0.2) {
          ctx.fillStyle = `hsla(180, 100%, 90%, ${pulse})`;
          ctx.beginPath();
          ctx.arc(headX, headY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawOrbits(true);

      // HUD rings around the globe
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.15);
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.35)`;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.12, (i * Math.PI * 2) / 3, (i * Math.PI * 2) / 3 + 1.4);
        ctx.stroke();
      }
      ctx.rotate(-t * 0.35);
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.2)`;
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const len = i % 6 === 0 ? 8 : 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R * 1.2, Math.sin(a) * R * 1.2);
        ctx.lineTo(Math.cos(a) * (R * 1.2 + len), Math.sin(a) * (R * 1.2 + len));
        ctx.stroke();
      }
      // Voice-reactive spectrum ring
      if (st !== 'idle') {
        ctx.rotate(t * 0.2);
        for (let i = 0; i < 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          const v = spectrum[i % spectrum.length];
          const r0 = R * 1.28;
          const r1 = r0 + 4 + v * R * 0.22;
          ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${0.25 + v * 0.7})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.stroke();
        }
      }
      ctx.restore();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [analyserRef]);

  return (
    <div className={`jarvis-core state-${state}`}>
      <canvas ref={canvasRef} onClick={onActivate} aria-label="Jarvis core — click to talk" role="button" />
      <div className="core-title" aria-hidden>
        <div className="core-name">JARVIS</div>
        <div className="core-sub">AI CORE</div>
        <div className="core-ver">v3.0.0</div>
      </div>
      <div className="core-state">
        <span className="dot" /> {STATE_LABEL[state]}
      </div>
    </div>
  );
}
