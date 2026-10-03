import { ChevronRight } from 'lucide-react';
import { Panel } from './Panel';
import { Icon } from './icons';
import { feed } from '../data/dashboard';

export function IntelFeed({ onViewTasks, focus }: { onViewTasks: () => void; focus: boolean }) {
  const items = focus ? feed.filter((f) => f.level === 'warn' || f.level === 'alert') : feed;
  return (
    <Panel
      title="Live Intelligence Feed"
      className="intel-feed"
      action={
        <span className="live-chip">
          <i /> {focus ? 'Filtered' : 'Live'}
        </span>
      }
    >
      <ul className="feed-list">
        {items.map((f, i) => (
          <li key={f.id} className={`feed-item lvl-${f.level}`} style={{ animationDelay: `${i * 80}ms` }}>
            <span className="feed-icon">
              <Icon name={f.icon} size={15} />
            </span>
            <div className="feed-text">
              <div className="feed-title">{f.title}</div>
              <div className="feed-src">{f.source}</div>
            </div>
            {f.level === 'alert' ? (
              <button className="chip-btn" onClick={onViewTasks}>
                View Tasks
              </button>
            ) : (
              <span className="feed-tag">{f.level}</span>
            )}
          </li>
        ))}
      </ul>
      <button className="panel-link">
        View All Intelligence <ChevronRight size={14} />
      </button>
    </Panel>
  );
}
