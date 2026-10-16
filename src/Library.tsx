import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Database,
  ExternalLink,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import type { Shared } from './App';
import type { Question } from './types';
import { api, date } from './api';
import { Button, Modal, Busy, Empty, External, Field, PageTitle, SectionTitle, Tag } from './ui';
export function Bank({
  state,
  practice,
  notify,
  refresh,
  selectedId,
}: Shared & { selectedId: string }) {
  const [search, setSearch] = useState(''),
    [topic, setTopic] = useState('全部领域'),
    [kind, setKind] = useState('all'),
    [company, setCompany] = useState('全部公司'),
    [selected, setSelected] = useState<Question | null>(
      state.questions.find((q) => q.id === selectedId && q.kind !== 'coding') || null,
    ),
    [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    topic: '项目表达',
    company: '通用',
    explanation: '',
    memory: '',
  });
  const questions = state.questions.filter(
    (q) =>
      q.status === 'published' &&
      (topic === '全部领域' || q.topic === topic) &&
      (company === '全部公司' || q.company === company) &&
      (kind === 'all' || q.kind === kind) &&
      `${q.title} ${q.topic} ${q.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const passed = new Set(
    state.attempts.filter((a) => a.passed === a.total).map((a) => a.questionId),
  );
  return (
    <>
      <PageTitle
        en="INTELLIGENCE / QUESTION BANK"
        title="建立你的知识储备"
        description="按领域与来源筛选，从一道题延伸出一条知识线。"
        action={
          <Button primary onClick={() => setCreating(true)}>
            <Plus size={16} />
            添加自定义题目
          </Button>
        }
      />
      <div className="bank-summary">
        <div>
          <Database size={23} />
          <span>
            <strong>{state.questions.filter((q) => q.status === 'published').length}</strong>{' '}
            题目与索引
          </span>
        </div>
        <p>内置原创训练 + 可追溯来源索引</p>
        <span className="sync-label">上次同步 / {date(state.sources.lastSync)}</span>
      </div>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="搜索题目"
            placeholder="搜索题目、知识点或关键词…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select aria-label="筛选领域" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {['全部领域', ...new Set(state.questions.map((q) => q.topic))].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="筛选公司" value={company} onChange={(e) => setCompany(e.target.value)}>
          {['全部公司', ...new Set(state.questions.map((q) => q.company))].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="筛选类型" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="all">全部题型</option>
          <option value="coding">可运行手撕</option>
          <option value="concept">专业问答</option>
          <option value="reference">来源索引</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="question-table">
          <thead>
            <tr>
              <th>状态</th>
              <th>题目 / QUESTION</th>
              <th>领域</th>
              <th>难度</th>
              <th>来源</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={q.id}>
                <td>
                  <span className={`question-status ${passed.has(q.id) ? 'done' : ''}`}>
                    {passed.has(q.id) ? <Check size={14} /> : String(i + 1).padStart(2, '0')}
                  </span>
                </td>
                <td>
                  <button onClick={() => (q.kind === 'coding' ? practice(q) : setSelected(q))}>
                    {q.title}
                  </button>
                  <small>
                    {q.kind === 'coding'
                      ? '可运行测试 · 题解 · 记忆卡'
                      : q.kind === 'concept'
                        ? '专业问答'
                        : '外部题目索引'}
                  </small>
                </td>
                <td>
                  <Tag>{q.topic}</Tag>
                </td>
                <td>
                  <span className={`difficulty ${q.difficulty === '进阶' ? 'hard' : ''}`}>
                    {q.difficulty}
                  </span>
                </td>
                <td>
                  <span className="table-source">{q.source.split(' · ')[0]}</span>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`打开 ${q.title}`}
                    onClick={() => (q.kind === 'coding' ? practice(q) : setSelected(q))}
                  >
                    <ArrowRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!questions.length && (
          <Empty
            title="没有匹配的题目"
            description="试试其他关键词，或调整筛选条件。"
            action={
              <Button
                onClick={() => {
                  setSearch('');
                  setTopic('全部领域');
                  setCompany('全部公司');
                  setKind('all');
                }}
              >
                重置筛选
              </Button>
            }
          />
        )}
      </div>
      <p className="hint">
        共 {questions.length} 条 · 厂商标签来自来源或个人配置，不代表公司官方题库。
      </p>
      {selected && (
        <Modal label="题目详情" onClose={() => setSelected(null)}>
          <span className="eyebrow">KNOWLEDGE / DETAIL</span>
          <h2>{selected.title}</h2>
          <div className="tags">
            <Tag>{selected.topic}</Tag>
            <Tag>{selected.company}</Tag>
          </div>
          <p className="preserve">{selected.description}</p>
          {selected.explanation && (
            <>
              <h3>回答要点</h3>
              <p>{selected.explanation}</p>
            </>
          )}
          {selected.memory && (
            <div className="callout">
              <h4>如何记住</h4>
              <p>{selected.memory}</p>
            </div>
          )}
          <External url={selected.sourceUrl}>查看原始来源</External>
          <div className="form-footer">
            <Button onClick={() => setSelected(null)}>关闭</Button>
            <Button
              primary
              onClick={async () => {
                try {
                  await api('/reviews', { questionId: selected.id, quality: 'again' });
                  await refresh();
                  notify('已加入复习队列');
                } catch (e) {
                  notify((e as Error).message, true);
                }
              }}
            >
              加入复习
            </Button>
          </div>
        </Modal>
      )}
      {creating && (
        <Modal label="添加自定义题目" onClose={() => setCreating(false)}>
          <PageTitle
            en="YOUR QUESTION"
            title="把好问题留在题库"
            description="创建专业问答，补充自己的题解和记忆线索。"
          />
          <Field label="题目名称">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="知识领域">
              <input
                value={draft.topic}
                onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
              />
            </Field>
            <Field label="公司标签">
              <input
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              />
            </Field>
          </div>
          <Field label="题目说明">
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Field>
          <Field label="题解 / 回答要点">
            <textarea
              rows={3}
              value={draft.explanation}
              onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            />
          </Field>
          <Field label="记忆方法">
            <input
              value={draft.memory}
              onChange={(e) => setDraft({ ...draft, memory: e.target.value })}
            />
          </Field>
          <div className="form-footer">
            <Button onClick={() => setCreating(false)}>取消</Button>
            <Button
              primary
              disabled={busy || !draft.title || !draft.description}
              onClick={async () => {
                setBusy(true);
                try {
                  await api('/questions', draft);
                  await refresh();
                  setCreating(false);
                  notify('自定义题目已加入题库');
                } catch (e) {
                  notify((e as Error).message, true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              保存题目
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Sources({ state, refresh, notify, navigate }: Shared) {
  const [busy, setBusy] = useState(false),
    [json, setJson] = useState(''),
    [company, setCompany] = useState('华为'),
    [editing, setEditing] = useState<Question | null>(null),
    [tab, setTab] = useState('sources');
  async function work(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  const pending = state.questions.filter((q) => q.status === 'pending');
  return (
    <>
      <PageTitle
        en="CONNECTION / DATA SOURCES"
        title="让情报保持更新"
        description="记录来源、去重入库、审核内容，再用于你的训练。"
        action={
          <Button onClick={() => navigate('settings')}>
            更新策略 <ArrowRight size={15} />
          </Button>
        }
      />
      <div className="tabs">
        <button className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}>
          来源连接
        </button>
        <button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>
          待审核内容 <span>{pending.length}</span>
        </button>
        <button className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>
          同步日志
        </button>
      </div>
      {tab === 'sources' && (
        <>
          <div className="source-grid">
            <section className="panel padded source-card">
              <div className="flex-between">
                <span className="source-logo">
                  Z<span>2</span>L
                </span>
                <Tag tone="green-tag">公开来源</Tag>
              </div>
              <h2>Zero2Leetcode</h2>
              <p>
                同步华为面试页面中的题目索引与 AI
                手撕考点，保留原文链接。内容变化会在下次同步时更新。
              </p>
              <div className="source-details">
                <span>
                  同步方式
                  <b>
                    {state.settings.autoSync ? `每 ${state.settings.syncHours} 小时` : '手动同步'}
                  </b>
                </span>
                <span>
                  最近成功<b>{date(state.sources.lastSync)}</b>
                </span>
                <span>
                  上次新增<b>{state.sources.added} 条</b>
                </span>
              </div>
              {state.sources.lastError && (
                <p className="error-text">同步失败：{state.sources.lastError}</p>
              )}
              <div className="button-row">
                <Button
                  primary
                  disabled={busy}
                  onClick={() =>
                    work(async () => {
                      const r = await api('/sources/sync', {});
                      notify(`同步完成：检查 ${r.checked} 条，新增 ${r.added} 条`);
                    })
                  }
                >
                  {busy ? <Busy /> : <RefreshCw size={15} />}立即同步
                </Button>
                <External url="https://onefly.top/zero2Leetcode/05_interview/coding/huawei/">
                  查看来源
                </External>
              </div>
            </section>
            <section className="panel padded source-card">
              <div className="flex-between">
                <span className="source-logo xhs">
                  XHS<span> / </span>
                </span>
                <Tag>导入适配已就绪</Tag>
              </div>
              <h2>Spider_XHS</h2>
              <p>
                导入你采集的面经
                JSON。按链接与内容去重，所有新内容先进入待审核区。尚未连接你的登录态。
              </p>
              <div className="source-details">
                <span>
                  当前方式<b>JSON 导入 / 本地采集桥接</b>
                </span>
                <span>
                  已导入
                  <b>{state.questions.filter((q) => q.source === 'Spider_XHS 导入').length} 条</b>
                </span>
                <span>
                  使用范围<b>上游声明仅限学习交流</b>
                </span>
              </div>
              <External url="https://github.com/cv-cat/Spider_XHS">打开 Spider_XHS 项目</External>
              <details className="integration-help">
                <summary>如何启用自动采集</summary>
                <p>
                  项目提供 scripts/collect_xhs.py：使用你本机的 Spider_XHS 仓库和 XHS_COOKIE
                  环境变量，按关键词搜索，将笔记写入 JSON。可配置 --interval-hours 周期采集与
                  --ingest-url 自动送入本机待审核区。
                </p>
                <p>运行参数与安装方法见项目 README。当前页面不会索取或展示 Cookie。</p>
              </details>
            </section>
          </div>
          <div className="panel padded import-panel">
            <SectionTitle code="IN" title="导入面经资料" />
            <p className="muted">
              支持 JSON 数组，每条可包含 title / desc / url，也兼容 note_card 对象和中文字段。
            </p>
            <div className="form-grid">
              <Field label="关联公司">
                <input value={company} onChange={(e) => setCompany(e.target.value)} />
              </Field>
              <Field label="从文件读取">
                <input
                  type="file"
                  accept=".json"
                  aria-label="导入 JSON 文件"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 8000000) {
                        notify('导入文件不能超过 8 MB', true);
                        return;
                      }
                      setJson(await f.text());
                    }
                  }}
                />
              </Field>
            </div>
            <Field label="JSON 内容">
              <textarea
                rows={5}
                value={json}
                onChange={(e) => setJson(e.target.value)}
                placeholder={
                  '[{"title":"算法岗面试复盘","desc":"问题与个人复盘内容…","url":"https://..."}]'
                }
              />
            </Field>
            <div className="form-footer">
              <small>不包含登录 Cookie · 单次最多 500 条</small>
              <Button
                primary
                disabled={busy || !json.trim()}
                onClick={() =>
                  work(async () => {
                    let records;
                    try {
                      records = JSON.parse(json);
                    } catch {
                      throw new Error('JSON 格式不正确，请检查括号与引号');
                    }
                    const r = await api('/sources/import', { records, company });
                    setJson('');
                    notify(`已导入 ${r.added} 条待审核内容，跳过 ${r.duplicate} 条重复记录`);
                  })
                }
              >
                <Upload size={15} />
                导入待审核区
              </Button>
            </div>
          </div>
        </>
      )}
      {tab === 'review' &&
        (pending.length ? (
          <div className="panel">
            {pending.map((q) => (
              <div className="review-row" key={q.id}>
                <div>
                  <Tag>{q.company}</Tag>
                  <h3>{q.title}</h3>
                  <p>{q.description.slice(0, 150)}</p>
                </div>
                <Button onClick={() => setEditing({ ...q })}>
                  审核内容 <ArrowRight size={14} />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="待审核区已清空"
            description="导入新面经后，可以在这里校对题目、标签和来源。"
          />
        ))}
      {tab === 'logs' &&
        (state.sources.logs.length ? (
          <div className="panel">
            {state.sources.logs.map((log, i) => (
              <div className="log-row" key={i}>
                <Tag tone={log.ok ? 'green-tag' : 'orange-tag'}>{log.ok ? '成功' : '失败'}</Tag>
                <span>{log.message}</span>
                <time>{date(log.at)}</time>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="还没有同步记录" description="手动同步一次，或在设置中启用定时更新。" />
        ))}
      {editing && (
        <Modal label="审核内容" onClose={() => setEditing(null)}>
          <span className="eyebrow">REVIEW / SOURCE MATERIAL</span>
          <h2>核对后，再加入题库</h2>
          <Field label="题目标题">
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
          </Field>
          <Field label="内容">
            <textarea
              rows={9}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="领域">
              <input
                value={editing.topic}
                onChange={(e) => setEditing({ ...editing, topic: e.target.value })}
              />
            </Field>
            <Field label="类型">
              <select
                value={editing.kind}
                onChange={(e) =>
                  setEditing({ ...editing, kind: e.target.value as 'concept' | 'reference' })
                }
              >
                <option value="reference">面经资料 / 索引</option>
                <option value="concept">专业问答</option>
              </select>
            </Field>
          </div>
          <External url={editing.sourceUrl}>核对原始来源</External>
          <div className="form-footer">
            <Button onClick={() => setEditing(null)}>暂不发布</Button>
            <Button
              primary
              disabled={busy}
              onClick={() =>
                work(async () => {
                  await api(
                    `/questions/${editing.id}`,
                    {
                      title: editing.title,
                      description: editing.description,
                      topic: editing.topic,
                      company: editing.company,
                      kind: editing.kind,
                      status: 'published',
                    },
                    'PUT',
                  );
                  setEditing(null);
                  notify('内容已审核并加入题库');
                })
              }
            >
              <Check size={15} />
              审核通过
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
