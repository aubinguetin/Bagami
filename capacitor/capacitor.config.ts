import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bagami.app',
  appName: 'bagami',
   server: {
    url:"https://ccca3e83a727.ngrok-free.app",
    cleartext: true,
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: [
      "localhost",
      "127.0.0.1",
      "*",
    ],
  },
 
};

export default config;
