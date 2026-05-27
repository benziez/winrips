import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { paymentsDevPlugin } from "./server/payments-dev-plugin";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");

  return {
  root,
  plugins: [react(), tailwindcss(), paymentsDevPlugin(env)],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.join(root, "src"),
      react: path.join(root, "node_modules/react"),
      "react-dom": path.join(root, "node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  server: {
    host: "0.0.0.0",
    port: 4444,
    open: false,
    fs: {
      strict: true,
      allow: [root],
    },
  },
};
});
