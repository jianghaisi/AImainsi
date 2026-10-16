import { useState } from 'react';
import { Check, KeyRound, Plug, Save } from 'lucide-react';
import type { Shared } from './App';
import { api, languages } from './api';
import { Button, Busy, Field, PageTitle, SectionTitle, Tag } from './ui';
export function Settings({ state, refresh, notify }: Shared) {
  const [form, setForm] = useState({ ...state.settings }),
    [busy, setBusy] = useState(false);
  const update = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));
  async function save(test = false) {
    setBusy(true);
    try {
      await api('/settings', form, 'PUT');
      await refresh();
      if (test) {
        const r = await api('/model/test', {});
        notify(`连接成功：${r.message}`);
      } else notify('终端设置已保存');
      setForm((f) => {
        const next = {
          ...f,
          hasApiKey: f.apiKey !== undefined ? !!f.apiKey : f.hasApiKey,
          hasJudgeKey: f.judgeKey !== undefined ? !!f.judgeKey : f.hasJudgeKey,
        };
        delete next.apiKey;
        delete next.judgeKey;
        return next;
      });
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        en="CONFIGURATION / YOUR TERMINAL"
        title="按你的方式训练"
        description="从语言到面试官，从模型到题库，训练规则由你定义。"
        action={
          <Button primary disabled={busy} onClick={() => save()}>
            {busy ? <Busy /> : <Save size={16} />}保存全部设置
          </Button>
        }
      />
      <div className="settings-grid">
        <section className="panel padded">
          <SectionTitle code="01" title="个人训练偏好" />
          <div className="form-grid">
            <Field label="你的称呼">
              <input value={form.name} onChange={(e) => update('name', e.target.value)} />
            </Field>
            <Field label="目标公司">
              <select
                value={form.targetCompany}
                onChange={(e) => update('targetCompany', e.target.value)}
              >
                {state.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="目标岗位">
            <input value={form.role} onChange={(e) => update('role', e.target.value)} />
          </Field>
          <div className="form-grid">
            <Field label="默认编程语言">
              <select value={form.language} onChange={(e) => update('language', e.target.value)}>
                {Object.entries(languages).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="面试对话语言">
              <select
                value={form.interviewLanguage}
                onChange={(e) => update('interviewLanguage', e.target.value)}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </Field>
          </div>
          <div className="form-grid three">
            <Field label="每轮时长 / 分钟">
              <input
                type="number"
                min={5}
                max={120}
                value={form.minutes}
                onChange={(e) => update('minutes', Number(e.target.value))}
              />
            </Field>
            <Field label="问题轮数">
              <input
                type="number"
                min={1}
                max={15}
                value={form.rounds}
                onChange={(e) => update('rounds', Number(e.target.value))}
              />
            </Field>
            <Field label="每日学习 / 分钟">
              <input
                type="number"
                min={10}
                max={240}
                value={form.dailyMinutes}
                onChange={(e) => update('dailyMinutes', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="你的面试规则" hint="会与面试官配置一起影响 AI 提问。">
            <textarea
              rows={4}
              value={form.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
            />
          </Field>
        </section>
        <section className="panel padded">
          <SectionTitle
            code="02"
            title="自定义模型接口"
            action={<Tag>{form.hasApiKey ? '已存储密钥' : '未存储密钥'}</Tag>}
          />
          <p className="muted">
            使用兼容 Chat Completions
            的模型服务，也可连接本地模型。密钥保存在当前设备。桌面版使用系统加密，Android
            使用系统密钥库；密钥不进入档案导出。
          </p>
          <Field
            label="API Base URL"
            hint="填写基础地址（如 https://your-provider.example/v1），系统追加 /chat/completions。"
          >
            <input
              placeholder="https://your-provider.example/v1"
              value={form.apiUrl}
              onChange={(e) => update('apiUrl', e.target.value)}
            />
          </Field>
          <Field label="API Key" hint="留空且不编辑会保留现有密钥；点击清除可移除。">
            <div className="input-action">
              <input
                aria-label="API Key"
                type="password"
                autoComplete="off"
                placeholder={
                  form.hasApiKey ? '已保存 · 输入新密钥以替换' : '本地模型无鉴权时可留空'
                }
                value={form.apiKey ?? ''}
                onChange={(e) => update('apiKey', e.target.value)}
              />
              <button
                onClick={() => {
                  update('apiKey', '');
                  update('hasApiKey', false);
                }}
              >
                清除
              </button>
            </div>
          </Field>
          <div className="form-grid">
            <Field label="模型名称">
              <input
                placeholder="填写服务商的模型 ID"
                value={form.model}
                onChange={(e) => update('model', e.target.value)}
              />
            </Field>
            <Field label="Temperature">
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(e) => update('temperature', Number(e.target.value))}
              />
            </Field>
          </div>
          <Button disabled={busy || !form.apiUrl || !form.model} onClick={() => save(true)}>
            {busy ? <Busy /> : <Plug size={15} />}保存并测试连接
          </Button>
          <p className="hint">测试会发送一条简短请求；面试时才会发送你的简历与作答内容。</p>
        </section>
        <section className="panel padded">
          <SectionTitle code="03" title="题库与界面" />
          <label className="toggle-row">
            <div>
              <strong>定时同步公开题库</strong>
              <p>桌面服务运行或 Android 应用打开期间检查新增索引。</p>
            </div>
            <input
              type="checkbox"
              checked={form.autoSync}
              onChange={(e) => update('autoSync', e.target.checked)}
            />
          </label>
          <Field label="同步间隔 / 小时">
            <input
              type="number"
              min={1}
              max={168}
              value={form.syncHours}
              onChange={(e) => update('syncHours', Number(e.target.value))}
            />
          </Field>
          <label className="toggle-row">
            <div>
              <strong>减少动态效果</strong>
              <p>保留反馈颜色，取消页面位移动画。</p>
            </div>
            <input
              type="checkbox"
              checked={form.reducedMotion}
              onChange={(e) => update('reducedMotion', e.target.checked)}
            />
          </label>
          <Field label="终端强调色">
            <div className="color-picker">
              <input
                aria-label="终端强调色"
                type="color"
                value={form.accent}
                onChange={(e) => update('accent', e.target.value)}
              />
              <code>{form.accent}</code>
            </div>
          </Field>
        </section>
        <section className="panel padded">
          <SectionTitle code="04" title="自定义判题接口" />
          <p className="muted">
            Python 和 JavaScript 在浏览器运行。Java / C++ 可连接自己的沙箱判题服务。
          </p>
          <Field label="判题 URL">
            <input
              placeholder="https://your-judge.example/run"
              value={form.judgeUrl}
              onChange={(e) => update('judgeUrl', e.target.value)}
            />
          </Field>
          <Field label="判题 API Key">
            <div className="input-action">
              <input
                aria-label="判题 API Key"
                type="password"
                autoComplete="off"
                value={form.judgeKey ?? ''}
                placeholder={form.hasJudgeKey ? '已保存 · 输入以替换' : '可选 Bearer Token'}
                onChange={(e) => update('judgeKey', e.target.value)}
              />
              <button
                onClick={() => {
                  update('judgeKey', '');
                  update('hasJudgeKey', false);
                }}
              >
                清除
              </button>
            </div>
          </Field>
          <details className="integration-help">
            <summary>接口约定</summary>
            <p>
              POST JSON：language、code、questionId、args、tests。tests 为 input 参数数组与 expected
              结果。服务负责构造运行环境，并返回每个用例的结果。
            </p>
            <pre>{'{"results":[{"passed":true,"actual":3}]}'}</pre>
            <p>返回用例数量必须匹配输入。请求超时 30 秒；代码和测试会发往你指定的服务。</p>
          </details>
        </section>
      </div>
    </>
  );
}
