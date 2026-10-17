// Adapt licensed Doocs implementations and explanations; never ship scraped problem statements.
import fs from 'node:fs';
import { load } from 'cheerio';
import ts from 'typescript';
import { execFileSync } from 'node:child_process';
const read = (p) => fs.readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));
const catalog = json('shared/catalog-data.json'),
  mapping = json('.tools/catalog/doocs-map.json');
const manifest = json('shared/exercise-manifest.json'),
  guides = json('shared/exercise-guides.json');
const commit = '90e141b377963eddd5b84f830c18c429ce2ed093';
if (
  execFileSync('git', ['-C', '.tools/doocs-solutions', 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim() !== commit
)
  throw Error('Reference checkout differs from reviewed Doocs commit');
const overrides = fs.existsSync('scripts/expanded-overrides.json')
  ? json('scripts/expanded-overrides.json')
  : {};
const missing = [];
const plain = (s) =>
  load(s || '')
    .text()
    .replaceAll('\u00a0', ' ')
    .trim();
function tokens(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (/[\s,，;；]/.test(s[i])) {
      i++;
      continue;
    }
    const label = s.slice(i).match(/^[\w]+\s*=\s*/);
    if (label) {
      i += label[0].length;
      continue;
    }
    if (s[i] === '[' || s[i] === '{') {
      let found = false;
      for (let j = i + 1; j <= s.length; j++)
        try {
          const v = JSON.parse(s.slice(i, j));
          out.push(v);
          i = j;
          found = true;
          break;
        } catch {}
      if (!found) return null;
      continue;
    }
    const m = s
      .slice(i)
      .match(/^("(?:[^"\\]|\\.)*"|'[^']*'|true|false|null|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i);
    if (!m) return null;
    out.push(
      m[0].startsWith("'")
        ? m[0].slice(1, -1)
        : JSON.parse(
            m[0].toLowerCase() === 'true'
              ? 'true'
              : m[0].toLowerCase() === 'false'
                ? 'false'
                : m[0],
          ),
    );
    i += m[0].length;
  }
  return out;
}
function value(s) {
  s = s.trim().replaceAll('True', 'true').replaceAll('False', 'false').replaceAll('None', 'null');
  if (s.startsWith('[') || s.startsWith('{')) {
    for (let i = 1; i <= s.length; i++)
      try {
        return JSON.parse(s.slice(0, i));
      } catch {}
  }
  const m = s.match(/^("(?:[^"\\]|\\.)*"|true|false|null|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/i);
  if (m) return JSON.parse(m[1]);
}
for (const q of catalog.questions) {
  const source = mapping[q.id];
  if (!source) continue;
  const raw = json(`.tools/catalog/meta/${q.slug}.json`),
    meta = { ...JSON.parse(raw.metaData), number: q.number };
  const md = read(`.tools/doocs-solutions/${source.folder}/README.md`),
    own = overrides[q.number] || {};
  const section = (md.split('<!-- solution:start -->')[1] || '').split('<!-- tabs:start -->')[0];
  const method = section.match(/### (.*)/)?.[1] || q.tags.join(' / ');
  const thinking = (section.split('<!-- thinking:start -->')[1] || '')
    .split('<!-- thinking:end -->')[0]
    .replace(/^> ?/gm, '')
    .replace(/\*\*思路\*\*/g, '')
    .trim();
  const explanation = section
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^### /gm, '')
    .replace(/^> ?/gm, '')
    .replace(/\*\*/g, '')
    .trim();
  const paragraphs = explanation
    .split(/\n\s*\n/)
    .filter((x) => x.length > 20 && !x.startsWith('时间复杂度'));
  const description =
    own.description ||
    `任务：${q.title}。\n输入：${(meta.params || []).map((p) => p.name + '（' + p.type + '）').join('、') || '操作名称与参数序列'}。\n训练提示：${(thinking || paragraphs[0] || method).replace(/\n+/g, ' ')}\n以本页输入输出样例为准；完整条件可打开原题查阅。`;
  const memory =
    own.memory ||
    `${q.title} → ${method.replace(/^方法[一二三四五六七八九十]+[:：]/, '')}。\n${thinking || paragraphs[0] || explanation}\n闭卷练习：先画出第一组样例的状态变化，再解释为何不会漏解；最后改动一个边界输入，检查终止条件和返回值。`;
  let tests = [];
  if (!meta.database) {
    try {
      const lines = raw.exampleTestcases
        .split('\n')
        .filter((s) => s.trim())
        .map((s) => (/^0[01]+$/.test(s.trim()) ? parseInt(s, 2) : JSON.parse(s)));
      const arity = meta.systemdesign ? 2 : meta.params.length;
      const content = plain(
        raw.translatedContent ||
          raw.content ||
          md.split('<!-- description:start -->')[1]?.split('<!-- description:end -->')[0],
      );
      for (const html of [
        raw.translatedContent,
        raw.content,
        md.split('<!-- description:start -->')[1]?.split('<!-- description:end -->')[0],
      ]) {
        const $ = load(html || '');
        for (const element of $('pre').toArray()) {
          const text = $(element).text().replaceAll('\u00a0', ' '),
            parts = text.split(/(?:Output|输出)\s*[:：\n]/i);
          if (parts.length < 2) continue;
          const inputText = parts[0].split(/(?:Input|输入)\s*[:：\n]/i)[1];
          if (!inputText) continue;
          const input = tokens(inputText.trim()),
            expected = value(parts[1]);
          if (
            input?.length === arity &&
            expected !== undefined &&
            !tests.some((t) => JSON.stringify(t.input) === JSON.stringify(input))
          )
            tests.push({ input, expected });
        }
        if (!tests.length) {
          const full = plain(html)
            .split(/(?:Input|输入)\s*[:：\n]/i)
            .slice(1);
          for (const block of full) {
            const parts = block.split(/(?:Output|输出)\s*[:：\n]/i);
            if (parts.length < 2) continue;
            const input = tokens(parts[0].trim()),
              expected = value(parts[1]);
            if (input?.length === arity && expected !== undefined) tests.push({ input, expected });
          }
        }
      }
      if (!tests.length && !own.tests) missing.push([q.number, 'needs-reviewed-examples']);
    } catch (e) {
      missing.push([q.number, 'parse', e.message]);
    }
  }
  const solutions = {},
    credits = {},
    starters = {};
  for (const [lang, ext, heading] of [
    ['python', 'py', 'Python3'],
    ['javascript', 'ts', 'TypeScript'],
    ['java', 'java', 'Java'],
    ['cpp', 'cpp', 'C++'],
  ]) {
    const path = source.folder + '/Solution.' + ext,
      file = '.tools/doocs-solutions/' + path;
    let code = fs.existsSync(file)
      ? read(file)
      : md
          .replaceAll('\r', '')
          .split('#### ' + heading + '\n')[1]
          ?.match(/```[^\n]*\n([\s\S]*?)```/)?.[1];
    if (!code) continue;
    if (lang === 'javascript')
      code = ts.transpileModule(code, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
      }).outputText;
    if (!meta.systemdesign && meta.name !== 'Codec') {
      const pyFile = `.tools/doocs-solutions/${source.folder}/Solution.py`;
      const originalMethod = fs.existsSync(pyFile)
        ? read(pyFile).match(/class Solution:[\s\S]*?    def (\w+)\(/)?.[1]
        : undefined;
      const old =
        lang === 'python'
          ? code.match(/class Solution:[\s\S]*?    def (\w+)\(/)?.[1]
          : lang === 'javascript'
            ? new RegExp('(?:function|const|var|let) ' + meta.name + '\\b').test(code)
              ? meta.name
              : code.match(/function (\w+)\(/)?.[1] ||
                code.match(/(?:const|var|let) (\w+)\s*=/)?.[1]
            : originalMethod;
      if (old && old !== meta.name)
        code = code.replace(new RegExp('\\b' + old + '\\b', 'g'), meta.name);
    }
    if (q.number === 'LCR 184')
      for (const [a, b] of [
        ['MaxQueue', 'Checkout'],
        ['max_value', 'get_max'],
        ['push_back', 'add'],
        ['pop_front', 'remove'],
      ])
        code = code.replaceAll(a, b);
    solutions[lang] = code;
    credits[lang] = `https://github.com/doocs/leetcode/blob/${commit}/${encodeURI(path)}`;
    const snippet = raw.codeSnippets?.find(
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
    else if (lang === 'python') {
      const name = meta.classname || 'Solution';
      const defs = [...code.matchAll(/^    def ([^\n]+):/gm)].map(
        (m) => '    def ' + m[1] + ':\n        raise NotImplementedError("请完成此方法")',
      );
      starters[lang] = 'class ' + name + ':\n' + defs.join('\n\n') + '\n';
    } else if (lang === 'javascript')
      starters[lang] = meta.systemdesign
        ? `class ${meta.classname} {\n  constructor(...args) {}\n${meta.methods
            .map(
              (m) =>
                `  ${m.name}(${m.params
                  .filter((p) => !p.lang)
                  .map((p) => p.name)
                  .join(', ')}) { throw Error('请完成此方法'); }`,
            )
            .join('\n')}\n}`
        : `function ${meta.name}(${meta.params.map((p) => p.name).join(', ')}) {\n  throw Error('请完成此方法');\n}`;
  }
  Object.assign(solutions, own.solutions);
  Object.assign(starters, own.starters);
  Object.assign(credits, own.credits);
  // The LCR replacement task changes semantics, not just the method name.
  if (q.number === 'LCR 122') {
    delete solutions.java;
    delete solutions.cpp;
  }
  if (own.solutions?.python && !own.starters?.python) {
    const code = own.solutions.python,
      cls = code.match(/class (\w+)/)?.[1] || 'Solution';
    starters.python =
      'class ' +
      cls +
      ':\n' +
      [...code.matchAll(/^    def ([^\n]+?):/gm)]
        .map((m) => '    def ' + m[1] + ':\n        raise NotImplementedError("请完成此方法")')
        .join('\n\n') +
      '\n';
  }
  for (const lang of ['javascript', 'java', 'cpp'])
    if (!starters[lang]) {
      delete solutions[lang];
      delete credits[lang];
    }
  if (own.tests) tests = own.tests;
  Object.assign(meta, own.adapter);
  if (tests.some((t) => t.expected === undefined) || !tests.length)
    missing.push([q.number, 'tests']);
  if (!solutions.python) missing.push([q.number, 'python']);
  const pack = {
    number: q.number,
    adapter: meta,
    tests,
    starters,
    solutions,
    credits,
    upstreamCommit: commit,
    guideCredit:
      own.description && own.explanation && own.memory
        ? undefined
        : `https://github.com/doocs/leetcode/blob/${commit}/${encodeURI(source.folder)}/README.md`,
    guideLicense: own.description && own.explanation && own.memory ? 'MIT' : 'CC BY-SA 4.0',
    description,
    explanation: own.explanation || explanation,
    memory,
  };
  fs.writeFileSync(`public/exercises/${q.number}.json`, JSON.stringify(pack, null, 2) + '\n');
  manifest[q.id] = {
    number: q.number,
    args: meta.systemdesign ? ['operations', 'parameters'] : (meta.params || []).map((p) => p.name),
    tests,
    adapter: meta,
    testCount: tests.length,
    languages: Object.keys(solutions),
  };
  guides[q.number] = [description, pack.explanation, memory];
}
fs.writeFileSync('shared/exercise-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync('shared/exercise-guides.json', JSON.stringify(guides, null, 2) + '\n');
fs.writeFileSync('.tools/catalog/expanded-missing.json', JSON.stringify(missing, null, 2));
if (!missing.length)
  execFileSync(process.env.PYTHON || 'python', ['scripts/build-python-starters.py'], {
    stdio: 'inherit',
  });
console.log(JSON.stringify({ packs: Object.keys(manifest).length, missing }));
