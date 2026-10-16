import { test, expect } from '@playwright/test';
test('standalone mobile storage, Python execution and reload work without a backend', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let apiRequests = 0;
  page.on('request', (r) => {
    if (r.url().includes('/api/')) apiRequests++;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '准备好，迎接下一次机会.' })).toBeVisible();
  await page.getByRole('button', { name: '打开菜单' }).click();
  await page.getByRole('button', { name: '手撕训练 CODING LAB' }).click();
  await page.getByLabel('编程语言').selectOption('java');
  await expect(page.getByRole('textbox', { name: '代码编辑器' })).toHaveValue(/class Solution/);
  await page.getByLabel('编程语言').selectOption('cpp');
  await expect(page.getByRole('textbox', { name: '代码编辑器' })).toHaveValue(/vector/);
  await page.getByLabel('编程语言').selectOption('python');
  await page.getByLabel('训练题目').selectOption('binary');
  await page.getByRole('button', { name: '思路与题解' }).click();
  await page.getByRole('button', { name: '展开参考实现' }).click();
  await page.getByRole('button', { name: '载入参考实现' }).click();
  await page.getByRole('button', { name: '运行并提交' }).click();
  await expect(page.getByText('通过 4 / 4 个用例')).toBeVisible({ timeout: 40000 });
  await page.reload();
  await expect(page.getByRole('heading', { name: '理解之后，亲手写出来.' })).toBeVisible();
  await page.getByRole('button', { name: '打开菜单' }).click();
  await page.getByRole('button', { name: '成长档案 GROWTH' }).click();
  await expect(page.getByText('100%', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '打开菜单' }).click();
  await page.getByRole('button', { name: '模拟面试 INTERVIEW' }).click();
  await page
    .getByLabel('简历正文')
    .fill('我用 Python 构建了 RAG 系统，负责文档清洗、向量索引和离线评测。');
  await page.getByRole('button', { name: '开始模拟面试', exact: true }).click();
  await expect(page.getByText('你的简历中提到', { exact: false })).toBeVisible();
  await context.setOffline(true);
  await page
    .getByRole('textbox', { name: '面试回答' })
    .fill('我负责设计对照实验，比较召回率与延迟，因为数据切分会影响指标。');
  await page.getByRole('button', { name: '提交回答', exact: true }).click();
  await expect(page.getByText('本地结构检查，不判断技术正确性。', { exact: false })).toBeVisible();
  await context.setOffline(false);
  expect(apiRequests).toBe(0);
  expect(errors).toEqual([]);
});
test('BYOK model responses and secrets stay out of IndexedDB exports', async ({ page }) => {
  await page.goto('/#settings');
  await page.getByLabel('API Base URL', { exact: false }).fill('https://model.test/v1');
  await page.getByLabel('API Key', { exact: true }).fill('qa-not-a-real-key');
  await page.getByLabel('模型名称').fill('qa-model');
  await page.route('https://model.test/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: 'OK' } }] }),
    }),
  );
  await page.getByRole('button', { name: '保存并测试连接' }).click();
  await expect(page.getByRole('status')).toContainText('连接成功');
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open('sequence-personal');
      r.onsuccess = () => resolve(r.result);
    });
    return await new Promise<string>((resolve) => {
      const r = db.transaction('state').objectStore('state').get('personal');
      r.onsuccess = () => resolve(JSON.stringify(r.result));
    });
  });
  expect(stored).not.toContain('qa-not-a-real-key');
});
