import { test, expect } from '@playwright/test';
import snapshot from '../../shared/catalog-data.json' with { type: 'json' };
test('former index questions open as mobile exercises and keep study notes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#bank');
  await page.getByRole('button', { name: /浏览全部 16 套题单/ }).click();
  await page.locator('.collection-card').filter({ hasText: '程序员面试金典' }).click();
  await page.locator('.question-table tbody tr').first().locator('td:nth-child(2) button').click();
  await expect(page.getByLabel('代码编辑器')).toHaveValue(/class Solution/);
  await page.getByRole('button', { name: '记忆卡片', exact: true }).click();
  await page.getByLabel('我的思路与易错点').fill('记住边界，明天再复述');
  await page.getByRole('button', { name: '保存笔记', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('笔记已保存');
  await page.reload();
  await page.getByRole('button', { name: '记忆卡片', exact: true }).click();
  await expect(page.getByLabel('我的思路与易错点')).toHaveValue('记住边界，明天再复述');
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((r) => {
      const req = indexedDB.open('sequence-personal');
      req.onsuccess = () => r(req.result);
    });
    return await new Promise<any>((r) => {
      const req = db.transaction('state').objectStore('state').get('personal');
      req.onsuccess = () => r(req.result);
    });
  });
  expect(stored.attempts).toHaveLength(0);
  expect(stored.questions.length).toBeGreaterThan(640);
});
test('published catalog refresh keeps progress, rejects broken feeds and remains usable', async ({
  page,
}) => {
  await page.goto('/#bank');
  await page.getByRole('button', { name: '收藏 两数之和', exact: true }).click();
  await expect(page.getByRole('button', { name: '取消收藏 两数之和', exact: true })).toBeVisible();
  await page.route(
    'https://raw.githubusercontent.com/jianghaisi/AImainsi/main/shared/catalog-data.json',
    (route) => route.fulfill({ json: snapshot }),
  );
  await page.getByRole('button', { name: '更新题单', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('671 道题');
  await expect(page.getByRole('button', { name: '取消收藏 两数之和', exact: true })).toBeVisible();
  await page.route(
    'https://raw.githubusercontent.com/jianghaisi/AImainsi/main/shared/catalog-data.json',
    (route) => route.fulfill({ json: { version: 1, questions: [] } }),
  );
  await page.getByRole('button', { name: '更新题单', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('更新失败');
  await expect(page.locator('.question-table tbody tr')).toHaveCount(25);
});
