import fs from 'node:fs';
import vm from 'node:vm';
import { createExercise } from '../public/exercise-runtime.mjs';
import { judge } from '../public/judge.mjs';
const python = JSON.parse(fs.readFileSync('.tools/catalog/python-results.json', 'utf8'));
const failures = [];
let count = 0;
for (const file of fs.readdirSync('public/exercises')) {
  const p = JSON.parse(fs.readFileSync('public/exercises/' + file, 'utf8'));
  for (const lang of ['python', 'javascript']) {
    if (!p.solutions[lang]) continue;
    try {
      const run = lang === 'javascript' ? createExercise(p.solutions[lang], p.adapter) : null;
      const values = python.find((r) => r.number === p.number)?.output;
      for (let i = 0; i < p.tests.length; i++) {
        const t = p.tests[i],
          result = run
            ? {
                actual: vm.runInNewContext(
                  'run(input)',
                  { run, input: t.input },
                  { timeout: 1000 },
                ),
              }
            : values?.[i];
        count++;
        if (!result || result.error || !judge(result.actual, t.expected, t.input, p.number))
          failures.push({ number: p.number, lang, i, ...result, expected: t.expected });
      }
    } catch (e) {
      failures.push({ number: p.number, lang, error: e.stack });
    }
  }
}
fs.writeFileSync('.tools/catalog/check-failures.json', JSON.stringify(failures, null, 2));
console.log(
  JSON.stringify(
    {
      count,
      failures: failures.map((f) => [
        f.number,
        f.lang,
        f.i,
        f.error?.split('\n').slice(-2).join(' ') || [f.actual, f.expected],
      ]),
    },
    null,
    2,
  ),
);
process.exitCode = failures.length ? 1 : 0;
