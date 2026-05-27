/**
 * Capacitor `sync ios` only lists npm plugin classes in packageClassList.
 * Re-append the app-local AppleSignInPlugin after every sync.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const configPath = resolve("ios/App/App/capacitor.config.json");
const LOCAL_PLUGIN = "AppleSignInPlugin";

const json = JSON.parse(readFileSync(configPath, "utf8"));
const list = new Set(json.packageClassList ?? []);
list.add(LOCAL_PLUGIN);
json.packageClassList = [...list].sort((a, b) => a.localeCompare(b));
writeFileSync(configPath, `${JSON.stringify(json, null, "\t")}\n`);
console.log(`[ensureAppleSignInPlugin] packageClassList includes ${LOCAL_PLUGIN}`);
