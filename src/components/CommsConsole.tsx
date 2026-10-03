import { MessageSquare, Send, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { VoiceController } from '../hooks/useVoice';

/** Floating transcript of the conversation with Jarvis, with a typed fallback. */
export function CommsConsole({ voice, open, onClose }: { voice: VoiceController; open: boolean; onClose: () => void }) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [voice.messages.length, voice.interim]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    void voice.sendText(text);
    setText('');
  };

  return (
    <div className={`comms ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="comms-head">
        <MessageSquare size={14} /> <span>Comms Log</span>
        <button className="icon-btn sm" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <div className="comms-list" ref={listRef}>
        {voice.messages.length === 0 && !voice.interim && (
          <div className="comms-empty">Say “Jarvis, give me my briefing” or type a command below.</div>
        )}
        {voice.messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            <span className="who">{m.role === 'jarvis' ? 'JARVIS' : 'YOU'}</span>
            <p>{m.text}</p>
          </div>
        ))}
        {voice.interim && (
          <div className="msg user interim">
            <span className="who">YOU</span>
            <p>{voice.interim}</p>
          </div>
        )}
        {voice.state === 'thinking' && (
          <div className="msg jarvis typing">
            <span className="who">JARVIS</span>
            <p><i /><i /><i /></p>
          </div>
        )}
      </div>
      {voice.error && <div className="comms-error">{voice.error}</div>}
      <form className="comms-input" onSubmit={submit}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type to Jarvis…" />
        <button type="submit" aria-label="Send">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
