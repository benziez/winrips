import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.winrips.app",
  appName: "WinRips",
  webDir: "dist",
  server: {
    url: "https://winrips.com",
    cleartext: false,
  },
  plugins: {
    Keyboard: {
      resize: "none",
      style: "dark",
    },
  },
};

export default config;
