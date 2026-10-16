import { _electron as electron } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
mkdirSync('.data/desktop-smoke', { recursive: true });
const packaged = process.env.SEQUENCE_PACKAGED;
const app = await electron.launch({
  ...(packaged ? { executablePath: path.resolve(packaged), args: [] } : { args: ['.'] }),
  env: { ...process.env, SEQUENCE_SMOKE: '1', DATA_DIR: path.resolve('.data/desktop-smoke') },
  timeout: 30000,
});
app.process().stderr.on('data', (value) => process.stderr.write(value));
try {
  const page = await app.firstWindow({ timeout: 20000 });
  await page.getByRole('heading', { name: '准备好，迎接下一次机会.' }).waitFor({ timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'docs/desktop-app.png', animations: 'disabled' });
  const state = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
  if (state.settings.apiKey !== undefined) throw new Error('Secret leaked');
  await page.evaluate(async (settings) => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, apiKey: 'sequence-smoke-test-not-a-real-key' }),
    });
    if (!response.ok) throw new Error('Settings save failed');
  }, state.settings);
  const db = new DatabaseSync(path.resolve('.data/desktop-smoke/aimainsi.sqlite'), {
    readOnly: true,
  });
  const stored = JSON.parse(
    db.prepare('SELECT value FROM state WHERE key=?').get('settings').value,
  );
  db.close();
  if (!stored.apiKey.startsWith('enc:') || stored.apiKey.includes('sequence-smoke-test'))
    throw new Error('Key not encrypted at rest');
  const archive = await page.evaluate(() => fetch('/api/export').then((r) => r.text()));
  if (archive.includes('sequence-smoke-test-not-a-real-key')) throw new Error('Secret in export');
  await page.getByRole('button', { name: '手撕训练 CODING LAB' }).click();
  await page.getByLabel('训练题目').selectOption('attention');
  await page.getByLabel('编程语言').selectOption('python');
  await page.getByRole('button', { name: '思路与题解' }).click();
  await page.getByRole('button', { name: '展开参考实现' }).click();
  await page.getByRole('button', { name: '载入参考实现' }).click();
  await page.getByRole('button', { name: '运行并提交' }).click();
  await page.getByText('通过 4 / 4 个用例').waitFor({ timeout: 45000 });
  console.log(
    'Electron window, Python worker, encrypted key storage and redacted export verified.',
  );
} finally {
  await app.close();
}
