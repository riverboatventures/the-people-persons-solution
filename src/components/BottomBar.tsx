import { CloudSun, MapPin, Play, Wifi, WifiOff } from 'lucide-react';
import type { VoiceController } from '../hooks/useVoice';
import { useEnvironment } from '../hooks/useEnvironment';
import { Waveform } from './Waveform';

const SUB = { idle: 'Tap or press Space', listening: 'I am listening…', thinking: 'Thinking…', speaking: 'Speaking — tap to stop' };

export function BottomBar({ voice, onBriefing }: { voice: VoiceController; onBriefing: () => void }) {
  const env = useEnvironment();
  const talk = () => (voice.state === 'speaking' ? voice.cancelSpeech() : voice.toggleListening());
  return (
    <footer className="bottombar">
      <div className="env">
        <div className="env-chip">
          <MapPin size={15} />
          <div><span>Location</span><strong>{env.location}</strong></div>
        </div>
        <div className="env-chip">
          <CloudSun size={15} />
          <div><span>Weather</span><strong>{env.weather ?? 'Not configured'}</strong></div>
        </div>
        <div className="env-chip">
          {env.online ? <Wifi size={15} /> : <WifiOff size={15} />}
          <div><span>Network</span><strong>{env.network}</strong></div>
        </div>
      </div>

      <div className="talk-zone">
        <div className="dot-trail left" />
        <button className={`talk-btn state-${voice.state}`} onClick={talk}>
          <Waveform analyserRef={voice.analyserRef} state={voice.state} bars={14} className="tw left" seed={1} />
          <span className="talk-text">
            <strong>Talk to Jarvis</strong>
            <small>{voice.interim || SUB[voice.state]}</small>
          </span>
          <Waveform analyserRef={voice.analyserRef} state={voice.state} bars={14} className="tw right" seed={3} />
        </button>
        <div className="dot-trail right" />
      </div>

      <button className="briefing-btn" onClick={onBriefing}>
        <Play size={13} /> Executive Briefing
      </button>
    </footer>
  );
}
