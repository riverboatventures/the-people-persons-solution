import {
  Activity, Atom, BookOpen, Bot, Brain, CalendarDays, Check, ChevronRight, Code2, Cpu, Database,
  FileText, Focus, Globe, LayoutGrid, ListChecks, Mail, MessageSquare, Mic, Play, Plus, ShieldCheck,
  TriangleAlert, GitPullRequest, Users, Workflow, Wrench, type LucideIcon,
} from 'lucide-react';

export const icons: Record<string, LucideIcon> = {
  grid: LayoutGrid,
  core: Atom,
  bot: Bot,
  file: FileText,
  calendar: CalendarDays,
  db: Database,
  chat: MessageSquare,
  book: BookOpen,
  wrench: Wrench,
  flow: Workflow,
  code: Code2,
  search: Globe,
  memory: Database,
  browser: Mail,
  tasks: ListChecks,
  system: ShieldCheck,
  alert: TriangleAlert,
  git: GitPullRequest,
  focus: Focus,
  cpu: Cpu,
  mail: Mail,
  users: Users,
  plus: Plus,
  mic: Mic,
  play: Play,
  brain: Brain,
  activity: Activity,
  check: Check,
  chevron: ChevronRight,
};

export function Icon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const C = icons[name] ?? Activity;
  return <C size={size} className={className} strokeWidth={1.6} />;
}
