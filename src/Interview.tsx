import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  FileText,
  Plus,
  Send,
  Upload,
  Square,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import type { Shared } from './App';
import type { Profile, Session } from './types';
import { api, date } from './api';
import { Button, Modal, Busy, Empty, External, Field, PageTitle, SectionTitle, Tag } from './ui';
export function Interview({ state, refresh, notify, navigate }: Shared) {
  const [tab, setTab] = useState<'setup' | 'session' | 'history'>('setup'),
    [resume, setResume] = useState(state.resume.text),
    [filename, setFilename] = useState(state.resume.name),
    [profileId, setProfileId] = useState(
      sessionStorage.getItem('selectedCompany') || state.settings.targetCompany,
    ),
    [editing, setEditing] = useState<Profile | null>(null),
    [mode, setMode] = useState<'local' | 'ai'>(state.settings.apiUrl ? 'ai' : 'local'),
    [busy, setBusy] = useState(false),
    [answer, setAnswer] = useState(''),
    [session, setSession] = useState<Session | undefined>(
      state.sessions.find((s) => s.status === 'active'),
    );
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    const tick = () =>
      setRemaining(
        Math.max(
          0,
          session.minutes * 60 - Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000),
        ),
      );
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session]);
  const profile = state.profiles.find((p) => p.id === profileId) || state.profiles[0];
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
  const saveResume = () =>
    work(async () => {
      await api('/resume', { text: resume, name: filename || '我的简历' }, 'PUT');
      notify('简历已保存到本机');
    });
  async function upload(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      notify('文件不能超过 8 MB', true);
      return;
    }
    await work(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let raw = '';
      for (const byte of bytes) raw += String.fromCharCode(byte);
      const data = await api('/resume/extract', { name: file.name, content: btoa(raw) });
      setResume(data.text);
      setFilename(data.name);
      notify('已提取文字，请检查后保存');
    });
  }
  const start = () =>
    work(async () => {
      if (resume.trim().length < 20) throw new Error('请先填写至少 20 个字符的简历');
      await api('/resume', { text: resume, name: filename || '我的简历' }, 'PUT');
      const s = await api<Session>('/interviews', { companyId: profile.id, mode });
      setSession(s);
      setAnswer('');
      setTab('session');
    });
  const submit = () =>
    work(async () => {
      if (!session) return;
      const updated = await api<Session>(`/interviews/${session.id}/answer`, { answer });
      setSession(updated);
      setAnswer('');
    });
  return (
    <>
      <PageTitle
        en="SIMULATION / INTERVIEW"
        title="每个追问，都有来处"
        description="从你的简历出发，训练专业表达、技术深度与临场思考。"
        action={
          <Button onClick={() => navigate('settings')}>
            语言与轮次设置 <ChevronRight size={15} />
          </Button>
        }
      />
      <div className="tabs">
        <button className={tab === 'setup' ? 'active' : ''} onClick={() => setTab('setup')}>
          01 / 面试准备
        </button>
        <button className={tab === 'session' ? 'active' : ''} onClick={() => setTab('session')}>
          02 / 面试现场{session?.status === 'active' && <span className="status-dot" />}
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          03 / 面试记录 <span>{state.sessions.length}</span>
        </button>
      </div>
      {tab === 'setup' && (
        <div className="two-columns setup-layout">
          <div className="panel padded">
            <SectionTitle code="A" title="你的经历，是最好的题目" />
            <p className="muted">上传简历或粘贴正文。你可以在保存前删去联系方式等无关内容。</p>
            <label className="upload-zone">
              <Upload size={25} />
              <strong>{filename || '导入你的简历'}</strong>
              <span>PDF / DOCX / TXT / MD · 最大 8 MB</span>
              <input
                aria-label="上传简历"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                }}
              />
            </label>
            <Field label="简历正文">
              <textarea
                rows={11}
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="粘贴你的项目经历、技术栈与个人贡献…\n\n例如：负责企业知识库 RAG 系统，设计了混合检索、重排序与离线评测流程。"
              />
            </Field>
            <div className="form-footer">
              <span>{resume.length} 字符 · 保存在本机</span>
              <Button disabled={busy} onClick={saveResume}>
                {busy ? <Busy /> : <Check size={15} />}保存简历
              </Button>
            </div>
          </div>
          <div>
            <div className="panel padded">
              <SectionTitle code="B" title="配置这场面试" />
              <div className="profile-options">
                {state.profiles.map((p) => (
                  <button
                    key={p.id}
                    className={profile.id === p.id ? 'selected' : ''}
                    onClick={() => setProfileId(p.id)}
                  >
                    <span style={{ color: p.color }}>{p.name.slice(0, 1)}</span>
                    <b>{p.name}</b>
                    {profile.id === p.id && <Check size={14} />}
                  </button>
                ))}
              </div>
              <div className="profile-detail">
                <div className="flex-between">
                  <h3>{profile.name} · 追问配置</h3>
                  <button className="text-link" onClick={() => setEditing({ ...profile })}>
                    编辑
                  </button>
                </div>
                <div className="tags">
                  {profile.focus.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <p>{profile.style}</p>
                <small>{profile.evidence}</small>
                {profile.sourceUrl && <External url={profile.sourceUrl}>查看依据</External>}
              </div>
              <button
                className="text-link"
                onClick={() =>
                  setEditing({
                    id: crypto.randomUUID(),
                    name: '我的面试官',
                    en: 'CUSTOM',
                    color: '#797773',
                    role: state.settings.role,
                    focus: ['项目表达'],
                    style: '围绕项目细节追问，注重可核验的个人贡献。',
                    evidence: '用户自定义训练预设',
                    sourceUrl: '',
                  })
                }
              >
                <Plus size={14} />
                添加自定义面试官
              </button>
              <div className="analyze-profile">
                <Button
                  disabled={busy}
                  onClick={() =>
                    work(async () => {
                      await api(`/profiles/${profile.id}/analyze`, {});
                      notify('已根据已审核面经更新面试官配置');
                    })
                  }
                >
                  从已审核面经提炼偏好
                </Button>
                <p className="hint">需要配置模型 API，将发送该公司已审核的面经样本。</p>
              </div>
              <hr />
              <Field label="面试模式">
                <select value={mode} onChange={(e) => setMode(e.target.value as 'local' | 'ai')}>
                  <option value="local">本地引导 · 无需 API</option>
                  <option value="ai">AI 深度追问 · 使用自定义 API</option>
                </select>
              </Field>
              <p className="hint">
                {mode === 'local'
                  ? '根据简历片段生成引导问题，反馈仅检查回答结构，不评判专业正确性。'
                  : '简历与作答会发送到你配置的模型服务，用于追问和评估。'}
              </p>
              <div className="session-facts">
                <span>{state.settings.minutes} 分钟</span>
                <span>{state.settings.rounds} 轮</span>
                <span>
                  {state.settings.interviewLanguage === 'zh' ? '中文面试' : 'English interview'}
                </span>
              </div>
              <Button primary className="full" disabled={busy || !resume.trim()} onClick={start}>
                {busy ? <Busy /> : <MessageSquare size={16} />}开始模拟面试 <ArrowRight size={17} />
              </Button>
            </div>
          </div>
        </div>
      )}
      {tab === 'session' &&
        (!session ? (
          <Empty
            title="面试现场已准备好"
            description="先导入简历，选择面试官，开始你的第一场训练。"
            action={
              <Button primary onClick={() => setTab('setup')}>
                前往面试准备
              </Button>
            }
          />
        ) : (
          <div className="session-layout">
            <div className="chat-panel">
              <div className="chat-header">
                <div>
                  <span className="status-dot" />
                  <strong>
                    {session.companyName} / {session.role}
                  </strong>
                  <Tag>{session.mode === 'ai' ? 'AI 面试' : '本地引导'}</Tag>
                </div>
                <span>
                  {session.status === 'completed'
                    ? '已结束'
                    : `${Math.min(session.turns.length, session.rounds)} / ${session.rounds} 轮 · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
                </span>
              </div>
              <div className="chat-messages">
                {session.turns.map((turn, i) => (
                  <div key={i} className="turn">
                    <div className="message interviewer">
                      <span className="chat-avatar">Q{i + 1}</span>
                      <div>
                        <small>
                          INTERVIEWER / {session.language === 'en' ? 'Question' : '专业提问'}
                        </small>
                        <p>{turn.question}</p>
                      </div>
                    </div>
                    {turn.answer && (
                      <div className="message candidate">
                        <span className="chat-avatar">你</span>
                        <div>
                          <small>YOUR ANSWER</small>
                          <p>{turn.answer}</p>
                        </div>
                      </div>
                    )}
                    {turn.feedback && (
                      <div className="feedback">
                        <div className="flex-between">
                          <b>{session.language === 'en' ? 'Round feedback' : '本轮反馈'}</b>
                          <Tag tone="orange-tag">
                            {turn.feedback.score === null
                              ? '结构检查'
                              : `${turn.feedback.score} / 100 · AI 评价`}
                          </Tag>
                        </div>
                        <p>{turn.feedback.summary}</p>
                        {turn.feedback.strengths.length > 0 && (
                          <p>
                            <b>已体现：</b>
                            {turn.feedback.strengths.join(' · ')}
                          </p>
                        )}
                        {turn.feedback.weaknesses.length > 0 && (
                          <p>
                            <b>待补充：</b>
                            {turn.feedback.weaknesses.join(' · ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {session.status === 'active' ? (
                <div className="answer-box">
                  <textarea
                    aria-label="面试回答"
                    rows={5}
                    placeholder={
                      session.language === 'en'
                        ? 'Take your time. Explain your reasoning with concrete examples…'
                        : '先讲结论，再解释原理、具体例子和取舍…'
                    }
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={busy}
                  />
                  <div className="form-footer">
                    <span>
                      {remaining === 0
                        ? '时间已到，本次提交后结束面试'
                        : `${answer.length} 字符 · 提交后进入下一轮`}
                    </span>
                    <Button primary onClick={submit} disabled={busy || answer.trim().length < 5}>
                      {busy ? <Busy /> : <Send size={15} />}提交回答
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="session-complete">
                  <Check size={22} />
                  <h3>本次训练已归档</h3>
                  <p>反馈和能力记录已保存，可以继续安排下一次训练。</p>
                  <Button primary onClick={() => navigate('growth')}>
                    查看成长档案 <ArrowRight size={15} />
                  </Button>
                </div>
              )}
            </div>
            <aside>
              <div className="panel padded">
                <span className="eyebrow">INTERVIEW BRIEF</span>
                <h3>把思考过程说出来</h3>
                <ol className="tips">
                  <li>确认问题与输入边界</li>
                  <li>说明方案及选择依据</li>
                  <li>结合项目举具体例子</li>
                  <li>讨论复杂度与失败情况</li>
                </ol>
                <p className="hint">
                  {session.mode === 'local'
                    ? '当前使用本地引导。结构反馈不代表专业能力评分。'
                    : 'AI 反馈仅作为训练参考，可以回到原始回答核对。'}
                </p>
                {session.status === 'active' && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      work(async () => {
                        setSession(await api(`/interviews/${session.id}/finish`, {}));
                        notify('面试已结束并归档');
                      })
                    }
                  >
                    <Square size={13} />
                    结束并归档
                  </Button>
                )}
              </div>
            </aside>
          </div>
        ))}
      {tab === 'history' &&
        (state.sessions.length ? (
          <div className="panel">
            {state.sessions.map((s) => (
              <button
                className="history-row"
                key={s.id}
                onClick={() => {
                  setSession(s);
                  setAnswer('');
                  setTab('session');
                }}
              >
                <FileText size={22} />
                <div>
                  <h3>
                    {s.companyName} · {s.role}
                  </h3>
                  <p>
                    {date(s.startedAt)} · {s.turns.filter((t) => t.answer).length} 次作答 ·{' '}
                    {s.language === 'en' ? 'English' : '中文'}
                  </p>
                </div>
                <Tag>{s.status === 'active' ? '进行中' : '已归档'}</Tag>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="还没有面试记录"
            description="每次问答与反馈都会保留，方便回看自己的成长。"
          />
        ))}
      {editing && (
        <Modal label="编辑面试官" onClose={() => setEditing(null)}>
          <PageTitle
            en="INTERVIEWER PROFILE"
            title="定义你的面试官"
            description="调整关注点和追问方式。"
          />
          <div className="form-grid">
            <Field label="名称">
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </Field>
            <Field label="岗位">
              <input
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              />
            </Field>
          </div>
          <Field label="关注领域（用逗号分隔）">
            <input
              value={editing.focus.join(',')}
              onChange={(e) => setEditing({ ...editing, focus: e.target.value.split(/[,，]/) })}
            />
          </Field>
          <Field label="追问偏好">
            <textarea
              rows={5}
              value={editing.style}
              onChange={(e) => setEditing({ ...editing, style: e.target.value })}
            />
          </Field>
          <Field label="来源说明">
            <input
              value={editing.evidence}
              onChange={(e) => setEditing({ ...editing, evidence: e.target.value })}
            />
          </Field>
          <div className="form-footer">
            <Button onClick={() => setEditing(null)}>取消</Button>
            <Button
              primary
              disabled={busy}
              onClick={() =>
                work(async () => {
                  await api(`/profiles/${editing.id}`, editing, 'PUT');
                  setProfileId(editing.id);
                  setEditing(null);
                  notify('面试官配置已保存');
                })
              }
            >
              保存配置
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
