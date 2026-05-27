import { RETAIL_COPY } from "../src/constants/retail";
import { test, expect } from "./fixtures";
import { dismissAgeGate, PageAudit } from "./helpers/audit";

test.describe("Mystery Drops pack opening audit", () => {
  test("opens a pack, loads drop table, and completes demo unlock flow", async ({
    page,
    audit,
  }) => {
    await page.goto("/");
    await dismissAgeGate(page);
    audit.clear();

    await page.getByRole("button", { name: /Mystery Drops/i }).click();
    await expect(page).toHaveURL(/\/$/);

    const packCard = page.locator('main article[role="button"]').first();
    await expect(packCard).toBeVisible();
    await packCard.click();

    await expect(page.getByRole("heading", { name: /^Drop Table$/i })).toBeVisible({
      timeout: 15_000,
    });

    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/drop table loading/i);

    const dropTableSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /^Drop Table$/i }),
    });
    await expect(dropTableSection.getByText(/items · full pool odds/i)).toBeVisible();

    const emptyState = dropTableSection.getByText(/No drop table items found/i);
    if (await emptyState.isVisible().catch(() => false)) {
      throw new Error(
        "Drop table rendered empty — pack pool failed to resolve (check boxCatalog static fallback).",
      );
    }

    const unlockButton = page
      .locator(".spin-reel-frame")
      .getByRole("button", { name: new RegExp(`^Demo Spin|${RETAIL_COPY.purchaseVerb}$`, "i") });
    await expect(unlockButton).toBeEnabled();
    const revealModal = page.getByRole("dialog").filter({
      hasText: /Drop Unlocked|secured in your vault|EXCHANGE FOR|REQUEST PHYSICAL/i,
    });
    const transactionFailure = page.getByRole("dialog", {
      name: /Transaction Failed - Credits Refunded/i,
    });

    await unlockButton.click();

    await Promise.race([
      page
        .locator(".spin-reel-frame")
        .getByRole("button", { name: /Ripping Pack/i })
        .waitFor({ state: "visible", timeout: 4_000 }),
      revealModal.waitFor({ state: "visible", timeout: 12_000 }),
      transactionFailure.waitFor({ state: "visible", timeout: 12_000 }),
    ]).catch(() => undefined);

    await expect(revealModal.or(transactionFailure)).toBeVisible({ timeout: 12_000 });

    const stuckLoading = await page
      .locator("body")
      .innerText()
      .then((text) => /drop table loading/i.test(text));
    expect(stuckLoading).toBe(false);

    if (await transactionFailure.isVisible().catch(() => false)) {
      throw new Error("Unlock Drop failed — transaction failure modal appeared.");
    }

    await expect(revealModal).toBeVisible();
    audit.assertClean("Mystery Drops unlock flow");
  });
});
