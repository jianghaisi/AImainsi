import { test, expect } from '@playwright/test';
test('desktop navigation, local resume interview, coding and persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '准备好，迎接下一次机会.' })).toBeVisible();
  await page.screenshot({ path: 'test-results/overview-desktop.png', fullPage: true });
  await page.getByRole('button', { name: '模拟面试 INTERVIEW' }).click();
  await page
    .getByLabel('简历正文')
    .fill(
      '我负责企业知识库 RAG 系统，设计了混合检索、重排序与离线评测流程，使用 Python 实现数据管道。',
    );
  await page.getByRole('button', { name: '开始模拟面试', exact: true }).click();
  await expect(page.getByText('你的简历中提到', { exact: false })).toBeVisible();
  await page
    .getByRole('textbox', { name: '面试回答' })
    .fill(
      '我负责混合检索的实现，因为原先召回效果不佳，建立对照实验和指标基线，同时评估延迟和成本。',
    );
  await page.getByRole('button', { name: '提交回答', exact: true }).click();
  await expect(page.getByText('本地结构检查，不判断技术正确性。', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '结束并归档' }).click();
  await expect(page.getByRole('heading', { name: '本次训练已归档' })).toBeVisible();
  await page.getByRole('button', { name: '手撕训练 CODING LAB' }).click();
  await page.getByLabel('训练题目').selectOption('substring');
  await page.getByLabel('编程语言').selectOption('javascript');
  await page.getByRole('button', { name: '思路与题解' }).click();
  await page.getByRole('button', { name: '展开参考实现' }).click();
  await page.getByRole('button', { name: '载入参考实现' }).click();
  await page.getByRole('button', { name: '运行并提交' }).click();
  await expect(page.getByText('通过 5 / 5 个用例')).toBeVisible();
  await page.getByLabel('训练题目').selectOption('attention');
  await page.getByLabel('编程语言').selectOption('python');
  await page.getByRole('button', { name: '展开参考实现' }).click();
  await page.getByRole('button', { name: '载入参考实现' }).click();
  await page.getByRole('button', { name: '运行并提交' }).click();
  await expect(page.getByText('通过 4 / 4 个用例')).toBeVisible({ timeout: 45000 });
  await page.screenshot({ path: 'test-results/coding-desktop.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: '理解之后，亲手写出来.' })).toBeVisible();
  await page.getByRole('button', { name: '成长档案 GROWTH' }).click();
  await expect(page.getByText('100%', { exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile layout, filters, language setting and JSON review workflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '准备好，迎接下一次机会.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/overview-mobile.png', fullPage: true });
  await page.getByRole('button', { name: '打开菜单' }).click();
  await page.getByRole('button', { name: '情报题库 QUESTION BANK' }).click();
  await page.getByRole('textbox', { name: '搜索题目' }).fill('不存在的题目xyz');
  await expect(page.getByRole('heading', { name: '没有匹配的题目' })).toBeVisible();
  await page.getByRole('button', { name: '重置筛选' }).click();
  await page.getByRole('button', { name: '打开菜单' }).click();
  await page.getByRole('button', { name: '终端设置', exact: true }).click();
  await page.getByLabel('默认编程语言').selectOption('cpp');
  await page.getByLabel('面试对话语言').selectOption('en');
  await page.getByRole('button', { name: '保存全部设置' }).click();
  await expect(page.getByRole('status')).toContainText('终端设置已保存');
  await page.reload();
  await expect(page.getByLabel('默认编程语言')).toHaveValue('cpp');
  await page.getByRole('button', { name: '打开菜单' }).click();
  await page.getByRole('button', { name: '数据源管理', exact: true }).click();
  await page
    .getByLabel('JSON 内容')
    .fill(
      JSON.stringify([
        { title: 'E2E 测试面经', desc: '请解释 RAG 混合检索方案', url: 'https://example.com/e2e' },
      ]),
    );
  await page.getByRole('button', { name: '导入待审核区' }).click();
  await expect(page.getByRole('status')).toContainText('已导入 1 条');
  await page.getByRole('button', { name: /待审核内容/ }).click();
  await page.getByRole('button', { name: '审核内容', exact: true }).click();
  await page.getByRole('button', { name: '审核通过', exact: true }).click();
  await expect(page.getByRole('heading', { name: '待审核区已清空' })).toBeVisible();
});
