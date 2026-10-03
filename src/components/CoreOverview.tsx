import { Panel } from './Panel';
import { Icon } from './icons';
import type { SystemStats } from '../hooks/useSystemStats';
import type { VoiceState } from '../hooks/useVoice';
import { agents, llms } from '../data/dashboard';

export function CoreOverview({ stats, voice, memories }: { stats: SystemStats; voice: VoiceState; memories: number }) {
  const running = agents.filter((a) => a.state === 'active').length;
  const connected = llms.filter((l) => l.status === 'connected').length;
  const rows = [
    { icon: 'core', label: 'AI Core', value: 'Active', tone: 'green', hue: 190 },
    { icon: 'db', label: 'Memory', value: `${memories.toLocaleString()} Stored`, tone: 'cyan', hue: 210 },
    { icon: 'mic', label: 'Voice', value: voice === 'idle' ? 'Online' : voice[0].toUpperCase() + voice.slice(1), tone: 'green', hue: 190 },
    { icon: 'bot', label: 'Agents', value: `${running} Running`, tone: 'violet', hue: 275 },
    { icon: 'brain', label: 'LLMs', value: `${connected} Connected`, tone: 'amber', hue: 38 },
    { icon: 'system', label: 'System', value: stats.cpu > 85 ? 'Under load' : 'Optimal', tone: stats.cpu > 85 ? 'amber' : 'green', hue: 150 },
  ];
  return (
    <Panel title="AI Core Overview" className="core-overview">
      <ul className="overview-list">
        {rows.map((r) => (
          <li key={r.label}>
            <span className="ov-icon" style={{ '--h': r.hue } as React.CSSProperties}>
              <Icon name={r.icon} size={15} />
            </span>
            <div>
              <div className="ov-label">{r.label}</div>
              <div className={`ov-value tone-${r.tone}`}>{r.value}</div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
