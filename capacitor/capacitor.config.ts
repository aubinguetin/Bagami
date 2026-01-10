import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bagami.app',
  appName: 'bagami',
  server: {
    url: "https://bagami-zclb.onrender.com",
    cleartext: true,
    androidScheme: "https",
    iosScheme: "http",
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
      providers: ["google.com", "facebook.com"],
    },
  },
};

export default config;
