import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  parseSource,
  importNotes,
  nextReview,
  coverageFeedback,
  selectPrompt,
  growth,
} from '../server/domain.mjs';
import { questions, profiles } from '../server/seed.mjs';
test('source parsing keeps problem metadata and deduplicates links', () => {
  const result = parseSource(
    '<main><a href="https://leetcode.cn/problems/two-sum/">1. 两数之和</a><a href="https://leetcode.cn/problems/two-sum/">1. 两数之和</a><a href="https://example.com/login">登录</a></main>',
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, 'reference');
  assert.equal(result[0].status, 'published');
});
test('notes preserve provenance, quarantine imports and reject unsafe source links', () => {
  const records = importNotes(
    [{ note_card: { title: 'RAG 面经', desc: '检索质量如何评估', url: 'javascript:alert(1)' } }],
    '华为',
  );
  assert.equal(records[0].topic, 'RAG');
  assert.equal(records[0].status, 'pending');
  assert.equal(records[0].sourceUrl, '');
  assert.equal(records[0].id, importNotes([{ title: 'RAG 面经', desc: '检索质量如何评估' }])[0].id);
});
test('spaced repetition advances and lapses reset to ten minutes', () => {
  const now = Date.UTC(2026, 9, 17);
  const first = nextReview(null, 'good', now);
  assert.equal(Date.parse(first.dueAt) - now, 86400000);
  const second = nextReview(first, 'good', now);
  assert.equal(Date.parse(second.dueAt) - now, 3 * 86400000);
  const lapse = nextReview(second, 'again', now);
  assert.equal(lapse.stage, 0);
  assert.equal(Date.parse(lapse.dueAt) - now, 600000);
});
test('local feedback never invents a semantic score; resume content affects question', () => {
  assert.equal(coverageFeedback('因为我们做了对照实验').score, null);
  assert.match(
    selectPrompt('我负责混合检索与多路召回，改进知识库覆盖率', profiles[0], 0),
    /混合检索/,
  );
  assert.match(
    selectPrompt('Implemented a RAG system with offline evaluation', profiles[0], 0, true),
    /RAG/,
  );
});
test('growth uses most recent attempt per question', () => {
  const result = growth(
    questions,
    [
      { questionId: 'attention', passed: 0, total: 4 },
      { questionId: 'attention', passed: 4, total: 4 },
    ],
    [],
  );
  assert.equal(result[0].score, 100);
  assert.equal(result[0].count, 1);
});
const approx = (a, b) =>
  typeof a === 'number' && typeof b === 'number'
    ? Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(b))
    : Array.isArray(a) && Array.isArray(b)
      ? a.length === b.length && a.every((x, i) => approx(x, b[i]))
      : JSON.stringify(a) === JSON.stringify(b);
for (const q of questions.filter((q) => q.kind === 'coding')) {
  test(`Python reference solution: ${q.id}`, () => {
    const script =
      q.solutions.python +
      '\nimport json, sys\ntests=json.load(sys.stdin)\nprint(json.dumps([solve(*t["input"]) for t in tests]))';
    const result = spawnSync('python', ['-c', script], {
      input: JSON.stringify(q.tests),
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr);
    const actual = JSON.parse(result.stdout);
    q.tests.forEach((t, i) =>
      assert.ok(approx(actual[i], t.expected), `${q.id} case ${i}: ${JSON.stringify(actual[i])}`),
    );
  });
  if (q.solutions.javascript)
    test(`JavaScript reference solution: ${q.id}`, () => {
      const solve = new Function(q.solutions.javascript + '; return solve;')();
      for (const t of q.tests) assert.ok(approx(solve(...structuredClone(t.input)), t.expected));
    });
}
