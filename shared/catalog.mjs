import catalog from './catalog-data.json' with { type: 'json' };
import manifest from './exercise-manifest.json' with { type: 'json' };
import guides from './exercise-guides.json' with { type: 'json' };

export const collections = catalog.collections;
export const catalogUpdatedAt = catalog.updatedAt;
export const catalogSnapshot = catalog;
export function currentCatalog(saved) {
  return saved && Date.parse(saved.updatedAt) >= Date.parse(catalog.updatedAt) ? saved : catalog;
}
// Historical IDs retain their solve() contract and saved drafts.
const legacy = new Set(['substring', 'brackets', 'merge', 'islands', 'coins', 'binary']);
export function mergeCatalog(existing, snapshot = catalog) {
  const map = new Map(existing.map((q) => [q.id, q]));
  for (const entry of snapshot.questions) {
    const old = map.get(entry.id),
      pack = manifest[entry.id],
      guide = guides[entry.number];
    if (old && legacy.has(entry.id)) {
      map.set(entry.id, {
        ...old,
        number: entry.number,
        collections: entry.collections,
        slug: entry.slug,
      });
      continue;
    }
    map.set(entry.id, {
      ...old,
      ...entry,
      kind: pack ? 'coding' : 'reference',
      status: 'published',
      company: '通用',
      source: 'LeetCode · 公开题单索引',
      createdAt: old?.createdAt || snapshot.updatedAt,
      description:
        guide?.[0] ||
        '本题提供题单索引与学习记录。请打开原题阅读完整题意，在原站练习后回到这里记录进度。',
      explanation: guide?.[1],
      memory: guide?.[2],
      ...(pack ? { ...pack, exercisePack: entry.number } : {}),
    });
  }
  return [...map.values()];
}
export function questionStatus(id, attempts, progress = {}) {
  const last = attempts.findLast((a) => a.questionId === id);
  if (last?.total > 0 && last.passed === last.total) return 'passed';
  if (progress[id]?.completed) return 'manual';
  if (last) return 'practicing';
  return 'new';
}
export function updateProgress(questions, progress, input) {
  if (!input || !questions.some((q) => q.id === input.questionId)) throw new Error('题目不存在');
  const patch = {};
  for (const key of ['bookmarked', 'completed'])
    if (key in input) {
      if (typeof input[key] !== 'boolean') throw new Error('学习标记格式不正确');
      patch[key] = input[key];
    }
  if ('note' in input) {
    if (typeof input.note !== 'string' || input.note.length > 5000)
      throw new Error('笔记最多 5000 字');
    patch.note = input.note;
  }
  return {
    ...progress,
    [input.questionId]: {
      ...progress[input.questionId],
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  };
}
