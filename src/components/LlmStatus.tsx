import { ChevronRight } from 'lucide-react';
import { Panel } from './Panel';
import { llms } from '../data/dashboard';

const LABEL = { connected: 'Connected', 'not-linked': 'Not Linked', 'no-models': 'No Models' } as const;

export function LlmStatus() {
  const connected = llms.filter((l) => l.status === 'connected').length;
  return (
    <Panel title="LLM Status" className="llm-status" action={<span className="count-chip">{connected} Connected</span>}>
      <div className="llm-grid">
        {llms.map((l) => (
          <div key={l.name} className={`llm-card ${l.status}`} style={{ '--h': l.hue } as React.CSSProperties}>
            <span className="llm-mark">{l.name[0]}</span>
            <div>
              <div className="llm-name">{l.name}</div>
              <div className="llm-state">{LABEL[l.status]}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="panel-link center">
        Manage Providers <ChevronRight size={14} />
      </button>
    </Panel>
  );
}
