import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Braces,
  ChevronRight,
  Database,
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings2,
  Target,
  X,
  Wifi,
  Check,
  TriangleAlert,
} from 'lucide-react';
import type { AppState, Page, Question } from './types';
import { api, date } from './api';
import { Button, SectionTitle, Tag, PageTitle } from './ui';
import { Interview } from './Interview';
import { Bank, Sources } from './Library';
import { Coding } from './Coding';
import { Growth } from './Growth';
import { Settings } from './Settings';
const navigation: [Page, string, string, typeof Target][] = [
  ['dashboard', '作战总览', 'OVERVIEW', LayoutDashboard],
  ['interview', '模拟面试', 'INTERVIEW', MessageSquare],
  ['bank', '情报题库', 'QUESTION BANK', BookOpen],
  ['coding', '手撕训练', 'CODING LAB', Braces],
  ['growth', '成长档案', 'GROWTH', Activity],
];
export interface Shared {
  state: AppState;
  refresh: () => Promise<void>;
  notify: (message: string, error?: boolean) => void;
  navigate: (page: Page) => void;
  practice: (q: Question) => void;
}
export default function App() {
  const [state, setState] = useState<AppState | null>(null),
    [page, setPage] = useState<Page>((location.hash.slice(1) as Page) || 'dashboard'),
    [selected, setSelected] = useState<string>(
      localStorage.getItem('last-practice') || 'attention',
    ),
    [error, setError] = useState(''),
    [toast, setToast] = useState<{ message: string; error: boolean } | null>(null),
    [menu, setMenu] = useState(false);
  const refresh = useCallback(async () => {
    setState(await api<AppState>('/state'));
    setError('');
  }, []);
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    const timer = setInterval(() => refresh().catch(() => {}), 60000);
    return () => clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    const listener = () => {
      const value = location.hash.slice(1) as Page;
      setPage(
        [...navigation.map((n) => n[0]), 'sources', 'settings'].includes(value)
          ? value
          : 'dashboard',
      );
    };
    window.addEventListener('hashchange', listener);
    return () => window.removeEventListener('hashchange', listener);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (state) {
      document.documentElement.style.setProperty('--accent', state.settings.accent);
      document.documentElement.classList.toggle('reduce-motion', state.settings.reducedMotion);
    }
  }, [state?.settings.accent, state?.settings.reducedMotion]);
  const notify = (message: string, error = false) => setToast({ message, error });
  const navigate = (next: Page) => {
    setPage(next);
    location.hash = next;
    setMenu(false);
    window.scrollTo(0, 0);
  };
  const practice = (q: Question) => {
    setSelected(q.id);
    localStorage.setItem('last-practice', q.id);
    navigate(q.kind === 'coding' ? 'coding' : 'bank');
  };
  if (!state)
    return (
      <div className="boot">
        <span className="brand-symbol">∕∕</span>
        <h1>序列 / SEQUENCE</h1>
        <p>{error || '正在连接你的训练档案…'}</p>
        {error && (
          <Button onClick={() => refresh().catch((e) => setError(e.message))}>重新连接</Button>
        )}
      </div>
    );
  const shared = { state, refresh, notify, navigate, practice };
  const label =
    navigation.find((n) => n[0] === page)?.[1] || (page === 'settings' ? '终端设置' : '数据源管理');
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <a href="#dashboard" className="brand" onClick={() => navigate('dashboard')}>
          <span className="brand-symbol">∕∕</span>
          <div>
            <strong>
              序列<span> SEQUENCE</span>
            </strong>
            <small>AI INTERVIEW TERMINAL</small>
          </div>
        </a>
        <div className="sidebar-caption">
          训练工作空间 <span>01</span>
        </div>
        <nav>
          {navigation.map(([id, title, en, Icon], i) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>
                {title}
                <small>{en}</small>
              </span>
              <em>0{i + 1}</em>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="terminal-card">
            <span className="tiny-label">CURRENT OBJECTIVE</span>
            <strong>{state.settings.role}</strong>
            <span>
              {state.profiles.find((p) => p.id === state.settings.targetCompany)?.name ||
                '自定义目标'}{' '}
              / 持续精进
            </span>
            <div className="mini-bars">
              {Array.from({ length: 22 }, (_, i) => (
                <i key={i} className={i < 8 ? 'lit' : ''} />
              ))}
            </div>
          </div>
          <button
            className={`nav-item small ${page === 'sources' ? 'active' : ''}`}
            onClick={() => navigate('sources')}
          >
            <Database size={17} />
            数据源管理
            <ChevronRight size={14} />
          </button>
          <button
            className={`nav-item small ${page === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('settings')}
          >
            <Settings2 size={17} />
            终端设置
            <ChevronRight size={14} />
          </button>
          <div className="user-card">
            <span className="avatar">{state.settings.name.slice(0, 1)}</span>
            <div>
              <b>{state.settings.name}</b>
              <small>个人训练终端</small>
            </div>
            <span className="status-dot" />
          </div>
        </div>
      </aside>
      {menu && (
        <button className="mobile-scrim" aria-label="关闭菜单" onClick={() => setMenu(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="打开菜单"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </button>
            <span>WORKSPACE</span>
            <ChevronRight size={13} />
            <b>{label}</b>
          </div>
          <div className="topbar-right">
            <span className="connection">
              <span className="status-dot" />
              本地档案已连接
            </span>
            <span className="top-date">
              {new Date()
                .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
                .replaceAll('/', '.')}
            </span>
          </div>
        </header>
        <main key={page}>
          {page === 'dashboard' && <Dashboard {...shared} />}
          {page === 'interview' && <Interview {...shared} />}
          {page === 'bank' && <Bank {...shared} selectedId={selected} />}
          {page === 'coding' && <Coding {...shared} selectedId={selected} />}
          {page === 'growth' && <Growth {...shared} />}
          {page === 'sources' && <Sources {...shared} />}
          {page === 'settings' && <Settings {...shared} />}
        </main>
        <footer>
          <span>SEQUENCE / 每一次训练，都有迹可循。</span>
          <span>
            PERSONAL INTERVIEW SYSTEM <b>v0.2</b>
          </span>
        </footer>
      </div>
      {toast && (
        <div role="status" className={`toast ${toast.error ? 'error' : ''}`}>
          {toast.error ? <TriangleAlert size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
          <button className="icon-button" aria-label="关闭通知" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function Dashboard({ state, navigate, practice }: Shared) {
  const finished = state.sessions.filter((s) => s.status === 'completed'),
    passed = new Set(state.attempts.filter((a) => a.passed === a.total).map((a) => a.questionId));
  const due = state.reviews.filter((r) => Date.parse(r.dueAt) <= Date.now());
  const tasks = [
    ...due.map((r) => state.questions.find((q) => q.id === r.questionId)).filter(Boolean),
    ...state.questions.filter((q) => q.kind === 'coding' && !passed.has(q.id)),
  ]
    .filter((q, i, arr) => arr.findIndex((x) => x?.id === q?.id) === i)
    .slice(0, 3) as Question[];
  const profile =
    state.profiles.find((p) => p.id === state.settings.targetCompany) || state.profiles[0];
  return (
    <>
      <PageTitle
        en="OPERATION / OVERVIEW"
        title="准备好，迎接下一次机会"
        description="把不确定的面试，变成有准备的每一步。"
        action={
          <Button onClick={() => navigate('settings')}>
            <Target size={15} />
            调整训练目标
          </Button>
        }
      />
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-label">
            <span className="status-dot" />
            PERSONAL TRAINING PROTOCOL <span>01 — ∞</span>
          </div>
          <h2>
            你的下一场面试，
            <br />
            从这里<span>开始。</span>
          </h2>
          <p>
            简历驱动的深度提问，真实场景下的代码训练。
            <br />
            发现盲区，建立自己的解题体系。
          </p>
          <div className="hero-actions">
            <Button primary onClick={() => navigate('interview')}>
              开启模拟面试 <ArrowRight size={18} />
            </Button>
            <button
              className="hero-secondary"
              onClick={() => practice(state.questions.find((q) => q.id === 'attention')!)}
            >
              进入手撕训练 <ChevronRight size={15} />
            </button>
          </div>
          <div className="hero-meta">
            <span>目标 / {profile.name}</span>
            <span>方向 / {state.settings.role}</span>
            <span>{state.settings.minutes} MIN / 轮</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="art-caption">
            BUILD YOUR
            <br />
            NEXT POSSIBILITY.
          </span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="art-cross a">+</div>
          <div className="art-cross b">+</div>
          <div className="art-core">
            <span>PREPARE.</span>
            <strong>
              READY
              <br />
              FOR
              <br />
              <i>NEXT</i>
              <b>↗</b>
            </strong>
          </div>
          <span className="art-bottom">ITERATE / LEARN / EVOLVE</span>
        </div>
      </section>
      <div className="stats-strip">
        {[
          [String(finished.length).padStart(2, '0'), '已完成面试', 'INTERVIEWS'],
          [String(passed.size).padStart(2, '0'), '已通过手撕题', 'PROBLEMS SOLVED'],
          [String(due.length).padStart(2, '0'), '待复习知识点', 'REVIEW QUEUE'],
          [
            String(state.questions.filter((q) => q.status === 'published').length).padStart(2, '0'),
            '可用题目与索引',
            'QUESTION LIBRARY',
          ],
        ].map(([value, title, en], i) => (
          <div key={title}>
            <span className="stat-index">0{i + 1} /</span>
            <strong>
              {value}
              <i>↗</i>
            </strong>
            <p>
              {title}
              <small>{en}</small>
            </p>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <div>
          <SectionTitle
            code="01"
            title="今日训练序列"
            action={
              <button className="text-link" onClick={() => navigate('growth')}>
                完整学习路线 <ArrowRight size={14} />
              </button>
            }
          />
          <div className="task-list">
            {tasks.map((q, i) => (
              <button className="task-row" key={q.id} onClick={() => practice(q)}>
                <div className={`task-index ${i === 0 ? 'highlight' : ''}`}>
                  0{i + 1}
                  <span>{i === 0 ? 'START' : 'NEXT'}</span>
                </div>
                <div className="task-info">
                  <div>
                    <Tag tone={i === 0 ? 'orange-tag' : ''}>
                      {due.some((r) => r.questionId === q.id)
                        ? '到期复习'
                        : i === 0
                          ? '重点突破'
                          : '巩固练习'}
                    </Tag>
                    <span>{q.topic}</span>
                  </div>
                  <h3>{q.title}</h3>
                  <small>{q.difficulty} · 含题解与记忆方法</small>
                </div>
                <ArrowRight size={21} />
              </button>
            ))}
          </div>
          <SectionTitle
            code="02"
            title="选择你的目标公司"
            action={
              <button className="text-link" onClick={() => navigate('interview')}>
                自定义面试官 <ArrowRight size={14} />
              </button>
            }
          />
          <div className="company-grid">
            {state.profiles.slice(0, 4).map((p) => (
              <button
                className="company-card"
                key={p.id}
                onClick={() => {
                  sessionStorage.setItem('selectedCompany', p.id);
                  navigate('interview');
                }}
              >
                <div className="company-initial" style={{ color: p.color }}>
                  {p.name.slice(0, 1)}
                  <ArrowRight size={15} />
                </div>
                <strong>{p.name}</strong>
                <span>{p.en}</span>
                <small>{p.id === 'huawei' ? '面经参考' : '可编辑训练预设'}</small>
              </button>
            ))}
          </div>
        </div>
        <aside className="overview-aside">
          <div className="panel capability">
            <SectionTitle code="03" title="能力观测" />
            <div className="radar-wrap">
              <svg viewBox="0 0 260 210" role="img" aria-label="能力观测；完成训练后生成记录">
                {[1, 0.7, 0.4].map((k) => (
                  <polygon
                    key={k}
                    points={Array.from({ length: 6 }, (_, i) => {
                      const a = (i * Math.PI) / 3 - Math.PI / 2;
                      return `${130 + Math.cos(a) * 73 * k},${103 + Math.sin(a) * 73 * k}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#d9dbd7"
                  />
                ))}
                {Array.from({ length: 6 }, (_, i) => {
                  const a = (i * Math.PI) / 3 - Math.PI / 2;
                  return (
                    <line
                      key={i}
                      x1="130"
                      y1="103"
                      x2={130 + Math.cos(a) * 73}
                      y2={103 + Math.sin(a) * 73}
                      stroke="#e1e2de"
                    />
                  );
                })}
                <polygon
                  points={Array.from({ length: 6 }, (_, i) => {
                    const a = (i * Math.PI) / 3 - Math.PI / 2,
                      k = (state.growth[i]?.score ?? 0) / 100;
                    return `${130 + Math.cos(a) * 73 * k},${103 + Math.sin(a) * 73 * k}`;
                  }).join(' ')}
                  fill="#ee6b3620"
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
                {['算法基础', '模型原理', '工程实践', '项目表达', '系统设计', '代码能力'].map(
                  (x, i) => {
                    const a = (i * Math.PI) / 3 - Math.PI / 2;
                    return (
                      <text
                        key={x}
                        x={130 + Math.cos(a) * 102}
                        y={106 + Math.sin(a) * 91}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6e7474"
                      >
                        {state.growth[i]?.topic || x}
                      </text>
                    );
                  },
                )}
              </svg>
            </div>
            <p>
              {state.growth.length
                ? '训练结果已更新，查看薄弱项安排下一步。'
                : '尚未建立能力画像，完成一次训练即可开始。'}
            </p>
            <button className="text-link" onClick={() => navigate('growth')}>
              查看成长档案 <ArrowRight size={14} />
            </button>
          </div>
          <div className="source-status">
            <div>
              <Wifi size={16} />
              <b>题库情报站</b>
              <Tag>{state.settings.autoSync ? '定时更新' : '手动更新'}</Tag>
            </div>
            <p>Zero2Leetcode · Spider_XHS</p>
            <span>上次同步 / {date(state.sources.lastSync)}</span>
            <button className="text-link" onClick={() => navigate('sources')}>
              管理来源与更新 <ArrowRight size={14} />
            </button>
          </div>
          <div className="resume-tip">
            <FileText size={19} />
            <div>
              <b>{state.resume.text ? '简历档案已就绪' : '让面试，更了解你'}</b>
              <p>
                {state.resume.text
                  ? '根据你的经历，追问到技术细节。'
                  : '导入简历，开启有针对性的专业追问。'}
              </p>
              <button className="text-link" onClick={() => navigate('interview')}>
                {state.resume.text ? '查看简历' : '建立简历档案'} <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
