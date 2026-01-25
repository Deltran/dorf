import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dorf.game',
  appName: 'Dorf',
  webDir: 'dist',
  android: {
    backgroundColor: '#111827'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#111827',
      showSpinner: false
    }
  }
};

export default config;
