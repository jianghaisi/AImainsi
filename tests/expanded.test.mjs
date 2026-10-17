import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import initSqlJs from 'sql.js';
import { runSQL } from '../public/sql-runtime.mjs';
import { judge } from '../public/judge.mjs';
import { mergeCatalog, catalogSnapshot } from '../shared/catalog.mjs';
import { questions } from '../server/seed.mjs';
test('company classification is attributed, multi-valued, and retains legacy progress IDs', () => {
  const merged = mergeCatalog(questions),
    counts = {
      'company-huawei': 71,
      'company-bytedance': 52,
      'company-tencent': 50,
      'company-meituan': 34,
    };
  for (const [id, count] of Object.entries(counts)) {
    const plan = catalogSnapshot.collections.find((c) => c.id === id);
    assert.equal(plan.questionIds.length, count);
    assert(plan.sourceUrl.startsWith('https://onefly.top/'));
    for (const qid of plan.questionIds) {
      const q = merged.find((q) => q.id === qid);
      assert.equal(q.kind, 'coding');
      assert(q.companies.includes(plan.name.replace('面经题单', '')));
    }
  }
  assert(merged.find((q) => q.id === 'substring').companies.includes('华为'));
  assert(merged.some((q) => q.companies?.length > 1));
});
test('SQLite exercises execute offline with NULL and empty-table cases', async () => {
  const SQL = await initSqlJs();
  for (const n of ['584', '1757']) {
    const p = JSON.parse(fs.readFileSync(`public/exercises/${n}.json`, 'utf8'));
    for (const t of p.tests)
      assert(judge(runSQL(SQL, p.solutions.sql, p.adapter, t.input), t.expected, t.input, n));
    assert.throws(() => runSQL(SQL, '', p.adapter, p.tests[0].input));
    assert.throws(() =>
      runSQL(SQL, `SELECT * FROM ${p.adapter.sqlTable}`, p.adapter, p.tests[0].input),
    );
  }
});
test('expanded multi-answer judges reject plausible wrong answers', () => {
  assert(judge('eert', 'tree', ['tree'], '451'));
  assert(!judge('etre', 'tree', ['tree'], '451'));
  assert(!judge([1, 2, 3], [1, 2, 3], [[3, 2, 1]], 'LCR 139'));
  assert(
    !judge(
      [
        [0, 0],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      [
        [
          [0, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
      ],
      '面试题 08.02',
    ),
  );
  assert(!judge([2, 1, 0], [0, 1, 2], [3, 1, [0, 0, 0], [[], [0], [1]]], '1203'));
  assert(!judge(Array(2000).fill(1), [], [2000], '470'));
  assert(
    !judge(
      [null, ...Array(1200).fill(0)],
      [],
      [
        ['Solution', ...Array(1200).fill('pickIndex')],
        [[[1, 3]], ...Array.from({ length: 1200 }, () => [])],
      ],
      '528',
    ),
  );
  assert(
    !judge(['hit', 'cog'], ['hit', 'hot', 'cog'], ['hit', 'cog', ['hot', 'cog']], '面试题 17.22'),
  );
});
