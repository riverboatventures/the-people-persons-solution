// Browser-native voice loop: Web Speech API for listening, speechSynthesis for
// talking, and a Web Audio analyser so the waveforms react to your actual voice.
// The Voice MCP will later replace `speak` (and optionally recognition) behind
// the same interface, so components never need to change.
import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ChatMessage {
  id: number;
  role: 'user' | 'jarvis';
  text: string;
  at: Date;
}

/* Minimal typings — SpeechRecognition is still prefixed/untyped in lib.dom. */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const PREFERRED_VOICES = [
  'Google UK English Male',
  'Microsoft Ryan Online (Natural) - English (United Kingdom)',
  'Microsoft George - English (United Kingdom)',
  'Daniel',
  'Arthur',
  'Oliver',
];

function pickVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  for (const name of PREFERRED_VOICES) {
    const v = voices.find((x) => x.name === name);
    if (v) return v;
  }
  return voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang.startsWith('en')) ?? null;
}

export interface UseVoiceOptions {
  /** Turns the user's words into Jarvis' reply. May be async (LLM/agents later). */
  respond: (text: string) => Promise<string | null> | string | null;
}

export function useVoice({ respond }: UseVoiceOptions) {
  const [state, setState] = useState<VoiceState>('idle');
  const [interim, setInterim] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<Recognition | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const idRef = useRef(0);
  const respondRef = useRef(respond);
  respondRef.current = respond;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const recognitionSupported = typeof window !== 'undefined' && getRecognitionCtor() !== null;
  const synthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    // Voices load asynchronously in Chrome; touching getVoices primes the list.
    if (synthesisSupported) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, [synthesisSupported]);

  const push = useCallback((role: ChatMessage['role'], text: string) => {
    setMessages((m) => [...m.slice(-49), { id: ++idRef.current, role, text, at: new Date() }]);
  }, []);

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        if (!synthesisSupported || mutedRef.current) {
          setState('idle');
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const voice = pickVoice();
        if (voice) u.voice = voice;
        u.rate = 1.02;
        u.pitch = 0.92;
        u.onstart = () => setState('speaking');
        u.onend = u.onerror = () => {
          setState('idle');
          resolve();
        };
        window.speechSynthesis.speak(u);
      }),
    [synthesisSupported],
  );

  const say = useCallback(
    async (text: string) => {
      push('jarvis', text);
      await speak(text);
    },
    [push, speak],
  );

  const handleUtterance = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) {
        setState('idle');
        return;
      }
      push('user', clean);
      setState('thinking');
      try {
        const reply = await respondRef.current(clean);
        if (reply) await say(reply);
        else setState('idle');
      } catch (e) {
        await say('I hit a problem processing that request.');
        console.error(e);
      }
    },
    [push, say],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    if (synthesisSupported) window.speechSynthesis.cancel();
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge, or type below.');
      return;
    }

    // Mic analyser for the live waveform (optional — recognition works without it).
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const ctx = audioCtxRef.current ?? new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        ctx.createMediaStreamSource(stream).connect(analyser);
        analyserRef.current = analyser;
      }
    } catch {
      /* Waveform falls back to a synthetic animation. */
    }

    const rec = new Ctor();
    rec.lang = navigator.language || 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = '';
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else text += r[0].transcript;
      }
      setInterim(finalText + text);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Microphone access was blocked. Allow it in your browser settings.');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') setError(`Voice error: ${e.error}`);
    };
    rec.onend = () => {
      recognitionRef.current = null;
      setInterim('');
      releaseMic();
      void handleUtterance(finalText);
    };
    recognitionRef.current = rec;
    setState('listening');
    rec.start();
  }, [handleUtterance, releaseMic, synthesisSupported]);

  const toggleListening = useCallback(() => {
    if (state === 'listening') stopListening();
    else void startListening();
  }, [state, startListening, stopListening]);

  const cancelSpeech = useCallback(() => {
    if (synthesisSupported) window.speechSynthesis.cancel();
    recognitionRef.current?.abort();
    setState('idle');
  }, [synthesisSupported]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      releaseMic();
      void audioCtxRef.current?.close();
    },
    [releaseMic],
  );

  return {
    state,
    interim,
    messages,
    error,
    muted,
    setMuted,
    analyserRef,
    recognitionSupported,
    synthesisSupported,
    startListening,
    stopListening,
    toggleListening,
    cancelSpeech,
    sendText: handleUtterance,
    say,
  };
}

export type VoiceController = ReturnType<typeof useVoice>;
