import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { questions, profiles, defaultSettings } from './seed.mjs';
import { addLanguages } from './languages.mjs';
const dir = process.env.DATA_DIR || path.resolve('.data');
mkdirSync(dir, { recursive: true });
const db = new DatabaseSync(path.join(dir, 'aimainsi.sqlite'));
db.exec(
  'PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
);
export function get(key) {
  const row = db.prepare('SELECT value FROM state WHERE key=?').get(key);
  const value = row ? JSON.parse(row.value) : null;
  if (key === 'settings' && value)
    for (const field of ['apiKey', 'judgeKey'])
      if (value[field]?.startsWith('enc:')) {
        if (!globalThis.sequenceSecrets) throw new Error('请在桌面应用中访问已加密的配置');
        value[field] = globalThis.sequenceSecrets.decrypt(value[field]);
      }
  return value;
}
export function put(key, value) {
  const stored = structuredClone(value);
  if (key === 'settings' && globalThis.sequenceSecrets)
    for (const field of ['apiKey', 'judgeKey'])
      if (stored[field]) stored[field] = globalThis.sequenceSecrets.encrypt(stored[field]);
  db.prepare(
    'INSERT INTO state(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
  ).run(key, JSON.stringify(stored));
  return value;
}
for (const [key, value] of Object.entries({
  questions,
  profiles,
  settings: defaultSettings,
  resume: { text: '', name: '', updatedAt: null },
  sessions: [],
  attempts: [],
  reviews: [],
  planDone: [],
  sources: { lastSync: null, lastError: null, added: 0, logs: [] },
}))
  if (get(key) === null) put(key, value);
put('questions', get('questions').map(addLanguages));
export function publicSettings() {
  const { apiKey, judgeKey, ...rest } = get('settings');
  return { ...rest, hasApiKey: !!apiKey, hasJudgeKey: !!judgeKey };
}
