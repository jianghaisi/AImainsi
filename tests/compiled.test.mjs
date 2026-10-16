import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { questions } from '../server/seed.mjs';
const canJava = spawnSync('javac', ['-version']).status === 0,
  canCpp = spawnSync('g++', ['--version']).status === 0;
const approx = (a, b) =>
  typeof a === 'number' && typeof b === 'number'
    ? Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(b))
    : Array.isArray(a) && Array.isArray(b)
      ? a.length === b.length && a.every((x, i) => approx(x, b[i]))
      : JSON.stringify(a) === JSON.stringify(b);
const javaValue = (value, type) =>
  Array.isArray(value)
    ? `new ${type}{${value.map((v) => javaValue(v, type.slice(0, -2))).join(',')}}`
    : JSON.stringify(value);
const cppValue = (value) =>
  Array.isArray(value) ? `{${value.map(cppValue).join(',')}}` : JSON.stringify(value);
for (const q of questions.filter((q) => q.kind === 'coding')) {
  test(`Java reference: ${q.id}`, { skip: !canJava }, () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'aimainsi-java-'));
    const types = q.solutions.java
      .match(/solve\(([^)]*)\)/)[1]
      .split(',')
      .map((arg) => arg.trim().split(' ')[0]);
    const calls = q.tests
      .map(
        (t) =>
          `emit(new Solution().solve(${t.input.map((x, i) => javaValue(x, types[i])).join(',')}));System.out.println();`,
      )
      .join('\n');
    const harness = `\nclass TestMain {static void emit(Object x) {if(x!=null&&x.getClass().isArray()){System.out.print("[");for(int i=0;i<java.lang.reflect.Array.getLength(x);i++){if(i>0)System.out.print(",");emit(java.lang.reflect.Array.get(x,i));}System.out.print("]");}else System.out.print(x);}public static void main(String[] args){${calls}}}`;
    writeFileSync(path.join(dir, 'Solution.java'), q.solutions.java + harness);
    const build = spawnSync('javac', ['-encoding', 'UTF-8', path.join(dir, 'Solution.java')], {
      encoding: 'utf8',
      timeout: 20000,
    });
    assert.equal(build.status, 0, build.stderr);
    const run = spawnSync('java', ['-cp', dir, 'TestMain'], { encoding: 'utf8', timeout: 10000 });
    assert.equal(run.status, 0, run.stderr);
    const values = run.stdout.trim().split(/\r?\n/).map(JSON.parse);
    q.tests.forEach((t, i) => assert.ok(approx(values[i], t.expected), q.id + ' case ' + i));
  });
  test(`C++ reference: ${q.id}`, { skip: !canCpp }, () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'aimainsi-cpp-'));
    const cpp = path.join(dir, 'solution.cpp'),
      exe = path.join(dir, process.platform === 'win32' ? 'solution.exe' : 'solution');
    const calls = q.tests
      .map((t) => `emit(solve(${t.input.map(cppValue).join(',')}));cout<<'\\n';`)
      .join('\n');
    const harness = `\ntemplate<class T> void emit(const T &v){cout<<v;}\ntemplate<class T> void emit(const vector<T>& v){cout<<'[';for(size_t i=0;i<v.size();i++){if(i)cout<<',';emit(v[i]);}cout<<']';}\nint main(){cout<<boolalpha<<setprecision(15);${calls}}`;
    writeFileSync(cpp, q.solutions.cpp + harness);
    const build = spawnSync('g++', ['-std=c++17', cpp, '-o', exe], {
      encoding: 'utf8',
      timeout: 30000,
    });
    assert.equal(build.status, 0, build.stderr);
    const run = spawnSync(exe, [], { encoding: 'utf8', timeout: 10000 });
    assert.equal(run.status, 0, run.stderr);
    const values = run.stdout.trim().split(/\r?\n/).map(JSON.parse);
    q.tests.forEach((t, i) => assert.ok(approx(values[i], t.expected), q.id + ' case ' + i));
  });
}
