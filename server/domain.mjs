import { inferTopic } from '../shared/learning.mjs';
export {
  inferTopic,
  nextReview,
  coverageFeedback,
  selectPrompt,
  growth,
} from '../shared/learning.mjs';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import { SOURCE } from './seed.mjs';
export const hash = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 20);
export function parseSource(html) {
  const $ = cheerio.load(html);
  const found = new Map();
  const main = $('main').length ? $('main') : $('body');
  main.find('a[href]').each((_, el) => {
    const label = $(el).text().trim(),
      href = $(el).attr('href');
    if (
      !/(leetcode\.(cn|com)\/problems|codefun2000\.com)/.test(href || '') ||
      label.length < 3 ||
      label.length > 100 ||
      /题解|教程|练习|流程|方法论|攻略|笔记|LeetCode|Hot 100/.test(label)
    )
      return;
    const url = new URL(href, SOURCE).href;
    const id = 'ref-' + hash(url);
    found.set(id, {
      id,
      title: label,
      kind: 'reference',
      topic: inferTopic(label),
      company: '华为',
      difficulty: '待评估',
      description: '来源收录的题目索引。打开原文阅读完整题意；尚无本地测试用例。',
      source: 'Zero2Leetcode',
      sourceUrl: url,
      originUrl: SOURCE,
      status: 'published',
      createdAt: new Date().toISOString(),
    });
  });
  // Tables may list ML topics as plain text; retain only short title metadata.
  main.find('tr').each((_, el) => {
    const cells = $(el).find('td'),
      label = cells.first().text().trim();
    if (
      cells.length >= 2 &&
      /^(Self-Attention|MHA|K-Means|反向传播|Conv2d|Linear Layer|LSTM)/.test(label)
    ) {
      const id = 'ref-' + hash(label);
      found.set(id, {
        id,
        title: label,
        kind: 'reference',
        topic: inferTopic(label),
        company: '华为',
        difficulty: '待评估',
        description: 'AI 方向手撕考点索引，参见原始面经统计。',
        source: 'Zero2Leetcode',
        sourceUrl: SOURCE,
        status: 'published',
        createdAt: new Date().toISOString(),
      });
    }
  });
  return [...found.values()];
}
export function importNotes(records, company = '通用') {
  if (!Array.isArray(records) || records.length > 500)
    throw new Error('请导入最多 500 条记录的 JSON 数组');
  return records
    .map((record) => {
      const r = record.note_card || record;
      const title = String(r.title || r.标题 || r.笔记标题 || '').trim();
      const description = String(
        r.desc || r.content || r.description || r.内容 || r.笔记内容 || '',
      ).trim();
      if (!title && !description) return null;
      const url = String(r.url || r.note_url || r.笔记链接 || '');
      const safeUrl = /^https?:\/\//.test(url) ? url : '';
      return {
        id: 'xhs-' + hash(safeUrl || title + description),
        title: (title || description.slice(0, 60)).slice(0, 180),
        description: description.slice(0, 15000),
        kind: 'reference',
        topic: inferTopic(title + description),
        company,
        difficulty: '待评估',
        source: 'Spider_XHS 导入',
        sourceUrl: safeUrl,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    })
    .filter(Boolean);
}
