import { test as base } from "@playwright/test";
import { AGE_VERIFIED_STORAGE_KEY } from "../src/constants/ageGate";
import { dismissAgeGate, PageAudit } from "./helpers/audit";

type AuditFixtures = {
  audit: PageAudit;
};

export const test = base.extend<AuditFixtures>({
  audit: async ({ page }, use) => {
    const audit = new PageAudit(page);
    await use(audit);
  },
  page: async ({ page }, use) => {
    await page.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, "true");
    }, AGE_VERIFIED_STORAGE_KEY);

    await page.goto("/");
    await dismissAgeGate(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
