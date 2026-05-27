import type { Locator, Page } from "@playwright/test";

export interface AuditFailure {
  kind: "console" | "pageerror" | "http404" | "stuck-loading" | "navigation";
  message: string;
  elementPath?: string;
  url?: string;
}

const IGNORED_CONSOLE_PATTERNS = [
  /favicon/i,
  /Failed to load resource.*404/i,
  /net::ERR_/i,
];

const IGNORED_404_URL_PATTERNS = [
  /pokemontcg\.io/i,
  /images\.pokemontcg\.io/i,
  /google-analytics/i,
  /googletagmanager/i,
];

const STUCK_LOADING_PATTERNS = [
  /drop table loading/i,
  /loading play history/i,
  /drop table loading for this pack/i,
];

export class PageAudit {
  readonly failures: AuditFailure[] = [];
  private readonly seenConsole = new Set<string>();

  constructor(private readonly page: Page) {
    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return;
      if (this.seenConsole.has(text)) return;
      this.seenConsole.add(text);
      this.failures.push({ kind: "console", message: text, url: page.url() });
    });

    page.on("pageerror", (error) => {
      this.failures.push({
        kind: "pageerror",
        message: error.message,
        url: page.url(),
      });
    });

    page.on("response", (response) => {
      if (response.status() !== 404) return;
      const url = response.url();
      if (IGNORED_404_URL_PATTERNS.some((pattern) => pattern.test(url))) return;

      let pageOrigin = "";
      try {
        pageOrigin = new URL(page.url()).origin;
      } catch {
        return;
      }

      let responseOrigin = "";
      try {
        responseOrigin = new URL(url).origin;
      } catch {
        return;
      }

      if (responseOrigin !== pageOrigin) return;

      const resourceType = response.request().resourceType();
      if (!["document", "fetch", "xhr"].includes(resourceType)) return;

      this.failures.push({
        kind: "http404",
        message: `HTTP 404: ${url}`,
        url: page.url(),
      });
    });
  }

  clear(): void {
    this.failures.length = 0;
    this.seenConsole.clear();
  }

  assertClean(context: string): void {
    if (this.failures.length === 0) return;
    const summary = this.failures
      .map((failure, index) => {
        const path = failure.elementPath ? `\n   element: ${failure.elementPath}` : "";
        return `${index + 1}. [${failure.kind}] ${failure.message}${path}\n   context: ${context}\n   url: ${failure.url ?? "n/a"}`;
      })
      .join("\n");
    throw new Error(`Audit failures detected:\n${summary}`);
  }
}

export async function elementPath(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    const parts: string[] = [];
    let node: Element | null = el;

    while (node && node !== document.body) {
      const tag = node.tagName.toLowerCase();
      const id = node.id ? `#${node.id}` : "";
      const testId = node.getAttribute("data-testid");
      const aria = node.getAttribute("aria-label");
      const role = node.getAttribute("role");
      const name =
        aria ??
        (node instanceof HTMLInputElement || node instanceof HTMLButtonElement
          ? node.getAttribute("name")
          : null);
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40);

      let descriptor = tag;
      if (id) descriptor += id;
      if (testId) descriptor += `[data-testid="${testId}"]`;
      if (role) descriptor += `[role="${role}"]`;
      if (name) descriptor += `[label="${name}"]`;
      if (text) descriptor += `: "${text}"`;

      parts.unshift(descriptor);
      node = node.parentElement;
    }

    return parts.join(" > ");
  });
}

export async function dismissAgeGate(page: Page): Promise<void> {
  const confirm = page.getByRole("button", { name: /I am 18 or older/i });
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  }
}

export async function expandDesktopSidebar(page: Page): Promise<void> {
  const expand = page.getByRole("button", { name: /Expand navigation/i });
  if (await expand.isVisible().catch(() => false)) {
    await expand.click();
  }
}

export async function closeOverlays(page: Page): Promise<void> {
  const closeButtons = page.getByRole("dialog").getByRole("button", { name: /^Close$/i });
  const count = await closeButtons.count();
  for (let index = 0; index < count; index += 1) {
    const button = closeButtons.nth(index);
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      await page.waitForTimeout(150);
    }
  }

  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
}

export async function waitForStuckLoading(
  page: Page,
  audit: PageAudit,
  elementPathHint: string,
  timeoutMs = 8_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const bodyText = await page.locator("body").innerText();
    const stuck = STUCK_LOADING_PATTERNS.find((pattern) => pattern.test(bodyText));
    if (!stuck) return;
    await page.waitForTimeout(300);
  }

  audit.failures.push({
    kind: "stuck-loading",
    message: `Loading state did not resolve within ${timeoutMs}ms`,
    elementPath: elementPathHint,
    url: page.url(),
  });
}

export async function clickWithAudit(
  page: Page,
  audit: PageAudit,
  locator: Locator,
  options?: { expectPath?: RegExp; expectDialog?: boolean },
): Promise<void> {
  const path = await elementPath(locator);
  const beforeUrl = page.url();
  const consoleBefore = audit.failures.length;

  await locator.click({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await waitForStuckLoading(page, audit, path);

  if (options?.expectPath && !options.expectPath.test(page.url())) {
    audit.failures.push({
      kind: "navigation",
      message: `Expected URL to match ${options.expectPath}, got ${page.url()} (was ${beforeUrl})`,
      elementPath: path,
      url: page.url(),
    });
  }

  if (options?.expectDialog) {
    const dialog = page.getByRole("dialog");
    if (!(await dialog.isVisible().catch(() => false))) {
      audit.failures.push({
        kind: "navigation",
        message: "Expected a dialog to open after click",
        elementPath: path,
        url: page.url(),
      });
    } else {
      await closeOverlays(page);
    }
  }

  const newConsoleErrors = audit.failures.slice(consoleBefore);
  for (const failure of newConsoleErrors) {
    failure.elementPath = failure.elementPath ?? path;
  }
}

export type NavZone = "sidebar" | "header" | "footer" | "mobile";

export const NAV_ZONE_SELECTORS: Record<NavZone, string> = {
  sidebar: "aside",
  header: "header",
  footer: "footer",
  mobile: "nav.fixed.bottom-0",
};

export async function collectZoneInteractables(
  page: Page,
  zone: NavZone,
): Promise<Locator[]> {
  const root = page.locator(NAV_ZONE_SELECTORS[zone]);
  if (!(await root.count())) return [];

  const candidates = root.locator(
    'a[href]:not([target="_blank"]), button:not([disabled])',
  );
  const count = await candidates.count();
  const results: Locator[] = [];

  for (let index = 0; index < count; index += 1) {
    const item = candidates.nth(index);
    if (!(await item.isVisible().catch(() => false))) continue;
    results.push(item);
  }

  return results;
}

export function interactableKey(zone: NavZone, path: string): string {
  return `${zone}::${path}`;
}
