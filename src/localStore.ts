import type { AppState } from './types';
import { questions, profiles, defaultSettings } from '../server/seed.mjs';
import { addLanguages } from '../server/languages.mjs';
import { growth } from '../shared/learning.mjs';
import { mergeCatalog, catalogSnapshot, currentCatalog } from '../shared/catalog.mjs';
export interface StoredState extends AppState {
  version: number;
}
const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('sequence-personal', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('state');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function readLocal(): Promise<StoredState> {
  const db = await dbPromise;
  const result = await new Promise<StoredState | undefined>((resolve, reject) => {
    const request = db.transaction('state', 'readonly').objectStore('state').get('personal');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (result) {
    result.catalog = currentCatalog(result.catalog);
    result.questions = mergeCatalog(result.questions.map(addLanguages), result.catalog);
    result.questionProgress ||= {};
    result.growth = growth(result.questions, result.attempts, result.sessions);
    return result;
  }
  const initial: StoredState = {
    version: 1,
    settings: { ...defaultSettings, hasApiKey: false, hasJudgeKey: false },
    questions: mergeCatalog(questions.map(addLanguages)),
    profiles,
    resume: { text: '', name: '', updatedAt: null },
    sessions: [],
    attempts: [],
    reviews: [],
    planDone: [],
    questionProgress: {},
    catalog: catalogSnapshot,
    growth: [],
    sources: { lastSync: null, lastError: null, added: 0, logs: [] },
  };
  delete initial.settings.apiKey;
  delete initial.settings.judgeKey;
  await writeLocal(initial);
  return structuredClone(initial);
}
export async function writeLocal(value: StoredState) {
  const db = await dbPromise;
  const clean = structuredClone(value);
  delete clean.settings.apiKey;
  delete clean.settings.judgeKey;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('state', 'readwrite');
    tx.objectStore('state').put(clean, 'personal');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
let pending = Promise.resolve();
export function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = pending.then(fn, fn);
  pending = next.then(
    () => {},
    () => {},
  );
  return next;
}
