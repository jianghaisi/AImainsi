import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'org.aimainsi.sequence',
  appName: '序列面试',
  webDir: 'dist',
  android: { allowMixedContent: false },
  server: { androidScheme: 'https' },
  plugins: { CapacitorHttp: { enabled: false } },
};
export default config;
