import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { load } from 'cheerio';
import { parse } from '@babel/parser';
import generator from '@babel/generator';
const generate = generator.default || generator;
const root = '.tools/neetcode-solutions';
const commit = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (commit !== 'd5ebb3ea8bd4b52d605bc7aa179e22af684d31bb')
  throw Error('Reference checkout differs from reviewed commit');
const paths = execFileSync('git', ['-C', root, 'ls-tree', '-r', '--name-only', 'HEAD'], {
  encoding: 'utf8',
}).split('\n');
const catalog = JSON.parse(fs.readFileSync('shared/catalog-data.json', 'utf8'));
const ids = new Set(catalog.collections.find((c) => c.id === 'hot200').questionIds);
const problems = catalog.questions.filter((q) => ids.has(q.id));
const overrides = JSON.parse(fs.readFileSync('scripts/exercise-overrides.json', 'utf8'));
const guideRows = ['scripts/exercise-guides.tsv', 'scripts/extra-guides.tsv'].flatMap((file) =>
  fs
    .readFileSync(file, 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split('|')),
);
if (guideRows.some((row) => row.length !== 4))
  throw Error('A guide must have number, description, explanation and memory columns');
const summaries = Object.fromEntries(guideRows.map(([id, ...fields]) => [id, fields]));
fs.writeFileSync('shared/exercise-guides.json', JSON.stringify(summaries, null, 2) + '\n');
const originalPython = JSON.parse(fs.readFileSync('scripts/original-python.json', 'utf8'));
const missing = [];
const manifest = {};
fs.mkdirSync('public/exercises', { recursive: true });
fs.copyFileSync(root + '/LICENSE', 'public/licenses/NeetCode-MIT.txt');
function cleanJS(code) {
  const ast = parse(code, { sourceType: 'script', errorRecovery: true });
  const seen = new Set();
  ast.program.body = ast.program.body
    .reverse()
    .filter((node) => {
      let names = [];
      if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration')
        names = [node.id.name];
      if (node.type === 'VariableDeclaration')
        names = node.declarations.filter((d) => d.id.type === 'Identifier').map((d) => d.id.name);
      if (names.some((n) => seen.has(n))) return false;
      names.forEach((n) => seen.add(n));
      return true;
    })
    .reverse();
  return generate(ast, { comments: true }).code;
}
for (const q of problems) {
  const raw = JSON.parse(fs.readFileSync(`.tools/catalog/meta/${q.slug}.json`, 'utf8'));
  const meta = { ...JSON.parse(raw.metaData), number: q.number };
  const own = overrides[q.number] || {};
  const arity = meta.systemdesign ? 2 : meta.params.length;
  const lines = raw.exampleTestcases
    .split('\n')
    .filter((s) => s.trim())
    .map((s) => JSON.parse(s));
  const inputs = [];
  for (let i = 0; i < lines.length; i += arity) inputs.push(lines.slice(i, i + arity));
  const $ = load(raw.content);
  const outputs = $.text()
    .replaceAll('\u00a0', ' ')
    .split(/Output\s*(?::|\n)/)
    .slice(1)
    .map((s) => s.split(/Explanation:?|Example \d:|Constraints:/)[0].trim());
  let tests = inputs.map((input, i) => {
    let expected;
    const output = outputs[i] || '';
    try {
      const value = output.replaceAll('#', '"#"');
      if (['26', '27', '80', '443'].includes(q.number)) {
        const size = Number(output.match(/^\d+/)?.[0]);
        const arr = output.match(/(?:nums|chars)\s*=\s*(\[[\s\S]*?\])/);
        expected = JSON.parse(arr[1].replaceAll('_', 'null')).slice(0, size);
      } else {
        if (value.startsWith('[')) {
          for (let end = 2; end <= value.length; end++)
            if (value[end - 1] === ']')
              try {
                expected = JSON.parse(value.slice(0, end));
                break;
              } catch {}
        } else
          expected = JSON.parse(
            value.match(/^("[^"\n]*"|true|false|null|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i)?.[1],
          );
      }
    } catch {}
    if (q.number === '142') expected = input[1];
    if (q.number === '160') expected = input[0] || null;
    if (q.number === '114' && Array.isArray(expected))
      expected = expected.filter((v) => v !== null);
    if (q.number === '427' && Array.isArray(expected))
      expected = expected.filter((v) => v !== null).map((v) => [v[0], v[0] ? v[1] : 0]);
    return { input, expected };
  });
  if (own.tests) tests = own.tests;
  if (own.extraTests) tests.push(...own.extraTests);
  if (tests.some((t) => t.expected === undefined) || !tests.length)
    missing.push(['tests', q.number, q.slug]);
  const solutions = {},
    credits = {};
  for (const [lang, folder, ext] of [
    ['python', 'python', 'py'],
    ['javascript', 'javascript', 'js'],
    ['java', 'java', 'java'],
    ['cpp', 'cpp', 'cpp'],
  ]) {
    const override = `scripts/exercise-solutions/${q.number}.${ext}`;
    let code;
    if (lang === 'python' && originalPython[q.number]) {
      code = originalPython[q.number];
      credits[lang] = '序列原创适配';
    } else if (fs.existsSync(override)) {
      code = fs.readFileSync(override, 'utf8');
      credits[lang] = '序列原创适配';
    } else {
      const file = paths.find(
        (p) => p.startsWith(`${folder}/${q.number.padStart(4, '0')}-`) && p.endsWith('.' + ext),
      );
      if (file) {
        code = execFileSync('git', ['-C', root, 'show', `${commit}:${file}`], { encoding: 'utf8' });
        credits[lang] = `https://github.com/neetcode-gh/leetcode/blob/${commit}/${file}`;
        if (lang === 'javascript')
          try {
            code = cleanJS(code);
          } catch (e) {
            missing.push(['js-parse', q.number, e.message]);
          }
      }
    }
    if (code) solutions[lang] = code;
    else if (lang === 'python' || lang === 'javascript') missing.push([lang, q.number, q.slug]);
  }
  const starters = {};
  for (const lang of ['python', 'javascript', 'java', 'cpp']) {
    const snippet = raw.codeSnippets.find(
      (s) => s.langSlug === (lang === 'python' ? 'python3' : lang),
    );
    if (snippet)
      starters[lang] =
        lang === 'python'
          ? snippet.code.replace(
              /^(\s*)def (.*):[^\S\n]*$/gm,
              '$1def $2:\n$1    raise NotImplementedError("请完成此方法")',
            )
          : snippet.code;
  }
  const guide = summaries[q.number];
  const pack = {
    number: q.number,
    adapter: meta,
    tests,
    starters,
    solutions,
    credits,
    upstreamCommit: commit,
    description: guide?.[0] || '',
    explanation: guide?.[1] || '',
    memory: guide?.[2] || '',
  };
  fs.writeFileSync(`public/exercises/${q.number}.json`, JSON.stringify(pack, null, 2) + '\n');
  manifest[q.id] = {
    number: q.number,
    args: meta.systemdesign ? ['operations', 'parameters'] : meta.params.map((p) => p.name),
    tests,
    adapter: meta,
    testCount: tests.length,
    languages: Object.keys(solutions),
  };
}
fs.writeFileSync('shared/exercise-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync('.tools/catalog/build-missing.json', JSON.stringify(missing, null, 2));
console.log(JSON.stringify({ packs: problems.length, missing }, null, 2));
if (missing.some(([kind]) => kind !== 'javascript')) process.exitCode = 1;
