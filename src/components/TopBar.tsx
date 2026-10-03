import { Bell, LayoutGrid, Maximize, Search, Settings, UserRound, Volume2, VolumeX } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useClock } from '../hooks/useClock';

interface TopBarProps {
  operator: string;
  muted: boolean;
  onToggleMute: () => void;
  onCommand: (text: string) => void;
  alerts: number;
  statusOk: boolean;
}

export function TopBar({ operator, muted, onToggleMute, onCommand, alerts, statusOk }: TopBarProps) {
  const now = useClock();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    onCommand(q);
    setQ('');
  };

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const [clock, meridiem] = time.split(' ');

  return (
    <header className="topbar">
      <div className={`status-pill ${statusOk ? 'ok' : 'warn'}`}>
        <span>System Status</span>
        <span className="status-val">
          <i /> {statusOk ? 'Optimal' : 'Degraded'}
        </span>
      </div>

      <div className="clock">
        <div className="clock-date">
          {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className="clock-time">
          {clock} <small>{meridiem?.toLowerCase()}</small>
        </div>
      </div>

      <div className="top-actions">
        <form className="search" onSubmit={submit}>
          <Search size={15} />
          <input
            ref={inputRef}
            id="command-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask Jarvis or search…"
            autoComplete="off"
          />
          <kbd>/</kbd>
        </form>
        <button className="icon-btn" onClick={fullscreen} title="Fullscreen">
          <Maximize size={16} />
        </button>
        <button className="icon-btn" title="Layout">
          <LayoutGrid size={16} />
        </button>
        <button className="icon-btn" onClick={onToggleMute} title={muted ? 'Unmute Jarvis' : 'Mute Jarvis'}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button className="icon-btn" title="Notifications">
          <Bell size={16} />
          {alerts > 0 && <span className="dot-badge">{alerts}</span>}
        </button>
        <button className="icon-btn" title="Settings">
          <Settings size={16} />
        </button>
        <div className="operator">
          <div>
            <div className="op-role">Operator</div>
            <div className="op-name">{operator}</div>
          </div>
          <span className="op-avatar">
            <UserRound size={18} />
          </span>
        </div>
      </div>
    </header>
  );
}
