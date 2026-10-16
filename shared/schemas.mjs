import { z } from 'zod';
const str = z.string().trim();
export const settingsSchema = z.object({
  name: str.min(1).max(60),
  targetCompany: str.max(100),
  role: str.min(1).max(100),
  language: z.enum(['python', 'javascript', 'java', 'cpp']),
  interviewLanguage: z.enum(['zh', 'en']),
  minutes: z.number().int().min(5).max(120),
  rounds: z.number().int().min(1).max(15),
  dailyMinutes: z.number().int().min(10).max(240),
  accent: z.string().regex(/^#[\da-f]{6}$/i),
  reducedMotion: z.boolean(),
  apiUrl: str.max(1000),
  apiKey: z.string().max(4000).optional(),
  model: str.max(200),
  temperature: z.number().min(0).max(2),
  systemPrompt: str.max(4000),
  judgeUrl: str.max(1000),
  judgeKey: z.string().max(4000).optional(),
  syncHours: z.number().int().min(1).max(168),
  autoSync: z.boolean(),
});
export const feedbackSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(10),
  weaknesses: z.array(z.string()).max(10),
  summary: z.string().min(1).max(6000),
});
export const profileSchema = z.object({
  id: str.min(1).max(100),
  name: str.min(1).max(60),
  en: str.max(60),
  color: str.regex(/^#[\da-f]{6}$/i),
  role: str.min(1).max(100),
  focus: z.array(str.min(1).max(60)).min(1).max(12),
  style: str.min(1).max(4000),
  evidence: str.max(200),
  sourceUrl: str.max(1000),
});
