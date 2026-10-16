import { test, expect } from '@playwright/test';
test('collections, shared bookmarks, pagination and standard signature training', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#bank');
  await expect(page.getByRole('heading', { name: '从一道题，走向一类题' })).toBeVisible();
  await expect(page.locator('.collection-card')).toHaveCount(4);
  await expect(page.locator('.question-table tbody tr')).toHaveCount(25);
  await page.getByRole('button', { name: '收藏 两数之和', exact: true }).click();
  await page.getByLabel('筛选进度').selectOption('bookmarked');
  await expect(page.locator('.question-table tbody tr')).toHaveCount(1);
  await page.locator('.collection-card').filter({ hasText: 'Hot 200' }).click();
  await expect(page.locator('.question-table tbody tr')).toHaveCount(1);
  await page.getByLabel('筛选进度').selectOption('all');
  await page.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(page.getByText('2 / 8', { exact: true })).toBeVisible();
  await page.getByLabel('搜索题目').fill('LRU');
  await page.getByRole('button', { name: /146.*LRU/ }).click();
  await page.getByLabel('编程语言').selectOption('python');
  await expect(page.getByLabel('代码编辑器')).toHaveValue(/class LRUCache/);
  await page.getByRole('button', { name: '思路与题解', exact: true }).click();
  await page.getByRole('button', { name: '展开参考实现' }).click();
  await page.getByRole('button', { name: '载入参考实现' }).click();
  await page.getByRole('button', { name: '运行并提交' }).click();
  await expect(page.getByText('通过 1 / 1 个用例')).toBeVisible({ timeout: 45000 });
  await page.getByRole('button', { name: '情报题库 QUESTION BANK' }).click();
  await expect(page.locator('.collection-card').filter({ hasText: 'Hot 200' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.screenshot({
    path: 'test-results/catalog-desktop.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: 'test-results/catalog-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});
