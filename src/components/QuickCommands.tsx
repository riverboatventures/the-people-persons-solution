import { Panel } from './Panel';
import { Icon } from './icons';
import { quickCommands } from '../data/dashboard';

export function QuickCommands({ onCommand, onVoice }: { onCommand: (text: string) => void; onVoice: () => void }) {
  return (
    <Panel title="Quick Commands" className="quick-commands">
      <div className="qc-list">
        {quickCommands.map((c) => (
          <button key={c.id} className="qc-btn" onClick={() => (c.say ? onCommand(c.say) : onVoice())}>
            <span className="qc-icon">
              <Icon name={c.icon} size={14} />
            </span>
            {c.label}
          </button>
        ))}
      </div>
    </Panel>
  );
}
