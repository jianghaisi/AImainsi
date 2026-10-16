import { localMode, saveExport } from './platform';
export async function api<T = any>(path: string, body?: unknown, method?: string): Promise<T> {
  if (localMode) {
    const { localApi } = await import('./localApi');
    return localApi<T>(path, body, method || (body ? 'POST' : 'GET'));
  }
  const response = await fetch('/api' + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '请求失败');
  return result;
}
export async function exportArchive() {
  await saveExport(JSON.stringify(await api('/export'), null, 2));
}
export function date(value: string | null | undefined, short = false) {
  return value
    ? new Date(value).toLocaleString(
        'zh-CN',
        short
          ? { month: '2-digit', day: '2-digit' }
          : { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
      )
    : '尚未同步';
}
export const languages = { python: 'Python', javascript: 'JavaScript', java: 'Java', cpp: 'C++' };
