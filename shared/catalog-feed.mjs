import { z } from 'zod';
export const CATALOG_FEED =
  'https://raw.githubusercontent.com/jianghaisi/AImainsi/main/shared/catalog-data.json';
const text = z.string().min(1).max(300);
const id = z
  .string()
  .regex(/^[a-zA-Z0-9-]+$/)
  .max(160);
const source = z
  .string()
  .url()
  .refine((s) => s.startsWith('https://leetcode.cn/'));
const schema = z.object({
  version: z.literal(1),
  updatedAt: z.string().datetime({ offset: true }),
  collections: z
    .array(
      z.object({
        id,
        name: text,
        description: z.string().max(1000),
        questionIds: z.array(id).min(1).max(5000),
        sourceUrl: z.union([source, z.literal('')]),
        sourceName: text,
        updatedAt: z.string(),
        kind: z.enum(['official', 'curated']),
      }),
    )
    .min(1)
    .max(100),
  questions: z
    .array(
      z.object({
        id,
        title: text,
        englishTitle: text,
        number: text,
        slug: id,
        topic: text,
        difficulty: text,
        tags: z.array(text).max(50),
        sourceUrl: source,
        paidOnly: z.boolean(),
        collections: z.array(id).max(100),
      }),
    )
    .min(1)
    .max(10000),
});
export function validateCatalog(raw) {
  const data = schema.parse(raw),
    ids = new Set(data.questions.map((q) => q.id)),
    planIds = new Set(data.collections.map((c) => c.id));
  if (ids.size !== data.questions.length || planIds.size !== data.collections.length)
    throw Error('题单存在重复标识');
  for (const c of data.collections)
    if (
      new Set(c.questionIds).size !== c.questionIds.length ||
      c.questionIds.some((id) => !ids.has(id))
    )
      throw Error('题单引用不完整');
  for (const q of data.questions)
    if (q.collections.some((id) => !planIds.has(id))) throw Error('题目所属题单不存在');
  return data;
}
