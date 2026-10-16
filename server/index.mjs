import path from 'node:path';
import express from 'express';
import { app, startScheduler } from './app.mjs';
const production = process.argv.includes('--production');
if (production) {
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true, hmr: { port: Number(process.env.PORT || 4178) + 100 } },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}
startScheduler();
const port = Number(process.env.PORT || 4178);
app
  .listen(port, '127.0.0.1', () => console.log(`序列 · AI 面试作战终端  http://127.0.0.1:${port}`))
  .on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
