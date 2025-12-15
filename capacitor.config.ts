import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1184bd1578b24c5fa0b50de93f3227f2',
  appName: 'NeuroQuiz - Sistema de Estudos',
  webDir: 'dist',
  server: {
    url: 'https://1184bd15-78b2-4c5f-a0b5-0de93f3227f2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b82f6',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#3b82f6'
    }
  }
};

export default config;