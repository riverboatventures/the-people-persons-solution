// Jarvis' "brain" — a local intent router. It answers instantly with no network
// so the interface is fully usable today. When the agent layer lands, unmatched
// requests get forwarded to the orchestrator instead of the fallback reply.
import { agents, feed, missions } from '../data/dashboard';
import type { SystemStats } from '../hooks/useSystemStats';

export type JarvisAction =
  | { type: 'navigate'; target: string }
  | { type: 'focus'; on: boolean }
  | { type: 'briefing' }
  | { type: 'stop' };

export interface JarvisReply {
  text: string;
  action?: JarvisAction;
}

export interface BrainContext {
  stats: SystemStats;
  operator: string;
  focus: boolean;
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

export function greeting(operator: string, now = new Date()) {
  const h = now.getHours();
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${part}, ${operator}. All systems are online. How can I help?`;
}

export function executiveBriefing(ctx: BrainContext, now = new Date()) {
  const active = agents.filter((a) => a.state === 'active');
  const next = missions.find((m) => m.progress < 1);
  const warnings = feed.filter((f) => f.level === 'warn' || f.level === 'alert');
  const date = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return [
    `Executive briefing for ${date}.`,
    `${active.length} of ${agents.length} agents are active: ${active.map((a) => a.name.replace(' Agent', '')).join(', ')}.`,
    next ? `Your next mission is "${next.title}" at ${next.time}.` : 'Your schedule is clear.',
    warnings.length
      ? `There ${warnings.length === 1 ? 'is one item' : `are ${warnings.length} items`} needing attention: ${warnings.map((w) => w.title.split('—')[0].trim()).join('; ')}.`
      : 'Nothing needs your attention.',
    `System load is ${ctx.stats.cpu} percent CPU and ${ctx.stats.ram} percent memory.`,
  ].join(' ');
}

export function think(input: string, ctx: BrainContext): JarvisReply {
  const q = input.toLowerCase().trim();
  const now = new Date();

  if (!q) return { text: 'I did not catch that.' };
  if (has(q, 'stop', 'be quiet', 'cancel', 'never mind', 'nevermind')) return { text: 'Standing by.', action: { type: 'stop' } };
  if (/\b(hello|hi|hey|good (morning|afternoon|evening))\b/.test(q) || q === 'jarvis') return { text: greeting(ctx.operator, now) };
  if (has(q, 'time')) return { text: `It is ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.` };
  if (has(q, 'date', 'what day')) return { text: `Today is ${now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.` };
  if (has(q, 'brief', 'summary', 'catch me up', 'rundown')) return { text: executiveBriefing(ctx, now), action: { type: 'briefing' } };
  if (has(q, 'status', 'system', 'cpu', 'memory usage', 'diagnostic'))
    return {
      text: `All systems optimal. CPU at ${ctx.stats.cpu} percent, memory at ${ctx.stats.ram} percent${ctx.stats.disk != null ? `, disk at ${ctx.stats.disk} percent` : ''}.`,
    };
  if (has(q, 'agent', 'team')) {
    const active = agents.filter((a) => a.state === 'active');
    return {
      text: `You have ${agents.length} agents on the team. ${active.map((a) => a.name).join(', ')} ${active.length === 1 ? 'is' : 'are'} active; the rest are on standby.`,
      action: { type: 'navigate', target: 'agents' },
    };
  }
  if (has(q, 'schedule', 'calendar', 'agenda', 'mission', 'next meeting')) {
    const upcoming = missions.filter((m) => m.progress < 1);
    return {
      text: upcoming.length
        ? `Next up: ${upcoming.map((m) => `${m.title} at ${m.time}`).join(', then ')}.`
        : 'Your schedule is clear for the rest of the day.',
      action: { type: 'navigate', target: 'calendar' },
    };
  }
  if (has(q, 'focus mode', 'deep work', 'do not disturb')) {
    const on = !has(q, 'off', 'disable', 'end', 'exit');
    return { text: on ? 'Focus mode engaged. I will hold non-critical alerts.' : 'Focus mode disengaged.', action: { type: 'focus', on } };
  }
  if (has(q, 'task')) return { text: 'Task intake is ready. Once the Task Agent is wired up, I will create and assign it for you.', action: { type: 'navigate', target: 'tasks' } };
  if (has(q, 'workflow')) return { text: 'Workflows are next on the build list. I will be able to run them on command once they are defined.', action: { type: 'navigate', target: 'workflows' } };
  if (has(q, 'who are you', 'what are you', 'your name'))
    return { text: 'I am Jarvis, the command interface for The People Persons. I coordinate your team of AI agents.' };
  if (has(q, 'thank')) return { text: `Always a pleasure, ${ctx.operator}.` };

  return {
    text: `Understood: "${input.trim()}". My agent network is not connected yet, so I cannot act on that one — but I have logged it for when it is.`,
  };
}
