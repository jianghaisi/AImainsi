import { ArrowRight, Check, Clock, Download, TrendingUp } from 'lucide-react';
import type { Shared } from './App';
import { api, date, exportArchive } from './api';
import { Button, Empty, PageTitle, SectionTitle, Tag } from './ui';
export function Growth({ state, notify, refresh, practice, navigate }: Shared) {
  const observed = state.growth;
  const topics = [
    ...new Set([
      ...observed.map((x) => x.topic),
      ...(state.profiles.find((p) => p.id === state.settings.targetCompany)?.focus || []),
      ...state.questions.filter((q) => q.kind === 'coding').map((q) => q.topic),
    ]),
  ].slice(0, 6);
  const tasks = topics.flatMap((topic, i) => {
    const q = state.questions.find((q) => q.topic === topic && q.status === 'published');
    return q ? [{ id: `plan-${q.id}`, q, topic, i }] : [];
  });
  const total =
      state.attempts.length + state.sessions.filter((s) => s.status === 'completed').length,
    done = tasks.filter((t) => state.planDone.includes(t.id)).length;
  const reviews = state.reviews
    .map((r) => ({ ...r, q: state.questions.find((q) => q.id === r.questionId) }))
    .filter((r) => r.q)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  async function toggle(id: string) {
    try {
      const ids = state.planDone.includes(id)
        ? state.planDone.filter((x) => x !== id)
        : [...state.planDone, id];
      await api('/plan', { ids }, 'PUT');
      await refresh();
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  return (
    <>
      <PageTitle
        en="ARCHIVE / PERSONAL GROWTH"
        title="看见每一点进步"
        description="从真实训练记录中找到薄弱环节，把下一步变得具体。"
        action={
          <Button onClick={() => exportArchive().catch((e) => notify(e.message, true))}>
            <Download size={15} />
            导出个人档案
          </Button>
        }
      />
      <div className="growth-banner">
        <div>
          <span className="eyebrow">YOUR LEARNING JOURNEY</span>
          <h2>
            不是刷过多少题，
            <br />
            是理解了多少种思路。
          </h2>
          <p>
            每日 {state.settings.dailyMinutes} 分钟 · 路线优先安排薄弱领域，再覆盖目标岗位考点。
          </p>
        </div>
        <div className="growth-counter">
          <strong>{String(total).padStart(2, '0')}</strong>
          <span>次训练记录 / KEEP GOING</span>
        </div>
      </div>
      <div className="two-columns growth-columns">
        <div>
          <SectionTitle code="01" title="薄弱点观察" />
          {observed.length ? (
            <div className="panel ability-list">
              {observed.map((item) => (
                <div className="ability-row" key={item.topic}>
                  <div>
                    <b>{item.topic}</b>
                    <span>{item.count} 个题目 / 轮次</span>
                  </div>
                  <div className="progress-track">
                    <i style={{ width: `${item.score || 0}%` }} />
                  </div>
                  <strong>{item.score === null ? '待评估' : item.score + '%'}</strong>
                </div>
              ))}
              <p className="hint">
                手撕使用每题最近一次通过率；面试使用模型评价。不同测量方式仅作为训练线索，本地结构检查不参与评分。
              </p>
            </div>
          ) : (
            <div className="panel">
              <Empty
                title="用一次训练，建立起点"
                description="完成手撕测试或面试后，这里会出现真实的能力记录。"
                action={
                  <Button onClick={() => navigate('coding')}>
                    开始手撕训练 <ArrowRight size={15} />
                  </Button>
                }
              />
            </div>
          )}
          <SectionTitle
            code="02"
            title="你的学习路线"
            action={
              <span className="muted small-text">
                {done} / {tasks.length} 已完成
              </span>
            }
          />
          <div className="roadmap">
            {tasks.map(({ id, q, topic, i }) => (
              <div
                className={`roadmap-step ${state.planDone.includes(id) ? 'completed' : ''}`}
                key={id}
              >
                <button
                  className="step-check"
                  aria-label={`标记完成 ${q.title}`}
                  onClick={() => toggle(id)}
                >
                  {state.planDone.includes(id) ? (
                    <Check size={16} />
                  ) : (
                    String(i + 1).padStart(2, '0')
                  )}
                </button>
                <div>
                  <span className="eyebrow">
                    STAGE 0{i + 1} /{' '}
                    {observed.some((x) => x.topic === topic) ? '针对训练反馈' : '目标考点覆盖'}
                  </span>
                  <h3>
                    {topic} · {q.title}
                  </h3>
                  <p>{q.memory || '梳理定义与原理，结合项目举例，再闭卷复述关键取舍。'}</p>
                  <div className="flex-between">
                    <span className="hint">
                      <Clock size={12} />
                      建议 {state.settings.dailyMinutes} 分钟：理解 → 实现 → 复述
                    </span>
                    <button className="text-link" onClick={() => practice(q)}>
                      开始学习 <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside>
          <SectionTitle code="03" title="间隔复习" />
          <div className="panel padded">
            <p className="muted">按回忆效果逐步延长间隔。忘记时，10 分钟后再试一次。</p>
            <div className="intervals">
              {[1, 3, 7, 14, 30].map((d) => (
                <span key={d}>
                  {d}
                  <small>天</small>
                </span>
              ))}
            </div>
            {reviews.length ? (
              <div className="review-list">
                {reviews.map((r) => (
                  <div key={r.questionId}>
                    <div className="flex-between">
                      <Tag tone={Date.parse(r.dueAt) <= Date.now() ? 'orange-tag' : ''}>
                        {Date.parse(r.dueAt) <= Date.now() ? '现在复习' : date(r.dueAt)}
                      </Tag>
                      <span className="hint">第 {r.stage + 1} 阶段</span>
                    </div>
                    <button onClick={() => practice(r.q!)}>
                      {r.q!.title}
                      <ArrowRight size={14} />
                    </button>
                    <div className="button-row">
                      {[
                        ['again', '忘记了'],
                        ['good', '已掌握'],
                      ].map(([quality, label]) => (
                        <button
                          className="text-link"
                          key={quality}
                          onClick={async () => {
                            try {
                              await api('/reviews', { questionId: r.questionId, quality });
                              await refresh();
                              notify('复习时间已更新');
                            } catch (e) {
                              notify((e as Error).message, true);
                            }
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint">完成手撕练习，或从题目详情加入复习队列。</p>
            )}
          </div>
          <SectionTitle code="04" title="最近训练" />
          <div className="panel activity-list">
            {state.attempts
              .slice(-6)
              .reverse()
              .map((a) => (
                <div key={a.id}>
                  <span className={`activity-dot ${a.passed === a.total ? 'success' : ''}`} />
                  <div>
                    <b>{state.questions.find((q) => q.id === a.questionId)?.title}</b>
                    <p>
                      {a.passed}/{a.total} 用例通过 · {date(a.at)}
                    </p>
                  </div>
                </div>
              ))}
            {!state.attempts.length && (
              <p className="muted">还没有运行记录。你的每次尝试都会留在这里。</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
