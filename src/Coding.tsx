import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Clock, Play, RotateCcw, Square, Lightbulb } from 'lucide-react';
import type { Shared } from './App';
import type { Lang, Result, Question } from './types';
import { api, languages } from './api';
import { Button, Busy, Field, PageTitle, Tag, External } from './ui';
export function Coding({
  state,
  selectedId,
  refresh,
  notify,
  navigate,
}: Shared & { selectedId: string }) {
  const questions = state.questions.filter((q) => q.kind === 'coding'),
    [questionId, setQuestionId] = useState(
      questions.some((q) => q.id === selectedId) ? selectedId : questions[0].id,
    ),
    [language, setLanguage] = useState<Lang>(state.settings.language),
    [tab, setTab] = useState('problem'),
    [code, setCode] = useState(''),
    [results, setResults] = useState<Result[]>([]),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [elapsed, setElapsed] = useState(0),
    [timing, setTiming] = useState(false),
    [solutionOpen, setSolutionOpen] = useState(false);
  const workerRef = useRef<Worker | null>(null),
    runIdRef = useRef(0),
    timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null),
    started = useRef(Date.now());
  const base = questions.find((q) => q.id === questionId)!;
  const [pack, setPack] = useState<Partial<Question> & { number?: string }>({});
  const [loadError, setLoadError] = useState('');
  const [reloadAttempt, setReloadAttempt] = useState(0),
    [note, setNote] = useState(''),
    [savingNote, setSavingNote] = useState(false);
  const loading = !!base.exercisePack && pack.number !== base.exercisePack;
  const q = base.exercisePack && pack.number === base.exercisePack ? { ...base, ...pack } : base;
  useEffect(() => {
    let active = true;
    setLoadError('');
    setPack({});
    setNote(state.questionProgress[questionId]?.note || '');
    localStorage.setItem('last-practice', questionId);
    if (base.exercisePack)
      fetch(`/exercises/${base.exercisePack}.json`)
        .then((r) => {
          if (!r.ok) throw Error('题目资源加载失败，请重试');
          return r.json();
        })
        .then((data) => {
          if (active) setPack(data);
        })
        .catch((e) => {
          if (active) setLoadError(e.message);
        });
    return () => {
      active = false;
    };
  }, [questionId, reloadAttempt]);
  useEffect(() => {
    const saved = localStorage.getItem(`draft:${questionId}:${language}`);
    setCode(saved ?? q.starters?.[language] ?? '');
    setResults([]);
    setElapsed(0);
    setTiming(false);
    setSolutionOpen(false);
    setStatus('');
  }, [questionId, language, loading]);
  useEffect(() => {
    if (!timing) return;
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - started.current) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [timing]);
  useEffect(
    () => () => {
      runIdRef.current++;
      workerRef.current?.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );
  function edit(value: string) {
    setCode(value);
    localStorage.setItem(`draft:${questionId}:${language}`, value);
  }
  function stop() {
    runIdRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBusy(false);
    setStatus('运行已停止');
  }
  async function finish(output: Result[]) {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setResults(output);
    setStatus(`通过 ${output.filter((r) => r.passed).length} / ${output.length} 个用例`);
    setBusy(false);
    setTiming(false);
    try {
      await api('/attempts', {
        questionId,
        language,
        code,
        results: output,
        passed: output.filter((r) => r.passed).length,
        total: output.length,
        duration: elapsed,
      });
      await refresh();
    } catch (e) {
      notify('结果已运行，但保存失败：' + (e as Error).message, true);
    }
  }
  async function run() {
    const runId = ++runIdRef.current;
    setBusy(true);
    setStatus('正在运行…');
    setResults([]);
    if (language === 'java' || language === 'cpp') {
      try {
        const r = await api('/judge', { questionId, language, code });
        if (runId !== runIdRef.current) return;
        await finish(r.results);
      } catch (e) {
        if (runId !== runIdRef.current) return;
        setBusy(false);
        setStatus((e as Error).message);
        notify((e as Error).message, true);
      }
      return;
    }
    const worker = new Worker('/runner-v2.js', { type: 'module' });
    workerRef.current = worker;
    const fail = (message: string) => {
      if (runId !== runIdRef.current) return;
      void finish((q.tests || []).map(() => ({ passed: false, error: message })));
      setStatus(message);
    };
    timeoutRef.current = setTimeout(
      () => fail('运行超过 30 秒，已终止。请检查死循环或缩小复杂度。'),
      30000,
    );
    worker.onerror = (e) => fail(e.message || '运行时加载失败');
    worker.onmessage = ({ data }) => {
      if (runId !== runIdRef.current) return;
      if (data.status) setStatus(data.status);
      else if (data.error) fail(data.error);
      else if (data.results) void finish(data.results);
    };
    worker.postMessage({ language, code, tests: q.tests, adapter: q.adapter });
  }
  return (
    <>
      <PageTitle
        en="PRACTICE / CODING LAB"
        title="理解之后，亲手写出来"
        description="先推导，再实现。用测试检验边界，用复述巩固记忆。"
        action={
          <div className="timer">
            <Clock size={16} />
            <b>
              {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
              {String(elapsed % 60).padStart(2, '0')}
            </b>
            <button
              onClick={() => {
                if (!timing) started.current = Date.now() - elapsed * 1000;
                setTiming(!timing);
              }}
            >
              {timing ? '暂停' : '计时'}
            </button>
          </div>
        }
      />
      <div className="coding-toolbar">
        <Field label="训练题目">
          <select
            value={questionId}
            disabled={busy}
            onChange={(e) => setQuestionId(e.target.value)}
          >
            {questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="编程语言">
          <select
            value={language}
            disabled={busy}
            onChange={(e) => setLanguage(e.target.value as Lang)}
          >
            {Object.entries(languages).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Tag>
          {language === 'python' || language === 'javascript' ? '浏览器隔离运行' : '自定义判题服务'}
        </Tag>
      </div>
      <div className="coding-layout">
        <section className="problem-panel">
          <div className="tabs">
            <button onClick={() => setTab('problem')} className={tab === 'problem' ? 'active' : ''}>
              题目说明
            </button>
            <button
              onClick={() => setTab('solution')}
              className={tab === 'solution' ? 'active' : ''}
            >
              思路与题解
            </button>
            <button onClick={() => setTab('memory')} className={tab === 'memory' ? 'active' : ''}>
              记忆卡片
            </button>
          </div>
          <div className="problem-content">
            <div className="tags">
              <Tag tone="orange-tag">{q.difficulty}</Tag>
              <Tag>{q.topic}</Tag>
            </div>
            <h2>{q.title}</h2>
            {tab === 'problem' && (
              <>
                <p className="preserve">{q.description}</p>
                <h4>函数约定</h4>
                <code className="inline-code">
                  {q.adapter?.systemdesign
                    ? q.adapter.classname + '：操作序列'
                    : `${q.adapter?.name || 'solve'}(${q.args?.join(', ')})`}
                </code>
                <p className="hint">
                  {q.adapter
                    ? '使用下方语言模板。链表用数组、树用层序数组（null 表示空位）、设计题用操作名和参数序列输入，运行器自动转换。'
                    : '函数接收输入参数并返回结果。'}{' '}
                  Java / C++ 需要配置支持此函数约定的判题服务。
                </p>
                {q.tests?.slice(0, 2).map((t, i) => (
                  <div className="example" key={i}>
                    <b>示例 {i + 1}</b>
                    <p>
                      输入 <code>{JSON.stringify(t.input)}</code>
                    </p>
                    <p>
                      输出 <code>{JSON.stringify(t.expected)}</code>
                    </p>
                  </div>
                ))}
                <p className="hint">
                  {q.source} ·{' '}
                  {q.exercisePack
                    ? '原创题意摘要与记忆卡；示例训练不等同于原站完整判题。'
                    : '题意、题解与测试为本项目编写。'}
                </p>
                <External url={q.sourceUrl}>完整题意与约束</External>
              </>
            )}
            {tab === 'solution' && (
              <>
                <h4>推导过程</h4>
                <p>{q.explanation}</p>
                <Button onClick={() => setSolutionOpen(!solutionOpen)}>
                  <BookOpen size={15} />
                  {solutionOpen ? '收起参考实现' : '展开参考实现'}
                </Button>
                {solutionOpen && (
                  <>
                    <p className="hint">
                      {q.solutions?.[language] ? languages[language] : 'Python'} 参考实现 ·
                      看完后切回题目，尝试闭卷重写。
                    </p>
                    <pre className="solution-code">
                      {q.solutions?.[language] || q.solutions?.python}
                    </pre>
                    {q.credits && (
                      <p className="hint">
                        参考代码：
                        {(q.credits[language] || q.credits.python)?.startsWith('https:') ? (
                          <External url={q.credits[language] || q.credits.python || ''}>
                            NeetCode · MIT 许可（查看原文件）
                          </External>
                        ) : (
                          '序列原创适配'
                        )}
                        。Java / C++ 实现需在自配服务中验证。
                      </p>
                    )}
                    <Button
                      disabled={loading}
                      onClick={() => {
                        const text = q.solutions?.[language];
                        if (text) {
                          edit(text);
                          notify('参考实现已载入，可运行验证');
                        } else notify('当前展示的是 Python 题解，请切换到 Python 后载入', true);
                      }}
                    >
                      载入参考实现
                    </Button>
                  </>
                )}
              </>
            )}
            {tab === 'memory' && (
              <div className="memory-card">
                <Lightbulb size={28} />
                <span className="eyebrow">REMEMBER THE REASON</span>
                <h3>记住原理，而非代码形状</h3>
                <p>{q.memory}</p>
                <Field label="我的思路与易错点">
                  <textarea
                    rows={4}
                    maxLength={5000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="用自己的话写下解法与边界…"
                  />
                </Field>
                <Button
                  disabled={savingNote}
                  onClick={async () => {
                    setSavingNote(true);
                    try {
                      await api('/question-progress', { questionId, note });
                      await refresh();
                      notify('笔记已保存');
                    } catch (e) {
                      notify((e as Error).message, true);
                    } finally {
                      setSavingNote(false);
                    }
                  }}
                >
                  保存笔记
                </Button>
                <ol className="tips">
                  <li>合上题解，用自己的话复述不变量。</li>
                  <li>在空白编辑器里实现，不照抄。</li>
                  <li>用边界样例尝试推翻自己的解法。</li>
                  <li>在 1、3、7、14 天后闭卷回忆。</li>
                </ol>
                <div className="button-row">
                  <Button
                    onClick={async () => {
                      try {
                        await api('/reviews', { questionId, quality: 'again' });
                        await refresh();
                        notify('已安排 10 分钟后再次回忆');
                      } catch (e) {
                        notify((e as Error).message, true);
                      }
                    }}
                  >
                    还不熟悉
                  </Button>
                  <Button
                    primary
                    onClick={async () => {
                      try {
                        await api('/reviews', { questionId, quality: 'good' });
                        await refresh();
                        notify('已安排下一次间隔复习');
                      } catch (e) {
                        notify((e as Error).message, true);
                      }
                    }}
                  >
                    <Check size={15} />
                    已能独立复述
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="editor-panel">
          <div className="editor-title">
            <span>
              <span className="status-dot" />
              solution.
              {language === 'python'
                ? 'py'
                : language === 'javascript'
                  ? 'js'
                  : language === 'java'
                    ? 'java'
                    : 'cpp'}
            </span>
            <button
              className="text-link"
              disabled={busy}
              onClick={() => {
                edit(q.starters?.[language] || '');
                setResults([]);
              }}
            >
              重置模板 <RotateCcw size={13} />
            </button>
          </div>
          <div className="code-editor">
            <div className="line-numbers" aria-hidden="true">
              {code.split('\n').map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <textarea
              aria-label="代码编辑器"
              value={code}
              onChange={(e) => edit(e.target.value)}
              spellCheck={false}
              disabled={busy || loading}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const target = e.currentTarget,
                    start = target.selectionStart;
                  edit(code.slice(0, start) + '    ' + code.slice(target.selectionEnd));
                  requestAnimationFrame(() => {
                    target.selectionStart = target.selectionEnd = start + 4;
                  });
                }
              }}
            />
          </div>
          <div className="editor-actions">
            <span>UTF-8 · 草稿自动保存</span>
            {busy ? (
              <Button onClick={stop}>
                <Square size={13} />
                停止
              </Button>
            ) : (
              <Button primary onClick={run} disabled={loading || !!loadError}>
                <Play size={15} />
                运行并提交
              </Button>
            )}
          </div>
          <div className="test-panel">
            {loading && (
              <p role="status">
                {loadError || '正在载入题目模板与题解…'}
                {loadError && (
                  <Button onClick={() => setReloadAttempt(reloadAttempt + 1)}>重新加载</Button>
                )}
              </p>
            )}
            <div className="flex-between">
              <h3>
                测试结果{' '}
                <span>
                  {results.length
                    ? `${results.filter((r) => r.passed).length}/${results.length}`
                    : '—'}
                </span>
              </h3>
              {busy && <Busy />}
            </div>
            {status && (
              <p className="run-status" role="status">
                {status}
              </p>
            )}
            {!results.length && !busy && (
              <p className="hint">
                运行代码后，在这里查看每个用例的结果。
                {(language === 'java' || language === 'cpp') && (
                  <button className="text-link" onClick={() => navigate('settings')}>
                    配置判题接口
                  </button>
                )}
              </p>
            )}
            <div className="test-results">
              {results.map((r, i) => (
                <details key={i} className={r.passed ? 'passed' : 'failed'}>
                  <summary>
                    <span>
                      {r.passed ? '✓' : '×'} 用例 {i + 1}
                    </span>
                    <span>{r.passed ? '通过' : '未通过'}</span>
                  </summary>
                  <p>输入：{JSON.stringify(q.tests?.[i]?.input)}</p>
                  <p>预期：{JSON.stringify(q.tests?.[i]?.expected)}</p>
                  <p>实际：{r.error || JSON.stringify(r.actual)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
