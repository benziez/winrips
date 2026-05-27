import { pathForView } from "../src/constants/appRoutes";
import { FOOTER_NAV_COLUMNS } from "../src/constants/footerContent";
import { PRIMARY_NAV } from "../src/data/navigation";
import type { AppView } from "../src/types";
import { test, expect } from "./fixtures";
import {
  clickWithAudit,
  collectZoneInteractables,
  dismissAgeGate,
  elementPath,
  expandDesktopSidebar,
  interactableKey,
  closeOverlays,
  PageAudit,
} from "./helpers/audit";
import type { Page } from "@playwright/test";

async function gotoHome(page: Page, audit: PageAudit): Promise<void> {
  await page.goto("/");
  await dismissAgeGate(page);
  audit.clear();
}

async function auditPrimaryNavigation(page: Page, audit: PageAudit): Promise<void> {
  await gotoHome(page, audit);
  await expandDesktopSidebar(page);

  for (const item of PRIMARY_NAV) {
    if (item.kind === "locked" || !item.view) continue;

    if (item.kind === "group" && item.children) {
      const groupButton = page.getByRole("button", { name: item.label, exact: true });
      await clickWithAudit(page, audit, groupButton);

      for (const child of item.children) {
        const childButton = page.getByRole("button", { name: child.label, exact: true });
        const expectedPath = pathForView(child.view);
        await clickWithAudit(page, audit, childButton, {
          expectPath: new RegExp(`^https?://[^/]+${escapeRegex(expectedPath)}(?:/)?$`),
        });
        audit.assertClean(`Fairness nav → ${child.label}`);
        await gotoHome(page, audit);
        await expandDesktopSidebar(page);
        await clickWithAudit(page, audit, groupButton);
      }
      continue;
    }

    const navButton = page.getByRole("button", { name: item.label });
    const expectedPath = pathForView(item.view);
    await clickWithAudit(page, audit, navButton, {
      expectPath: new RegExp(`^https?://[^/]+${escapeRegex(expectedPath)}(?:/)?$`),
    });
    audit.assertClean(`Sidebar nav → ${item.label}`);
    await gotoHome(page, audit);
    await expandDesktopSidebar(page);
  }
}

async function auditMobileNavigation(page: Page, audit: PageAudit): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoHome(page, audit);

  const mobileItems: { label: RegExp; view: AppView }[] = [
    { label: /^Drops$/i, view: "lobby" },
    { label: /^Vault$/i, view: "vault" },
    { label: /^Ranks$/i, view: "leaderboard" },
    { label: /^Rewards$/i, view: "rewards" },
  ];

  for (const item of mobileItems) {
    const button = page.locator("nav.fixed.bottom-0").getByRole("button", { name: item.label });
    const expectedPath = pathForView(item.view);
    await clickWithAudit(page, audit, button, {
      expectPath: new RegExp(`^https?://[^/]+${escapeRegex(expectedPath)}(?:/)?$`),
    });
    audit.assertClean(`Mobile nav → ${item.label}`);
  }

  await page.setViewportSize({ width: 1280, height: 720 });
}

async function auditFooterLinks(page: Page, audit: PageAudit): Promise<void> {
  await gotoHome(page, audit);

  for (const column of FOOTER_NAV_COLUMNS) {
    for (const link of column.links) {
      const footerLink = page.locator("footer").getByRole("link", { name: link.label, exact: true });
      await clickWithAudit(page, audit, footerLink, {
        expectPath: new RegExp(`/info/${link.slug}`),
      });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      audit.assertClean(`Footer link → ${link.label}`);
      await gotoHome(page, audit);
    }
  }
}

async function auditHeaderAuthModals(page: Page, audit: PageAudit): Promise<void> {
  await gotoHome(page, audit);

  const login = page.getByRole("button", { name: /^Login$/i });
  if (await login.isVisible().catch(() => false)) {
    await clickWithAudit(page, audit, login, { expectDialog: true });
    audit.assertClean("Header → Login modal");
    await closeOverlays(page);
  }

  const register = page.getByRole("button", { name: /^Register$/i });
  if (await register.isVisible().catch(() => false)) {
    await clickWithAudit(page, audit, register, { expectDialog: true });
    audit.assertClean("Header → Register modal");
    await closeOverlays(page);
  }
}

async function auditNavZonesRecursively(page: Page, audit: PageAudit): Promise<void> {
  await gotoHome(page, audit);
  await expandDesktopSidebar(page);

  const visited = new Set<string>();
  const zones: Array<"sidebar" | "header" | "footer"> = ["sidebar", "header", "footer"];
  const maxClicks = 24;
  let clicks = 0;

  for (const zone of zones) {
    const interactables = await collectZoneInteractables(page, zone);

    for (const locator of interactables) {
      if (clicks >= maxClicks) break;

      const path = await elementPath(locator);
      const key = interactableKey(zone, path);
      if (visited.has(key)) continue;
      visited.add(key);

      const href = await locator.getAttribute("href");
      if (href?.startsWith("http") && !href.includes("localhost")) {
        continue;
      }

      const label = ((await locator.innerText().catch(() => "")) || "").trim();
      if (/^(login|register)$/i.test(label) && zone === "header") {
        continue;
      }

      try {
        await clickWithAudit(page, audit, locator);
        audit.assertClean(`Recursive ${zone} → ${path}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        audit.failures.push({
          kind: "navigation",
          message,
          elementPath: path,
          url: page.url(),
        });
      }

      clicks += 1;
      await closeOverlays(page);
      await gotoHome(page, audit);
      await expandDesktopSidebar(page);
    }
  }

  audit.assertClean("Recursive nav-zone crawl");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("WinRips navigation audit", () => {
  test("primary sidebar routes resolve without console or 404 errors", async ({ page, audit }) => {
    await auditPrimaryNavigation(page, audit);
  });

  test("mobile bottom navigation routes resolve cleanly", async ({ page, audit }) => {
    await auditMobileNavigation(page, audit);
  });

  test("footer info links open content pages", async ({ page, audit }) => {
    await auditFooterLinks(page, audit);
  });

  test("header auth buttons open modals", async ({ page, audit }) => {
    await auditHeaderAuthModals(page, audit);
  });

  test("recursive nav-zone interactables do not hang or throw", async ({ page, audit }) => {
    await auditNavZonesRecursively(page, audit);
  });
});
