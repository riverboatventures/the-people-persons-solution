import { ChevronRight, Mic, MicOff, Zap } from 'lucide-react';
import { navItems } from '../data/dashboard';
import type { VoiceController } from '../hooks/useVoice';
import { Icon } from './icons';
import { Waveform } from './Waveform';

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  voice: VoiceController;
  focus: boolean;
  onToggleFocus: () => void;
}

const VOICE_LABEL = { idle: 'Tap to speak', listening: 'Listening…', thinking: 'Processing…', speaking: 'Speaking…' };

export function Sidebar({ active, onNavigate, voice, focus, onToggleFocus }: SidebarProps) {
  const live = voice.state !== 'idle';
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="core" />
        </div>
        <div>
          <div className="brand-name">JARVIS</div>
          <div className="brand-sub">Command Center</div>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
            {'badge' in item && <span className="badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="voice-card">
        <div className="voice-head">
          <span>Voice Status</span>
          <ChevronRight size={14} />
        </div>
        <Waveform analyserRef={voice.analyserRef} state={voice.state} bars={40} className="voice-wave" />
        <div className="voice-label">{voice.interim || VOICE_LABEL[voice.state]}</div>
        <button
          className={`mic-orb ${live ? 'live' : ''}`}
          onClick={voice.toggleListening}
          aria-label={voice.state === 'listening' ? 'Stop listening' : 'Start listening'}
        >
          <span className="halo h1" />
          <span className="halo h2" />
          {voice.recognitionSupported ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        <div className="voice-hint">{voice.recognitionSupported ? 'or press Space' : 'Voice input needs Chrome/Edge'}</div>
      </div>

      <button className={`focus-btn ${focus ? 'on' : ''}`} onClick={onToggleFocus}>
        <Zap size={14} /> {focus ? 'Focus Mode: On' : 'Focus Mode'}
      </button>
    </aside>
  );
}
