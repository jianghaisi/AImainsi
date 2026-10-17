import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
mkdirSync('public/sqlite', { recursive: true });
for (const file of ['sql-wasm.js', 'sql-wasm.wasm'])
  cpSync(`node_modules/sql.js/dist/${file}`, `public/sqlite/${file}`);
writeFileSync(
  'public/sqlite/sql-wasm.mjs',
  'var module;\n' +
    readFileSync('node_modules/sql.js/dist/sql-wasm.js', 'utf8') +
    '\nexport default initSqlJs;\n',
);
cpSync('node_modules/sql.js/LICENSE', 'public/licenses/SQLjs-MIT.txt');
for (const [name, file] of [
  ['katex', 'LICENSE'],
  ['react-markdown', 'license'],
])
  cpSync(`node_modules/${name}/${file}`, `public/licenses/${name}-MIT.txt`);
