import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { collections, mergeCatalog, updateProgress, questionStatus } from '../shared/catalog.mjs';
import { questions } from '../server/seed.mjs';
import { createExercise } from '../public/exercise-runtime.mjs';
import { judge } from '../public/judge.mjs';
import { validateCatalog } from '../shared/catalog-feed.mjs';
import { catalogSnapshot } from '../shared/catalog.mjs';
const packs = fs
  .readdirSync('public/exercises')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync('public/exercises/' + f, 'utf8')));
test('catalog updates only accept complete metadata and discard executable fields', () => {
  assert.equal(validateCatalog(catalogSnapshot).questions.length, 647);
  const data = structuredClone(catalogSnapshot);
  data.questions[0].solutions = { python: 'unsafe remote code' };
  assert.equal(validateCatalog(data).questions[0].solutions, undefined);
  data.questions[0].sourceUrl = 'javascript:alert(1)';
  assert.throws(() => validateCatalog(data));
  data.questions[0].sourceUrl = catalogSnapshot.questions[0].sourceUrl;
  data.collections[0].questionIds.push('missing');
  assert.throws(() => validateCatalog(data));
});
test('catalog has complete deduplicated plans and preserves historical drafts/contracts', () => {
  const merged = mergeCatalog(questions);
  assert.equal(collections.length, 12);
  assert.equal(collections.find((c) => c.id === 'hot100').questionIds.length, 100);
  assert.equal(collections.find((c) => c.id === 'hot200').questionIds.length, 200);
  assert.equal(new Set(collections.flatMap((c) => c.questionIds)).size, 647);
  assert.equal(new Set(merged.map((q) => q.id)).size, merged.length);
  for (const c of collections)
    for (const id of c.questionIds) assert(merged.some((q) => q.id === id));
  for (const old of questions) {
    const next = merged.find((q) => q.id === old.id);
    assert.equal(next.solutions?.python, old.solutions?.python);
  }
  assert.deepEqual(mergeCatalog(merged), merged);
  const custom = { id: 'custom-1', title: '我的问题', kind: 'concept' };
  assert.deepEqual(
    mergeCatalog([...questions, custom]).find((q) => q.id === custom.id),
    custom,
  );
});
test('manual progress is independent from judged attempts and validates updates', () => {
  const q = mergeCatalog(questions),
    id = 'lc-two-sum';
  const p = updateProgress(
    q,
    {},
    { questionId: id, completed: true, bookmarked: true, note: '先找补数' },
  );
  assert.equal(questionStatus(id, [], p), 'manual');
  assert.equal(questionStatus(id, [{ questionId: id, passed: 2, total: 2 }], p), 'passed');
  assert.equal(
    questionStatus(
      id,
      [
        { questionId: id, passed: 2, total: 2 },
        { questionId: id, passed: 0, total: 2 },
      ],
      {},
    ),
    'practicing',
  );
  assert.equal(updateProgress(q, p, { questionId: id, completed: false })[id].note, '先找补数');
  assert.throws(() => updateProgress(q, p, { questionId: id, note: 'x'.repeat(5001) }));
  assert.throws(() => updateProgress(q, p, { questionId: 'missing', completed: true }));
  assert.throws(() => updateProgress(q, p, { questionId: id, completed: 'yes' }));
});
test('all Hot 200 packs contain usable tests, four language templates and memory guides', () => {
  assert.equal(packs.length, 200);
  for (const p of packs) {
    assert(p.tests.length > 0, p.number);
    for (const t of p.tests) assert.notEqual(t.expected, undefined, p.number);
    for (const lang of ['python', 'javascript', 'java', 'cpp'])
      assert(p.starters[lang]?.length > 10, p.number + lang);
    for (const key of ['description', 'explanation', 'memory'])
      assert(p[key].length >= 8, p.number + key);
    assert(p.solutions.python);
  }
});
test('every bundled JavaScript reference passes its exercise adapter', () => {
  for (const p of packs) {
    if (!p.solutions.javascript) continue;
    const run = createExercise(p.solutions.javascript, p.adapter);
    for (const t of p.tests) assert(judge(run(t.input), t.expected, t.input, p.number), p.number);
  }
});
test('all 200 Python templates compile and references pass the production adapter', () => {
  const result = spawnSync(process.env.PYTHON || 'python', ['scripts/check-exercises.py'], {
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(result.status, 0, result.stderr);
  const rows = JSON.parse(fs.readFileSync('.tools/catalog/python-results.json', 'utf8'));
  for (const p of packs) {
    const row = rows.find((r) => r.number === p.number);
    for (let i = 0; i < p.tests.length; i++) {
      assert(!row.output[i]?.error, `${p.number}: ${row.output[i]?.error}`);
      assert(
        judge(row.output[i]?.actual, p.tests[i].expected, p.tests[i].input, p.number),
        p.number,
      );
    }
  }
});
test('judges accept valid alternate answers and reject structurally wrong outputs', () => {
  assert(judge([1, 0], [0, 1], [[2, 7], 9], '1'));
  assert(!judge([0, 0], [0, 1], [[2, 7], 9], '1'));
  assert(judge('aba', 'bab', ['babad'], '5'));
  assert(!judge('bad', 'bab', ['babad'], '5'));
  assert(judge([1, 0], [0, 1], [2, []], '210'));
  assert(!judge([1, 0], [0, 1], [2, [[1, 0]]], '210'));
  const p = packs.find((p) => p.number === '138');
  assert.throws(
    () =>
      createExercise('function copyRandomList(head){return head;}', p.adapter)(p.tests[0].input),
    /复制/,
  );
  assert(
    !judge(
      [null, true, 999],
      [],
      [
        ['RandomizedSet', 'insert', 'getRandom'],
        [[], [1], []],
      ],
      '380',
    ),
  );
});
