import fs from 'node:fs';
import { load } from 'cheerio';
const pages = [
  ['huawei', '华为', 'https://onefly.top/zero2Leetcode/05_interview/coding/huawei/'],
  [
    'bytedance',
    '字节跳动',
    'https://onefly.top/zero2Leetcode/05_interview/coding/bytedance-202604/index.html',
  ],
  [
    'tencent',
    '腾讯',
    'https://onefly.top/zero2Leetcode/05_interview/coding/tencent-202604/index.html',
  ],
  ['meituan', '美团', 'https://onefly.top/zero2Leetcode/05_interview/coding/meituan/index.html'],
];
fs.mkdirSync('.tools/catalog/companies', { recursive: true });
const result = [];
for (const [id, name, url] of pages) {
  const file = `.tools/catalog/companies/${id}.html`;
  let html;
  if (process.argv.includes('--offline')) html = fs.readFileSync(file, 'utf8');
  else {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw Error(`${id}: ${r.status}`);
    html = await r.text();
    fs.writeFileSync(file, html);
  }
  const $ = load(html),
    main = $('main'),
    links = [];
  main.find('a').each((_, el) => {
    const a = $(el),
      title = a.text().trim(),
      href = a.attr('href') || '';
    const match =
      title.match(/(?:LeetCode|LC)\s*(\d+)/i) || href.match(/[?&](?:id|problem|problemId)=(\d+)/);
    if (match)
      links.push({
        number: match[1],
        title,
        sourceUrl: url,
        referenceUrl: new URL(href, url).href,
      });
  });
  const unique = [...new Map(links.map((q) => [q.number, q])).values()];
  if (!unique.length) throw Error('No question identifiers found: ' + id);
  result.push({
    id,
    name,
    sourceUrl: url,
    updatedAt: new Date().toISOString(),
    note: '来源文章中的面经样本与备考题单，非企业官方题库；不把样本频次视为出题概率。',
    questions: unique,
  });
}
fs.writeFileSync('shared/company-data.json', JSON.stringify(result, null, 2) + '\n');
console.log(result.map((c) => ({ company: c.name, questions: c.questions.length })));
