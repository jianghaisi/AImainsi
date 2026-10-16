export function inferTopic(text) {
  for (const [regex, topic] of [
    [/attention|transformer|注意力|MHA/i, 'Transformer'],
    [/rag|检索|向量/i, 'RAG'],
    [/lora|微调|大模型/i, '大模型'],
    [/动态|背包|硬币/, '动态规划'],
    [/岛屿|树|图|搜索|bfs|dfs/i, '图与搜索'],
    [/窗口|子串/, '滑动窗口'],
    [/栈|括号/, '栈'],
    [/k.?means|softmax|回归|梯度|loss|MLP/i, '机器学习'],
  ])
    if (regex.test(text)) return topic;
  return '综合能力';
}
export function nextReview(previous, quality, now = Date.now()) {
  const intervals = [1, 3, 7, 14, 30, 60];
  const stage = quality === 'again' ? 0 : Math.min((previous?.stage ?? -1) + 1, 5);
  return {
    stage,
    dueAt: new Date(
      now + (quality === 'again' ? 10 * 60 * 1000 : intervals[stage] * 86400000),
    ).toISOString(),
  };
}
export function coverageFeedback(answer, english = false) {
  const signals = [
    [/因为|原理|机制|because|mechanism/i, '原理解释'],
    [/指标|实验|对照|基线|metric|experiment|baseline/i, '验证方式'],
    [/复杂度|代价|成本|延迟|trade.?off|complexity|latency/i, '工程取舍'],
    [/例如|项目|负责|实现|example|project|implemented/i, '具体证据'],
  ];
  const present = signals.filter(([r]) => r.test(answer)).map(([, name]) => name);
  const missing = signals.filter(([r]) => !r.test(answer)).map(([, name]) => name);
  return {
    score: null,
    strengths: present,
    weaknesses: missing,
    summary: english
      ? 'Local structure checklist only; technical correctness has not been assessed. Add a concrete example, baseline and trade-off.'
      : '本地结构检查，不判断技术正确性。补充具体例子、对照基线和方案取舍；连接模型后可获得语义评估。',
    mode: 'local',
  };
}
export function selectPrompt(resume, profile, round, english = false, previous = '') {
  const lines = resume
    .split(/[\n。]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 8);
  const context = (lines[round % Math.max(lines.length, 1)] || '你最熟悉的项目').slice(0, 240);
  if (english)
    return [
      `Walk me through your contribution to this resume item: “${context}”. What was the baseline and measurable outcome?`,
      `Based on your last answer, what alternatives did you reject, and why? Please give concrete evidence.`,
      `What was the most difficult failure in this project? How did you identify its root cause?`,
      `How would the system behave with ten times more traffic or data? Explain the bottleneck.`,
      `How would you verify the result independently? Describe a reproducible evaluation.`,
    ][round % 5];
  return [
    `你的简历中提到「${context}」。请说明你亲自负责的部分、基线方案和最终可验证的结果。`,
    `沿着上一轮回答继续：${previous.slice(0, 80)}${previous ? '……' : ''}。还有哪种替代方案？结合${profile.focus[round % profile.focus.length] || '项目'}说明为什么没有选择它。`,
    `针对「${context}」，讲一次失败实验。你如何定位根因、排除数据问题并验证改进？`,
    `假设你的项目数据量或访问量增加十倍，最先遇到的瓶颈是什么？请解释复杂度、延迟和资源取舍。`,
    `如何让别人独立复现你的结果？说明数据切分、评测指标与线上监控。`,
  ][round % 5];
}
export function growth(questions, attempts, sessions) {
  const map = new Map();
  const add = (topic, score) => {
    const entry = map.get(topic) || { topic, scores: [], count: 0 };
    entry.count++;
    if (Number.isFinite(score)) entry.scores.push(score);
    map.set(topic, entry);
  };
  // One latest coding result per question, so retries do not inflate mastery.
  const latest = new Map();
  for (const a of attempts) latest.set(a.questionId, a);
  for (const a of latest.values())
    add(
      questions.find((q) => q.id === a.questionId)?.topic || '综合能力',
      a.total ? Math.round((a.passed / a.total) * 100) : null,
    );
  for (const s of sessions)
    for (const turn of s.turns.filter((t) => t.feedback))
      add(turn.topic || '项目表达', turn.feedback.score);
  return [...map.values()]
    .map((e) => ({
      topic: e.topic,
      count: e.count,
      score: e.scores.length
        ? Math.round(e.scores.reduce((a, b) => a + b, 0) / e.scores.length)
        : null,
    }))
    .sort((a, b) => (a.score ?? -1) - (b.score ?? -1));
}
