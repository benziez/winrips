#!/usr/bin/env node
/**
 * Exposes localhost (Vite dev + API on port 4444) for NOWPayments IPN.
 *
 * Default: ngrok (recommended — no localtunnel reminder page on server POSTs).
 *
 *   npm run dev:tunnel           # ngrok → localhost:4444
 *   npm run dev:tunnel:lt        # localtunnel (NOT compatible with NOWPayments IPN)
 *
 * Install ngrok once (macOS):
 *   brew install ngrok/ngrok/ngrok
 *   ngrok config add-authtoken <token from dashboard.ngrok.com>
 *
 * Add printed URL to .env, restart `npm run dev`:
 *   NOWPAYMENTS_TUNNEL_URL=https://xxxx.ngrok-free.app
 */
import { spawn, execSync } from "node:child_process";
import { createInterface } from "node:readline";

const port = Number(process.env.PORT ?? process.env.VITE_PORT ?? 4444);
const mode = (process.argv[2] ?? "ngrok").toLowerCase();
const webhookPath = "/api/payments/webhook";

function printEnvHint(publicOrigin) {
  const base = publicOrigin.replace(/\/$/, "");
  const webhookUrl = `${base}${webhookPath}`;

  console.log("\n--- NOWPayments local webhook (use ngrok for IPN) ---\n");
  console.log(`Public origin:  ${base}`);
  console.log(`Webhook route:  POST ${webhookPath}`);
  console.log(`Full IPN URL:   ${webhookUrl}\n`);
  console.log("Add to .env (then restart npm run dev):\n");
  console.log(`NOWPAYMENTS_TUNNEL_URL=${base}`);
  console.log(`# or: NOWPAYMENTS_IPN_CALLBACK_URL=${webhookUrl}\n`);
  console.log(
    "NOWPayments dashboard → Payment Settings → IPN callback URL (optional if ipn_callback_url is set per payment).",
  );
  console.log(`Keep npm run dev listening on http://localhost:${port}\n`);
}

function ngrokInstalled() {
  try {
    execSync("which ngrok", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function printNgrokInstallHelp() {
  console.error("\nngrok CLI not found. NOWPayments IPN needs ngrok (not localtunnel).\n");
  console.error("macOS (Homebrew):");
  console.error("  brew install ngrok/ngrok/ngrok");
  console.error("  ngrok config add-authtoken <your-token>");
  console.error("\nThen run: npm run dev:tunnel\n");
  console.error("Docs: https://ngrok.com/download\n");
}

async function fetchNgrokHttpsUrl(maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:4040/api/tunnels");
      if (!response.ok) {
        await sleep(500);
        continue;
      }
      const data = await response.json();
      const tunnels = Array.isArray(data.tunnels) ? data.tunnels : [];
      const httpsTunnel =
        tunnels.find((t) => t.public_url?.startsWith("https://")) ??
        tunnels.find((t) => t.proto === "https");
      if (httpsTunnel?.public_url) {
        return httpsTunnel.public_url;
      }
    } catch {
      // ngrok API not ready yet
    }
    await sleep(500);
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runNgrok() {
  if (!ngrokInstalled()) {
    printNgrokInstallHelp();
    process.exit(1);
  }

  console.log(`Starting ngrok → http://localhost:${port} …\n`);

  const child = spawn("ngrok", ["http", String(port), "--log=stdout"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let printed = false;

  const printOnce = (url) => {
    if (printed || !url) return;
    printed = true;
    printEnvHint(url);
  };

  void fetchNgrokHttpsUrl().then(printOnce);

  const tryPrintFromLine = (line) => {
    const match = line.match(/url=(https:\/\/[^\s]+)/);
    if (match) printOnce(match[1]);
  };

  const attach = (stream) => {
    const rl = createInterface({ input: stream });
    rl.on("line", tryPrintFromLine);
  };

  attach(child.stdout);
  attach(child.stderr);

  child.on("error", (err) => {
    console.error(err.message);
    process.exit(1);
  });

  child.on("exit", (code) => process.exit(code ?? 0));

  process.on("SIGINT", () => child.kill("SIGINT"));
}

async function runLocaltunnel() {
  console.warn(
    "\n⚠️  localtunnel is NOT suitable for NOWPayments IPN.\n" +
      "    NOWPayments cannot send Bypass-Tunnel-Reminder, so webhooks hit the HTML reminder page.\n" +
      "    Use ngrok instead: npm run dev:tunnel\n",
  );

  let lt;
  try {
    lt = await import("localtunnel");
  } catch {
    console.error("localtunnel is not installed. Run: npm install\n");
    process.exit(1);
  }

  const tunnel = await lt.default({ port });
  printEnvHint(tunnel.url);

  tunnel.on("close", () => {
    console.log("\nTunnel closed.");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    tunnel.close();
  });
}

if (mode === "lt" || mode === "localtunnel") {
  await runLocaltunnel();
} else {
  await runNgrok();
}
