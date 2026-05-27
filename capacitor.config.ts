import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.winrips.app",
  appName: "WinRips",
  webDir: "dist",
  server: {
    url: "http://192.168.1.165:4444",
    cleartext: true,
  },
};

export default config;
