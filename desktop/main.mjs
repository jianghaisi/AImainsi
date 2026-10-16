import { app, BrowserWindow, shell, safeStorage, session, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let server, window;
async function boot() {
  process.env.DATA_DIR = process.env.DATA_DIR || path.join(app.getPath('userData'), 'data');
  globalThis.sequenceSecrets = {
    encrypt: (value) => {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('系统密钥服务不可用');
      return 'enc:' + safeStorage.encryptString(value).toString('base64');
    },
    decrypt: (value) => safeStorage.decryptString(Buffer.from(value.slice(4), 'base64')),
  };
  try {
    const { app: api, startScheduler } = await import('../server/app.mjs');
    api.use(express.static(path.join(root, 'dist')));
    api.get('/{*path}', (_req, res) => res.sendFile(path.join(root, 'dist/index.html')));
    server = api.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    startScheduler();
    const origin = `http://127.0.0.1:${server.address().port}`;
    window = new BrowserWindow({
      width: 1440,
      height: 980,
      minWidth: 760,
      minHeight: 650,
      title: '序列 · AI 面试',
      backgroundColor: '#1c1f20',
      icon: path.join(root, 'public/icon.png'),
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//.test(url)) void shell.openExternal(url);
      return { action: 'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith(origin + '/')) {
        event.preventDefault();
        if (/^https?:\/\//.test(url)) void shell.openExternal(url);
      }
    });
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) =>
      callback(false),
    );
    window.once('ready-to-show', () => window.show());
    await window.loadURL(origin);
  } catch (error) {
    console.error(error);
    if (!process.env.SEQUENCE_SMOKE) dialog.showErrorBox('序列启动失败', error.message);
    app.quit();
  }
}
app.whenReady().then(boot);
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => server?.close());
