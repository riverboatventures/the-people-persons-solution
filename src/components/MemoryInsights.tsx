import { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { Panel } from './Panel';

/** A slowly drifting constellation that stands in for the memory graph. */
function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const pts = Array.from({ length: 22 }, () => ({
      x: 0.08 + Math.random() * 0.84,
      y: 0.15 + Math.random() * 0.7,
      p: Math.random() * Math.PI * 2,
      s: 0.3 + Math.random() * 0.7,
    }));
    let raf = 0;
    const draw = (ms: number) => {
      const t = ms / 1000;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const pos = pts.map((p) => [p.x * w + Math.sin(t * p.s + p.p) * 4, p.y * h + Math.cos(t * p.s * 0.8 + p.p) * 4] as const);
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const d = Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]);
          const max = Math.min(w, h) * 0.32;
          if (d < max) {
            ctx.strokeStyle = `rgba(56, 214, 255, ${(1 - d / max) * 0.45})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pos[i][0], pos[i][1]);
            ctx.lineTo(pos[j][0], pos[j][1]);
            ctx.stroke();
          }
        }
      }
      pos.forEach(([x, y], i) => {
        const tw = (Math.sin(t * 2 + pts[i].p) + 1) / 2;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, `rgba(160, 240, 255, ${0.5 + tw * 0.5})`);
        g.addColorStop(1, 'rgba(56, 214, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e6fbff';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="constellation" />;
}

export function MemoryInsights({ memories, turns, toolCalls }: { memories: number; turns: number; toolCalls: number }) {
  return (
    <Panel title="Memory Insights" className="memory-insights" id="memory">
      <div className="mem-wrap">
        <Constellation />
        <dl className="mem-stats">
          <div><dt>Memories</dt><dd>{memories.toLocaleString()}</dd></div>
          <div><dt>Session Turns</dt><dd>{turns}</dd></div>
          <div><dt>Tool Calls</dt><dd>{toolCalls}</dd></div>
        </dl>
      </div>
      <button className="panel-link center">
        View Memory Map <ChevronRight size={14} />
      </button>
    </Panel>
  );
}
