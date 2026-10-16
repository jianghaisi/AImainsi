export type Lang = 'python' | 'javascript' | 'java' | 'cpp';
export interface Settings {
  name: string;
  targetCompany: string;
  role: string;
  language: Lang;
  interviewLanguage: 'zh' | 'en';
  minutes: number;
  rounds: number;
  dailyMinutes: number;
  accent: string;
  reducedMotion: boolean;
  apiUrl: string;
  apiKey?: string;
  hasApiKey: boolean;
  model: string;
  temperature: number;
  systemPrompt: string;
  judgeUrl: string;
  judgeKey?: string;
  hasJudgeKey: boolean;
  syncHours: number;
  autoSync: boolean;
}
export interface Profile {
  id: string;
  name: string;
  en: string;
  color: string;
  role: string;
  focus: string[];
  style: string;
  evidence: string;
  sourceUrl: string;
}
export interface TestCase {
  input: unknown[];
  expected: unknown;
}
export interface Question {
  number?: string;
  slug?: string;
  englishTitle?: string;
  collections?: string[];
  paidOnly?: boolean;
  exercisePack?: string;
  adapter?: {
    name?: string;
    classname?: string;
    systemdesign?: boolean;
    number: string;
    [key: string]: unknown;
  };
  credits?: Partial<Record<Lang, string>>;
  id: string;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  kind: 'coding' | 'concept' | 'reference';
  company: string;
  source: string;
  sourceUrl: string;
  status: 'pending' | 'published';
  createdAt: string;
  args?: string[];
  tests?: TestCase[];
  solutions?: Partial<Record<Lang, string>>;
  starters?: Record<Lang, string>;
  explanation?: string;
  memory?: string;
}
export interface Feedback {
  score: number | null;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  mode: string;
}
export interface Turn {
  question: string;
  topic: string;
  answer?: string;
  feedback?: Feedback;
  answeredAt?: string;
}
export interface Session {
  id: string;
  companyId: string;
  companyName: string;
  role: string;
  language: 'zh' | 'en';
  rounds: number;
  minutes: number;
  mode: 'local' | 'ai';
  startedAt: string;
  finishedAt?: string;
  status: 'active' | 'completed';
  turns: Turn[];
}
export interface Result {
  passed: boolean;
  actual?: unknown;
  error?: string;
}
export interface Attempt {
  id: string;
  questionId: string;
  language: Lang;
  passed: number;
  total: number;
  code: string;
  duration: number;
  results: Result[];
  at: string;
}
export interface Review {
  questionId: string;
  stage: number;
  dueAt: string;
}
export interface AppState {
  catalog: {
    updatedAt: string;
    collections: {
      id: string;
      name: string;
      description: string;
      questionIds: string[];
      sourceUrl: string;
    }[];
  };
  settings: Settings;
  resume: { name: string; text: string; updatedAt: string | null };
  profiles: Profile[];
  questions: Question[];
  sessions: Session[];
  attempts: Attempt[];
  reviews: Review[];
  sources: {
    lastSync: string | null;
    lastError: string | null;
    added: number;
    logs: { at: string; ok: boolean; message: string }[];
  };
  planDone: string[];
  questionProgress: Record<
    string,
    { bookmarked?: boolean; completed?: boolean; note?: string; updatedAt?: string }
  >;
  growth: { topic: string; count: number; score: number | null }[];
}
export type Page =
  | 'dashboard'
  | 'interview'
  | 'bank'
  | 'coding'
  | 'growth'
  | 'sources'
  | 'settings';
