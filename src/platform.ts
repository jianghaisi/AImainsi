import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
export const nativeMobile = Capacitor.isNativePlatform();
export const localMode = nativeMobile || import.meta.env.VITE_STORAGE === 'local';
const vault = registerPlugin<{
  get(options: { key: string }): Promise<{ value: string }>;
  set(options: { key: string; value: string }): Promise<void>;
}>('SequenceVault');
// The browser-only QA mode deliberately keeps secrets in memory; APK uses Android Keystore.
const volatileSecrets: Record<string, string> = {};
export async function getSecret(key: string) {
  return nativeMobile ? (await vault.get({ key })).value : volatileSecrets[key] || '';
}
export async function setSecret(key: string, value: string) {
  if (nativeMobile) await vault.set({ key, value });
  else volatileSecrets[key] = value;
}
export async function remote(url: string, data?: unknown, key = '', asText = false) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password)
    throw new Error('请输入有效的 HTTP(S) 接口地址');
  const headers = {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  };
  if (nativeMobile) {
    const r = await CapacitorHttp.request({
      url,
      method: data ? 'POST' : 'GET',
      headers,
      data,
      readTimeout: 60000,
      connectTimeout: 15000,
      disableRedirects: true,
      responseType: asText ? 'text' : 'json',
    });
    if (r.status < 200 || r.status >= 300) throw new Error(`远程服务返回 HTTP ${r.status}`);
    return r.data;
  }
  const r = await fetch(url, {
    method: data ? 'POST' : 'GET',
    headers,
    body: data ? JSON.stringify(data) : undefined,
    redirect: 'error',
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok) throw new Error(`远程服务返回 HTTP ${r.status}`);
  return asText ? r.text() : r.json();
}
export async function saveExport(content: string) {
  if (nativeMobile) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const result = await Filesystem.writeFile({
      path: `sequence-backup-${Date.now()}.json`,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: '序列面试档案', url: result.uri, dialogTitle: '保存或发送档案' });
  } else {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sequence-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
