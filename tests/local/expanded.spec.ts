import { test, expect } from '@playwright/test';
test('company navigation and SQL run on a phone viewport with no external service', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const external: string[] = [];
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/#bank');
  await page.getByRole('button', { name: '华为 71 题', exact: true }).click();
  await expect(page.getByRole('heading', { name: '华为面经题单', exact: true })).toBeVisible();
  await expect(page.getByText(/非企业官方题库/).first()).toBeVisible();
  await page.getByLabel('搜索题目').fill('415');
  await page.getByRole('button', { name: /415\. 字符串相加/ }).click();
  await expect(page.getByLabel('代码编辑器')).toHaveValue(/def addStrings/);
  await page.getByRole('button', { name: '思路与题解', exact: true }).click();
  await page.getByRole('button', { name: '展开参考实现' }).click();
  await page.getByRole('button', { name: '载入参考实现' }).click();
  await page.getByRole('button', { name: '运行并提交' }).click();
  await expect(page.getByText(/通过 3 \/ 3 个用例/)).toBeVisible({ timeout: 45000 });
  await page.getByLabel('训练题目').selectOption('lc-find-customer-referee');
  await page.getByLabel('编程语言').selectOption('sql');
  await page.getByRole('button', { name: '展开参考实现' }).click();
  await page.getByRole('button', { name: '载入参考实现' }).click();
  await page.getByRole('button', { name: '运行并提交' }).click();
  await expect(page.getByText('通过 3 / 3 个用例')).toBeVisible({ timeout: 20000 });
  await page.getByLabel('代码编辑器').fill('SELECT name FROM Customer WHERE referee_id <> 2;');
  await page.getByRole('button', { name: '运行并提交' }).click();
  await expect(page.getByText('通过 1 / 3 个用例')).toBeVisible({ timeout: 20000 });
  expect(external).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results-local/sql-mobile.png', fullPage: true });
  await page.reload();
  await page.getByLabel('编程语言').selectOption('sql');
  await expect(page.getByLabel('代码编辑器')).toHaveValue(
    'SELECT name FROM Customer WHERE referee_id <> 2;',
  );
});
