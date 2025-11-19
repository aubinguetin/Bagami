import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bagami.app',
  appName: 'bagami',
   server: {
    url:"https://b6bdd2d08b7a.ngrok-free.app/",
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
