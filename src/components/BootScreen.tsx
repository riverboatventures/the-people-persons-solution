import { useEffect, useState } from 'react';

const LINES = [
  'Initializing neural core…',
  'Loading agent registry…',
  'Calibrating voice interface…',
  'Linking memory banks…',
  'All systems nominal.',
];

/** Boot overlay. The "Engage" click also unlocks audio so Jarvis can speak immediately. */
export function BootScreen({ onEngage }: { onEngage: () => void }) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (step >= LINES.length) return;
    const id = setTimeout(() => setStep((s) => s + 1), 380);
    return () => clearTimeout(id);
  }, [step]);

  const ready = step >= LINES.length;
  const engage = () => {
    setLeaving(true);
    setTimeout(onEngage, 550);
  };

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        engage();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className={`boot ${leaving ? 'leaving' : ''}`}>
      <div className="boot-rings">
        <span /><span /><span />
      </div>
      <div className="boot-title">JARVIS</div>
      <div className="boot-sub">The People Persons · Command Center</div>
      <ul className="boot-log">
        {LINES.slice(0, step).map((l) => (
          <li key={l}>› {l}</li>
        ))}
      </ul>
      <button className={`boot-btn ${ready ? 'ready' : ''}`} onClick={engage} disabled={!ready}>
        {ready ? 'Engage' : 'Booting'}
      </button>
    </div>
  );
}
