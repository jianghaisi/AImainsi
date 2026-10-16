import {
  existsSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = process.cwd(),
  env = { ...process.env };
const portableJava = path.join(root, '.tools/java21');
if (existsSync(portableJava))
  env.JAVA_HOME = path.join(
    portableJava,
    readdirSync(portableJava).find((x) => x.startsWith('jdk')),
  );
if (!env.ANDROID_HOME && existsSync(path.join(root, '.tools/android-sdk')))
  env.ANDROID_HOME = path.join(root, '.tools/android-sdk');
if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT)
  throw new Error('Install Android SDK and set ANDROID_HOME. See README.');
const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
// A non-virtualized temporary path avoids Windows MSIX Unix-domain socket errors.
if (process.platform === 'win32') {
  const jvmTmp = path.join(root, '.tools/java-tmp');
  mkdirSync(jvmTmp, { recursive: true });
  env.JAVA_TOOL_OPTIONS =
    (env.JAVA_TOOL_OPTIONS || '') +
    ` -Djdk.net.unixdomain.tmpdir="${jvmTmp}" -Djava.io.tmpdir="${jvmTmp}"`;
}
writeFileSync('android/local.properties', 'sdk.dir=' + sdk.replaceAll('\\', '/') + '\n');
const child = spawn(
  process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
  ['assembleDebug', '--no-daemon'],
  { cwd: path.join(root, 'android'), env, stdio: 'inherit', shell: process.platform === 'win32' },
);
child.on('exit', (code) => {
  if (code) {
    process.exitCode = code;
    return;
  }
  mkdirSync('release', { recursive: true });
  const output = 'release/Sequence-0.1.0-Android-preview.apk';
  copyFileSync('android/app/build/outputs/apk/debug/app-debug.apk', output);
  const digest = createHash('sha256').update(readFileSync(output)).digest('hex');
  writeFileSync(output + '.sha256', digest + '  ' + path.basename(output) + '\n');
  console.log('APK: ' + path.resolve(output));
});
