// Seed data for the command center. Every list here is a placeholder that a
// real agent, calendar, or memory source will replace as they come online.

export type AgentState = 'active' | 'standby' | 'offline';

export interface Agent {
  id: string;
  name: string;
  role: string;
  state: AgentState;
  icon: 'code' | 'search' | 'memory' | 'browser' | 'tasks' | 'system';
  hue: number;
}

export const agents: Agent[] = [
  { id: 'ops', name: 'Operations Agent', role: 'Runs daily ops & SOPs', state: 'active', icon: 'system', hue: 160 },
  { id: 'research', name: 'Research Agent', role: 'Market & competitor intel', state: 'active', icon: 'search', hue: 190 },
  { id: 'memory', name: 'Memory Agent', role: 'Knowledge & recall', state: 'standby', icon: 'memory', hue: 275 },
  { id: 'outreach', name: 'Outreach Agent', role: 'Email, CRM & follow-ups', state: 'standby', icon: 'browser', hue: 35 },
  { id: 'tasks', name: 'Task Agent', role: 'Plans & tracks work', state: 'standby', icon: 'tasks', hue: 210 },
  { id: 'builder', name: 'Builder Agent', role: 'Code & automations', state: 'active', icon: 'code', hue: 150 },
];

export type FeedLevel = 'info' | 'warn' | 'tip' | 'live' | 'alert';

export interface FeedItem {
  id: string;
  title: string;
  source: string;
  level: FeedLevel;
  icon: 'calendar' | 'alert' | 'git' | 'focus' | 'cpu' | 'tasks' | 'mail' | 'users';
}

export const feed: FeedItem[] = [
  { id: 'f1', title: 'Weekly team sync with the client success crew', source: 'Meeting', level: 'info', icon: 'calendar' },
  { id: 'f2', title: '2 proposals are overdue — "Q4 onboarding package"', source: 'Overdue', level: 'warn', icon: 'alert' },
  { id: 'f3', title: '3 new leads are waiting for a first reply', source: 'CRM', level: 'tip', icon: 'users' },
  { id: 'f4', title: 'Your deep-work block is 2–4 PM. Notifications muted.', source: 'Focus', level: 'tip', icon: 'focus' },
  { id: 'f5', title: 'System load nominal', source: 'Telemetry', level: 'live', icon: 'cpu' },
  { id: 'f6', title: '2 tasks overdue', source: 'Review the board and reschedule', level: 'alert', icon: 'tasks' },
];

export interface Mission {
  time: string;
  title: string;
  status: string;
  progress: number; // 0..1
}

export const missions: Mission[] = [
  { time: '09:30', title: 'Daily standup', status: 'Done', progress: 1 },
  { time: '12:00', title: 'Finalize client proposal', status: 'In 42 min', progress: 0.7 },
  { time: '14:00', title: 'Deep-work block: agent workflows', status: 'In 2h 42m', progress: 0.35 },
  { time: '16:30', title: 'Design review — Command Center v1', status: 'In 5h 12m', progress: 0.1 },
];

export interface LlmProvider {
  name: string;
  status: 'connected' | 'not-linked' | 'no-models';
  hue: number;
}

export const llms: LlmProvider[] = [
  { name: 'Claude', status: 'connected', hue: 20 },
  { name: 'OpenAI', status: 'not-linked', hue: 160 },
  { name: 'Gemini', status: 'not-linked', hue: 220 },
  { name: 'Groq', status: 'not-linked', hue: 30 },
  { name: 'OpenRouter', status: 'not-linked', hue: 250 },
  { name: 'Ollama', status: 'no-models', hue: 0 },
  { name: 'Claude Code', status: 'connected', hue: 265 },
  { name: 'Voice MCP', status: 'not-linked', hue: 190 },
  { name: 'Browser Voice', status: 'connected', hue: 140 },
];

export const navItems = [
  { id: 'command', label: 'Command Center', icon: 'grid' },
  { id: 'core', label: 'AI Core', icon: 'core' },
  { id: 'agents', label: 'Agents', icon: 'bot' },
  { id: 'tasks', label: 'Tasks', icon: 'file', badge: 3 },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'memory', label: 'Memory', icon: 'db' },
  { id: 'conversations', label: 'Conversations', icon: 'chat', badge: 12 },
  { id: 'knowledge', label: 'Knowledge Base', icon: 'book' },
  { id: 'tools', label: 'Tools & Skills', icon: 'wrench', badge: 18 },
  { id: 'workflows', label: 'Workflows', icon: 'flow' },
] as const;

export const quickCommands = [
  { id: 'task', label: 'Start New Task', icon: 'plus', say: 'start a new task' },
  { id: 'calendar', label: 'Open Calendar', icon: 'calendar', say: 'open calendar' },
  { id: 'voice', label: 'Start Voice Chat', icon: 'mic', say: '' },
  { id: 'workflow', label: 'Run Workflow', icon: 'play', say: 'run workflow' },
] as const;
