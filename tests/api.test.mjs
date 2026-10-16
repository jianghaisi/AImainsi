import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), 'aimainsi-test-'));
const { app } = await import('../server/app.mjs');
const server = app.listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/api`;
const call = async (url, body, method, headers = {}) => {
  const r = await fetch(base + url, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
};
test.after(() => server.close());
test('state excludes secrets; invalid settings and cross-origin requests fail', async () => {
  const { data } = await call('/state');
  assert.equal(data.settings.apiKey, undefined);
  const save = await call(
    '/settings',
    { ...data.settings, apiKey: 'test-secret', apiUrl: 'http://127.0.0.1:9999/v1', model: 'test' },
    'PUT',
  );
  assert.equal(save.status, 200);
  assert.equal(save.data.apiKey, undefined);
  assert.equal(save.data.hasApiKey, true);
  assert.equal((await call('/settings', { ...data.settings, minutes: -1 }, 'PUT')).status, 400);
  assert.equal(
    (
      await call('/resume', { text: 'test', name: 'test' }, 'PUT', {
        Origin: 'https://untrusted.example',
      })
    ).status,
    403,
  );
  assert.equal((await call('/export')).data.settings.apiKey, undefined);
});
test('resume, local interview and completion persist correctly', async () => {
  await call(
    '/resume',
    { name: 'test', text: '我负责 RAG 系统的混合检索与离线评测，使用 Python 编写索引管道。' },
    'PUT',
  );
  const created = await call('/interviews', { companyId: 'huawei', mode: 'local' });
  assert.equal(created.status, 200);
  assert.match(created.data.turns[0].question, /RAG/);
  const id = created.data.id;
  const answer = await call(`/interviews/${id}/answer`, {
    answer: '因为检索是瓶颈，我负责设计基线和对照实验，用指标观察延迟与成本。',
  });
  assert.equal(answer.status, 200);
  assert.equal(answer.data.turns.length, 2);
  assert.equal(answer.data.turns[0].feedback.score, null);
  assert.equal((await call(`/interviews/${id}/finish`, {})).data.status, 'completed');
  assert.equal((await call(`/interviews/${id}/answer`, { answer: '现在已经结束了' })).status, 400);
});
test('imports deduplicate and require review before publication', async () => {
  const payload = {
    company: '华为',
    records: [{ title: '唯一面经', desc: '测试检索评价', url: 'https://example.com/note/1' }],
  };
  assert.equal((await call('/sources/import', payload)).data.added, 1);
  assert.equal((await call('/sources/import', payload)).data.duplicate, 1);
  const state = (await call('/state')).data;
  const q = state.questions.find((q) => q.title === '唯一面经');
  assert.equal(q.status, 'pending');
  assert.equal(
    (await call('/questions/' + q.id, { ...q, status: 'published' }, 'PUT')).data.status,
    'published',
  );
});
test('resume plain text extraction and missing judge are explicit', async () => {
  const extract = await call('/resume/extract', {
    name: 'resume.txt',
    content: Buffer.from('真实的项目经历与技术栈').toString('base64'),
  });
  assert.match(extract.data.text, /项目经历/);
  const judge = await call('/judge', {
    questionId: 'binary',
    language: 'java',
    code: 'class Solution {}',
  });
  assert.equal(judge.status, 400);
  assert.match(judge.data.error, /判题接口/);
});
test('custom model endpoint performs interview, evaluation and evidence-based profile analysis', async () => {
  const requests = [];
  const mock = http.createServer(async (req, res) => {
    let data = '';
    for await (const chunk of req) data += chunk;
    const body = JSON.parse(data);
    requests.push(body);
    const sys = body.messages[0].content;
    let content = 'Explain your RAG evaluation baseline and the trade-offs.';
    if (sys.includes('面经分析员'))
      content = JSON.stringify({
        focus: ['RAG'],
        style: '当前样本关注检索评价；样本少，不能代表全公司。',
      });
    else if (sys.includes('"score"'))
      content = JSON.stringify({
        score: 72,
        strengths: ['说明了基线'],
        weaknesses: ['缺少数据切分'],
        summary: '请明确离线测试集与线上监控的区别。',
      });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
  await new Promise((r) => mock.listen(0, '127.0.0.1', r));
  try {
    const state = (await call('/state')).data;
    await call(
      '/settings',
      {
        ...state.settings,
        rounds: 1,
        interviewLanguage: 'en',
        apiUrl: `http://127.0.0.1:${mock.address().port}/v1`,
        model: 'mock-model',
      },
      'PUT',
    );
    const started = await call('/interviews', { companyId: 'huawei', mode: 'ai' });
    assert.equal(started.status, 200);
    assert.match(started.data.turns[0].question, /RAG/);
    const replied = await call(`/interviews/${started.data.id}/answer`, {
      answer: 'We compared our retrieval baseline on a labelled dataset.',
    });
    assert.equal(replied.data.status, 'completed');
    assert.equal(replied.data.turns[0].feedback.score, 72);
    assert.match(requests[0].messages[0].content, /question_bank_data/);
    assert.match(requests[0].messages[0].content, /英语/);
    const profile = await call('/profiles/huawei/analyze', {});
    assert.equal(profile.status, 200);
    assert.deepEqual(profile.data.focus, ['RAG']);
    assert.match(profile.data.evidence, /1 条已审核/);
  } finally {
    mock.close();
  }
});
test('DOCX extraction reads text without executing document content', async () => {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file(
    'word/document.xml',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>RAG 项目评测经历</w:t></w:r></w:p></w:body></w:document>',
  );
  const content = (await zip.generateAsync({ type: 'nodebuffer' })).toString('base64');
  const result = await call('/resume/extract', { name: 'resume.docx', content });
  assert.equal(result.status, 200);
  assert.match(result.data.text, /RAG 项目/);
});
