import { useEffect, useState } from 'react';

export interface SystemStats {
  cpu: number;
  ram: number;
  disk: number | null;
  cores: number;
  totalMemGb: number;
  hostname: string;
  platform: string;
  uptimeSec: number;
  jarvisUptimeSec: number;
  live: boolean;
}

const fallback: SystemStats = {
  cpu: 15,
  ram: 54,
  disk: 40,
  cores: 8,
  totalMemGb: 16,
  hostname: 'local',
  platform: 'browser',
  uptimeSec: 0,
  jarvisUptimeSec: 0,
  live: false,
};

/** Polls the local Jarvis API for real machine telemetry; drifts plausibly if the API is offline. */
export function useSystemStats(intervalMs = 2000) {
  const [stats, setStats] = useState<SystemStats>(fallback);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch('/api/system', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) setStats({ ...fallback, ...data, disk: data.disk ?? fallback.disk, live: true });
      } catch {
        if (!cancelled) {
          setStats((s) => ({
            ...s,
            live: false,
            cpu: clamp(s.cpu + (Math.random() - 0.5) * 8, 4, 70),
            ram: clamp(s.ram + (Math.random() - 0.5) * 2, 30, 80),
          }));
        }
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return stats;
}

const clamp = (v: number, lo: number, hi: number) => Math.round(Math.min(hi, Math.max(lo, v)));
