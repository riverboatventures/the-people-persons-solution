import { Panel } from './Panel';
import type { SystemStats } from '../hooks/useSystemStats';

function Gauge({ label, value, hue }: { label: string; value: number | null; hue: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  return (
    <div className="gauge" style={{ '--h': hue } as React.CSSProperties}>
      <svg viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="42" className="g-outer" />
        <circle cx="45" cy="45" r={r} className="g-track" />
        <circle
          cx="45"
          cy="45"
          r={r}
          className="g-value"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform="rotate(-90 45 45)"
        />
        <circle cx="45" cy="45" r="26" className="g-inner" />
      </svg>
      <div className="g-text">
        <span>{label}</span>
        <strong>{value == null ? '—' : `${v}%`}</strong>
      </div>
    </div>
  );
}

const hueFor = (v: number) => (v > 85 ? 0 : v > 65 ? 38 : 190);

export function SystemMonitor({ stats }: { stats: SystemStats }) {
  const up = stats.uptimeSec;
  const uptime = `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m`;
  return (
    <Panel
      title="System Monitor"
      className="system-monitor"
      action={<span className={`src-chip ${stats.live ? 'live' : ''}`}>{stats.live ? 'Live' : 'Simulated'}</span>}
    >
      <div className="gauges">
        <Gauge label="CPU" value={stats.cpu} hue={hueFor(stats.cpu)} />
        <Gauge label="RAM" value={stats.ram} hue={hueFor(stats.ram)} />
        <Gauge label="Disk" value={stats.disk} hue={hueFor(stats.disk ?? 0)} />
      </div>
      <div className="sys-meta">
        <span>{stats.cores} cores</span>
        <span>{stats.totalMemGb} GB</span>
        <span>{stats.live ? `up ${uptime}` : 'API offline'}</span>
      </div>
    </Panel>
  );
}
