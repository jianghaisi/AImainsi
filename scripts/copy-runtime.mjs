import { cpSync, mkdirSync } from 'node:fs';
mkdirSync('public/pyodide', { recursive: true });
for (const file of [
  'pyodide.mjs',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
]) {
  cpSync(`node_modules/pyodide/${file}`, `public/pyodide/${file}`);
}
cpSync('node_modules/pdfjs-dist/build/pdf.worker.mjs', 'public/pdf.worker.mjs');
mkdirSync('public/licenses', { recursive: true });
cpSync('node_modules/pdfjs-dist/LICENSE', 'public/licenses/PDFjs-Apache-2.0.txt');
