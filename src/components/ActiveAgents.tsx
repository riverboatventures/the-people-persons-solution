import { Check } from 'lucide-react';
import { Panel } from './Panel';
import { Icon } from './icons';
import { Waveform } from './Waveform';
import { agents } from '../data/dashboard';

export function ActiveAgents({ highlight }: { highlight: boolean }) {
  return (
    <Panel
      title="Active Agents"
      className={`active-agents ${highlight ? 'pulse' : ''}`}
      id="agents"
      action={<button className="mini-link">View All ›</button>}
    >
      <div className="agent-grid">
        {agents.map((a, i) => (
          <article key={a.id} className={`agent-card ${a.state}`} style={{ '--h': a.hue } as React.CSSProperties}>
            <span className="agent-icon">
              <Icon name={a.icon} size={18} />
            </span>
            <div className="agent-meta">
              <div className="agent-name">{a.name}</div>
              <div className="agent-state">
                <i /> {a.state === 'active' ? 'Active' : 'Standby'}
              </div>
              <div className="agent-role">{a.role}</div>
            </div>
            {a.id === 'ops' ? (
              <Check className="agent-check" size={22} />
            ) : (
              <Waveform
                state={a.state === 'active' ? 'speaking' : 'idle'}
                hue={a.hue}
                bars={26}
                gain={a.state === 'active' ? 0.9 : 1.6}
                seed={i * 1.7}
                variant={a.id === 'tasks' ? 'dots' : 'bars'}
                className="agent-wave"
              />
            )}
          </article>
        ))}
      </div>
    </Panel>
  );
}
