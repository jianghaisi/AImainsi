import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { judge } from '../../public/judge.mjs';
test('all Hot 200 Python solutions execute in the packaged browser WASM runtime', async ({
  page,
}) => {
  await page.goto('/');
  const packs = fs
    .readdirSync('public/exercises')
    .map((f) => JSON.parse(fs.readFileSync('public/exercises/' + f, 'utf8')));
  const runtime = fs.readFileSync('public/exercise-runtime.py', 'utf8');
  const code = `
import json
_runtime_source = ${JSON.stringify(runtime)}
def solve(packs):
    rows = []
    for pack in packs:
        namespace = {}
        try:
            exec(_runtime_source, namespace)
            namespace['Node'] = namespace[{'138':'RandomNode','133':'GraphNode','427':'QuadNode'}.get(pack['number'], 'TreeNode')]
            namespace['_Node'] = namespace['Node']
            exec(pack['solutions']['python'], namespace)
            rows.append([namespace['_seq_run'](namespace, pack['adapter'], t['input']) for t in pack['tests']])
        except Exception as e:
            rows.append({'error':str(e), 'number':pack['number']})
    return rows
`;
  const result: any = await page.evaluate(
    ({ packs, code }) =>
      new Promise((resolve, reject) => {
        const worker = new Worker('/runner-v2.js', { type: 'module' });
        const timer = setTimeout(() => {
          worker.terminate();
          reject(Error('WASM test timed out'));
        }, 45000);
        worker.onmessage = ({ data }) => {
          if (data.results || data.error) {
            clearTimeout(timer);
            worker.terminate();
            resolve(data);
          }
        };
        worker.onerror = (e) => {
          clearTimeout(timer);
          worker.terminate();
          reject(Error(e.message));
        };
        worker.postMessage({ language: 'python', code, tests: [{ input: [packs], expected: [] }] });
      }),
    { packs, code },
  );
  expect(result.error).toBeUndefined();
  expect(result.results[0].error).toBeUndefined();
  const rows = result.results[0].actual;
  for (let p = 0; p < packs.length; p++) {
    expect(rows[p].error, `${packs[p].number}: ${rows[p].error}`).toBeUndefined();
    for (let i = 0; i < packs[p].tests.length; i++) {
      const t = packs[p].tests[i];
      expect(judge(rows[p][i], t.expected, t.input, packs[p].number), packs[p].number).toBe(true);
    }
  }
});
