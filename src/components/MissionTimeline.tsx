import { ChevronDown, ChevronRight } from 'lucide-react';
import { Panel } from './Panel';
import { missions } from '../data/dashboard';

const fmt = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return { hm: `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`, ap: h < 12 ? 'am' : 'pm' };
};

export function MissionTimeline({ highlight }: { highlight: boolean }) {
  return (
    <Panel
      title="Mission Timeline"
      className={`mission-timeline ${highlight ? 'pulse' : ''}`}
      id="calendar"
      action={
        <button className="mini-select">
          Today <ChevronDown size={12} />
        </button>
      }
    >
      <ol className="timeline">
        {missions.map((m) => {
          const { hm, ap } = fmt(m.time);
          return (
            <li key={m.time} className={m.progress >= 1 ? 'done' : ''}>
              <span className="tl-time">
                {hm}
                <small>{ap}</small>
              </span>
              <span className="tl-dot" />
              <div className="tl-body">
                <div className="tl-title">{m.title}</div>
                <div className="tl-bar">
                  <span style={{ width: `${m.progress * 100}%` }} />
                </div>
              </div>
              <span className="tl-status">{m.status}</span>
            </li>
          );
        })}
      </ol>
      <button className="panel-link center">
        View Full Schedule <ChevronRight size={14} />
      </button>
    </Panel>
  );
}
