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
  },
};

export default config;
