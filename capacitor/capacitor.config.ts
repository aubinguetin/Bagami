import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bagami.app',
  appName: 'bagami',
  server: {
    url: "https://67f0fc171f9d.ngrok-free.app",
    cleartext: true,
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: [
      "localhost",
      "127.0.0.1",
      "*",
    ],
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  },
};

export default config;
