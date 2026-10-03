import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveAgents } from './components/ActiveAgents';
import { BootScreen } from './components/BootScreen';
import { BottomBar } from './components/BottomBar';
import { CommsConsole } from './components/CommsConsole';
import { CoreOverview } from './components/CoreOverview';
import { IntelFeed } from './components/IntelFeed';
import { JarvisCore } from './components/JarvisCore';
import { LlmStatus } from './components/LlmStatus';
import { MemoryInsights } from './components/MemoryInsights';
import { MissionTimeline } from './components/MissionTimeline';
import { Panel } from './components/Panel';
import { QuickCommands } from './components/QuickCommands';
import { Sidebar } from './components/Sidebar';
import { SystemMonitor } from './components/SystemMonitor';
import { TopBar } from './components/TopBar';
import { feed } from './data/dashboard';
import { useSystemStats } from './hooks/useSystemStats';
import { useVoice } from './hooks/useVoice';
import { executiveBriefing, greeting, think, type JarvisAction } from './jarvis/brain';

const OPERATOR = import.meta.env.VITE_OPERATOR_NAME || 'Commander';
const BASE_MEMORIES = 3380;

export default function App() {
  const stats = useSystemStats();
  const [booted, setBooted] = useState(false);
  const [nav, setNav] = useState('command');
  const [focus, setFocus] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState(14);

  const ctxRef = useRef({ stats, operator: OPERATOR, focus });
  ctxRef.current = { stats, operator: OPERATOR, focus };

  const navigate = useCallback((id: string) => {
    setNav(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlight(id);
      setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1800);
    }
  }, []);

  const runAction = useCallback(
    (a?: JarvisAction) => {
      if (!a) return;
      setToolCalls((n) => n + 1);
      if (a.type === 'navigate') navigate(a.target);
      if (a.type === 'focus') setFocus(a.on);
    },
    [navigate],
  );

  const voice = useVoice({
    respond: (text) => {
      const reply = think(text, ctxRef.current);
      runAction(reply.action);
      return reply.action?.type === 'stop' ? null : reply.text;
    },
  });

  const sendCommand = useCallback(
    (text: string) => {
      setConsoleOpen(true);
      void voice.sendText(text);
    },
    [voice],
  );

  const briefing = useCallback(() => {
    setConsoleOpen(true);
    void voice.say(executiveBriefing(ctxRef.current));
  }, [voice]);

  const talk = useCallback(() => {
    setConsoleOpen(true);
    voice.toggleListening();
  }, [voice]);

  // Keyboard: Space = talk, "/" = command bar, Esc = hush / close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest('input, textarea, [contenteditable]');
      if (e.key === 'Escape') {
        voice.cancelSpeech();
        setConsoleOpen(false);
        (document.activeElement as HTMLElement)?.blur();
        return;
      }
      if (typing || !booted) return;
      if (e.code === 'Space') {
        e.preventDefault();
        talk();
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('command-input')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [voice, talk, booted]);

  const engage = () => {
    setBooted(true);
    setTimeout(() => void voice.say(greeting(OPERATOR)), 900);
  };

  const userTurns = voice.messages.filter((m) => m.role === 'user').length;
  const alerts = feed.filter((f) => f.level === 'warn' || f.level === 'alert').length;

  return (
    <div className={`app ${booted ? 'booted' : ''} ${focus ? 'focus-mode' : ''} voice-${voice.state}`}>
      <div className="bg-grid" />
      <div className="bg-glow" />
      {!booted && <BootScreen onEngage={engage} />}

      <Sidebar active={nav} onNavigate={navigate} voice={voice} focus={focus} onToggleFocus={() => setFocus((f) => !f)} />

      <main className="main">
        <TopBar
          operator={OPERATOR}
          muted={voice.muted}
          onToggleMute={() => voice.setMuted(!voice.muted)}
          onCommand={sendCommand}
          alerts={alerts}
          statusOk={stats.cpu < 90}
        />

        <div className="dashboard">
          <CoreOverview stats={stats} voice={voice.state} memories={BASE_MEMORIES + voice.messages.length} />
          <Panel className="core-panel" id="core">
            <JarvisCore state={voice.state} analyserRef={voice.analyserRef} onActivate={talk} />
          </Panel>
          <IntelFeed focus={focus} onViewTasks={() => navigate('calendar')} />

          <ActiveAgents highlight={highlight === 'agents'} />
          <MissionTimeline highlight={highlight === 'calendar'} />
          <QuickCommands onCommand={sendCommand} onVoice={talk} />

          <SystemMonitor stats={stats} />
          <MemoryInsights memories={BASE_MEMORIES + voice.messages.length} turns={userTurns} toolCalls={toolCalls} />
          <LlmStatus />
        </div>
      </main>

      <BottomBar voice={voice} onBriefing={briefing} />
      <CommsConsole voice={voice} open={consoleOpen} onClose={() => setConsoleOpen(false)} />
      {!consoleOpen && voice.messages.length > 0 && (
        <button className="comms-fab" onClick={() => setConsoleOpen(true)}>
          Comms · {voice.messages.length}
        </button>
      )}
    </div>
  );
}
