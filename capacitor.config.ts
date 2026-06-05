import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.winrips.app",
  appName: "WinRips",
  webDir: "dist",
  plugins: {
    Keyboard: {
      resize: "none",
      style: "dark",
    },
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      splashFullScreen: false,
      splashImmersive: false,
      androidScaleType: "CENTER_INSIDE",
    },
  },
};

export default config;
