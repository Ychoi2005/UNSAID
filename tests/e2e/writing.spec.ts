import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { VaultData } from "../../src/types/vault";
const pass = "fictional testing passphrase";
async function createVault(page: Page) {
  await page.goto("/");
  await page.getByLabel("Choose a passphrase", { exact: true }).fill(pass);
  await page.getByLabel("Repeat passphrase", { exact: true }).fill(pass);
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  await page
    .getByRole("button", { name: "Create your vault", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Begin writing" }),
  ).toBeVisible();
}
async function unlock(page: Page, phrase = pass) {
  await page.getByLabel("Passphrase", { exact: true }).fill(phrase);
  await page.getByRole("button", { name: "Unlock your space" }).click();
}
async function visit(page: Page, path: string) {
  await page.goto(path);
  await expect(
    page.getByRole("button", { name: "Unlock your space" }),
  ).toBeVisible();
  await unlock(page);
}
async function thought(
  page: Page,
  title: string,
  body = "Fictional sample writing.",
) {
  await visit(page, "/");
  await page.getByRole("button", { name: "Begin writing" }).click();
  await page.getByRole("textbox", { name: "Optional title" }).fill(title);
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .fill(body);
  await page
    .getByRole("button", { name: "Keep this thought", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kept, just for you.");
}
async function vaultData(page: Page): Promise<VaultData> {
  return page.evaluate(async (phrase) => {
    const storagePath = "/src/lib/storage/vault.ts";
    const cryptoPath = "/src/lib/crypto/vault.ts";
    const storage = await import(storagePath);
    const cryptography = await import(cryptoPath);
    const envelope = await storage.readVault();
    return (await cryptography.openEnvelope(envelope, phrase)).data;
  }, pass);
}
test("encrypted drafts, refresh lock, wrong passphrase, editing, search and deletion", async ({
  page,
}) => {
  const external: string[] = [];
  const methods: string[] = [];
  const transmissions: string[] = [];
  page.on("request", (r) => {
    methods.push(r.method());
    transmissions.push(r.url() + (r.postData() ?? ""));
    if (!r.url().startsWith("http://127.0.0.1:5173")) external.push(r.url());
  });
  await createVault(page);
  await page.getByRole("button", { name: "Begin writing" }).click();
  await page
    .getByRole("textbox", { name: "Optional title" })
    .fill("Fictional evening");
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .fill("A fictional private sample.");
  await page
    .getByRole("textbox", { name: "Optional tags" })
    .fill("sample, evening");
  await expect(page.getByRole("status")).toContainText(
    "Encrypted draft preserved",
  );
  const raw = await page.evaluate(async () => {
    const p = "/src/lib/storage/vault.ts";
    return JSON.stringify(await (await import(p)).readVault());
  });
  expect(raw).not.toContain("Fictional evening");
  expect(raw).not.toContain("A fictional private sample.");
  expect(raw).not.toContain(pass);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Your thought", exact: true }),
  ).toHaveCount(0);
  await unlock(page, "incorrect passphrase");
  await expect(page.getByRole("alert")).toContainText("Could not unlock");
  await unlock(page);
  await expect(
    page.getByRole("textbox", { name: "Your thought", exact: true }),
  ).toHaveValue("A fictional private sample.");
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .press("Control+s");
  await expect(page.getByRole("status")).toContainText("Kept, just for you.");
  await page.getByRole("link", { name: "The Archive", exact: true }).click();
  await page.getByRole("textbox", { name: "Search archive" }).fill("evening");
  await page.getByRole("button", { name: /Fictional evening/ }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .fill("An edited fictional sample.");
  await page
    .getByRole("button", { name: "Keep this thought", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Kept");
  await page.getByRole("link", { name: "Your collection" }).click();
  await page.getByRole("button", { name: /Fictional evening/ }).click();
  await expect(
    page.getByText("An edited fictional sample.", { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Let it go", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Let it go", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(
    page.getByRole("heading", { name: "Nothing you need to fill." }),
  ).toBeVisible();
  expect(external).toEqual([]);
  expect(methods.every((method) => method === "GET" || method === "HEAD")).toBe(
    true,
  );
  expect(transmissions.join("\n")).not.toContain("A fictional private sample.");
  expect(transmissions.join("\n")).not.toContain("Fictional evening");
});
test("letters are created, reopened, edited, searched and exported encrypted, never sent", async ({
  page,
}) => {
  await createVault(page);
  await page.getByRole("link", { name: "Letters Never Sent" }).click();
  await page.getByRole("button", { name: "Write a letter" }).click();
  await page
    .getByRole("button", { name: "To my younger self…", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Optional title" })
    .fill("A fictional letter");
  await page
    .getByRole("textbox", { name: "Your letter", exact: true })
    .fill("A fictional letter, never delivered.");
  await page.getByRole("button", { name: "Keep this letter" }).click();
  await expect(page.getByText("Sealed for you. Never sent.")).toBeVisible();
  expect(await page.getByRole("button", { name: /^send$/i }).count()).toBe(0);
  await page
    .getByRole("link", { name: "Letter collection", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Search letters" }).fill("fictional");
  await page.getByRole("button", { name: /A fictional letter/ }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export encrypted" }).click();
  const file = await download;
  const text = await readFile((await file.path())!, "utf8");
  expect(text).not.toContain("never delivered");
  expect(JSON.parse(text).format).toBe("unsaid-vault");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your letter", exact: true }),
  ).toHaveValue("A fictional letter, never delivered.");
  await page
    .getByRole("textbox", { name: "Your letter", exact: true })
    .fill("An edited fictional letter.");
  await page.getByRole("button", { name: "Keep this letter" }).click();
  await expect(page.getByRole("status").first()).toContainText("Kept");
});
test("constellation connects real entries, persists drag and themes, supports lists and cleans deletion", async ({
  page,
}) => {
  await createVault(page);
  await thought(page, "Fictional star one");
  await thought(page, "Fictional star two");
  await page.getByRole("link", { name: "Thought Constellation" }).click();
  await expect(
    page.locator(".star-title").filter({ hasText: "Fictional star one" }),
  ).toBeVisible();
  const before = await vaultData(page);
  const star = page.locator(".react-flow__node").first();
  const box = await star.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 80, box!.y + 28);
  await page.mouse.down();
  await page.mouse.move(box!.x + 145, box!.y + 65, { steps: 12 });
  await page.mouse.up();
  await expect
    .poll(async () => {
      const d = await vaultData(page);
      return d.nodes.some((n) => {
        const old = before.nodes.find((a) => a.id === n.id);
        return old && (old.x !== n.x || old.y !== n.y);
      });
    })
    .toBe(true);
  await page
    .getByText("Arrange your connections & themes", { exact: true })
    .click();
  await page
    .getByLabel("First star", { exact: true })
    .selectOption(before.nodes[0].id);
  await page
    .getByLabel("Second star", { exact: true })
    .selectOption(before.nodes[1].id);
  await page
    .getByLabel("Relationship (optional)")
    .fill("A fictional connection");
  await page
    .getByRole("button", { name: "Connect stars", exact: true })
    .click();
  await expect(page.locator(".connection-list")).toContainText(
    "A fictional connection",
  );
  await page.getByLabel("Star to arrange").selectOption(before.nodes[0].id);
  await page.getByLabel("Theme name").fill("Sample theme");
  await page.getByRole("button", { name: "Save theme", exact: true }).click();
  await expect
    .poll(async () => (await vaultData(page)).nodes[0].theme)
    .toBe("Sample theme");
  const layout = (await vaultData(page)).nodes.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
  }));
  await visit(page, "/constellation");
  expect(
    (await vaultData(page)).nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
  ).toEqual(layout);
  await page
    .getByText("Arrange your connections & themes", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove connection", exact: true })
    .click();
  await expect.poll(async () => (await vaultData(page)).edges.length).toBe(0);
  await page
    .getByLabel("First star", { exact: true })
    .selectOption(before.nodes[0].id);
  await page
    .getByLabel("Second star", { exact: true })
    .selectOption(before.nodes[1].id);
  await page
    .getByRole("button", { name: "Connect stars", exact: true })
    .click();
  await expect.poll(async () => (await vaultData(page)).edges.length).toBe(1);
  await page.getByRole("button", { name: "List view" }).click();
  await page.getByRole("button", { name: /Fictional star one/ }).click();
  await page.getByRole("button", { name: "Let it go", exact: true }).click();
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect.poll(async () => (await vaultData(page)).edges.length).toBe(0);
  expect((await vaultData(page)).nodes).toHaveLength(1);
});
test("reflection responses integrate with archive and timeline filters", async ({
  page,
}) => {
  await createVault(page);
  await thought(page, "Fictional reflection source");
  await page.getByRole("button", { name: "Reflect", exact: true }).click();
  await page.getByRole("button", { name: /A Gentler Perspective/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "What would you say to someone you care about in this situation?",
    }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Optional reflection response" })
    .fill("A fictional reflection response.");
  await page.getByRole("button", { name: "Keep reflection" }).click();
  await expect(page.getByRole("status")).toContainText("Reflection kept");
  await page.getByRole("button", { name: "Open the archive" }).click();
  await page
    .getByRole("combobox", { name: "Filter writing type" })
    .selectOption("reflection");
  await page
    .getByRole("button", { name: /Reflection on Fictional reflection source/ })
    .click();
  await expect(
    page.getByText("A fictional reflection response.", { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("link", { name: "Reflection Timeline" }).click();
  await expect(
    page.getByRole("combobox", { name: "Month and year" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Reflection on Fictional reflection source/,
    }),
  ).toBeVisible();
});
test("backups, passphrase changes, incorrect imports and clear-all work through settings", async ({
  page,
}) => {
  await createVault(page);
  await thought(page, "Fictional backup sample");
  await page.getByRole("link", { name: "Privacy & Settings" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export encrypted backup" }).click();
  const path = (await (await dl).path())!;
  await page.getByLabel("Current passphrase", { exact: true }).fill(pass);
  await page
    .getByLabel("New passphrase", { exact: true })
    .fill("another fictional passphrase");
  await page
    .getByLabel("Repeat new passphrase", { exact: true })
    .fill("another fictional passphrase");
  await page
    .getByRole("button", { name: "Change passphrase", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Passphrase changed");
  await page
    .getByLabel("Choose encrypted backup", { exact: true })
    .setInputFiles(path);
  await page.getByLabel("Backup passphrase", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Import & replace vault" }).click();
  await page
    .getByRole("button", { name: "Import & replace", exact: true })
    .click();
  await expect(page.getByRole("alert").last()).toContainText(
    "Could not unlock",
  );
  await page.getByLabel("Backup passphrase", { exact: true }).fill(pass);
  await page.getByRole("button", { name: "Import & replace vault" }).click();
  await page
    .getByRole("button", { name: "Import & replace", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Backup imported");
  await page.getByRole("button", { name: "Lock your space" }).click();
  await unlock(page, "another fictional passphrase");
  await expect(
    page.getByRole("heading", { name: "Privacy & Settings" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete all local writing" }).click();
  await page.getByRole("button", { name: "Delete everything" }).click();
  await expect(
    page.getByRole("button", { name: "Create your vault" }),
  ).toBeVisible();
});
test("explicit migration preserves legacy data until selected and encrypts thoughts and drafts", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const path = "/node_modules/.vite/deps/idb.js";
    const { openDB } = await import(path);
    const db = await openDB("unsaid-writing", 1, {
      upgrade(d: IDBDatabase) {
        d.createObjectStore("thoughts", { keyPath: "id" });
        d.createObjectStore("drafts");
      },
    });
    const now = new Date().toISOString();
    await db.put("thoughts", {
      id: "legacy-fiction",
      title: "Fictional earlier thought",
      body: "Fictional legacy writing",
      tags: [],
      createdAt: now,
      updatedAt: now,
    });
    await db.put(
      "drafts",
      {
        title: "Earlier draft",
        body: "A fictional earlier draft",
        tags: "sample",
        updatedAt: now,
      },
      "current",
    );
    db.close();
  });
  await page.reload();
  await expect(
    page.getByText("2 records from the earlier prototype found."),
  ).toBeVisible();
  await page.getByLabel("Choose a passphrase", { exact: true }).fill(pass);
  await page.getByLabel("Repeat passphrase", { exact: true }).fill(pass);
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  await page
    .getByRole("checkbox", { name: /Encrypt my earlier writing/ })
    .check();
  await page.getByRole("button", { name: "Create your vault" }).click();
  await expect(
    page.getByRole("button", { name: "Begin writing" }),
  ).toBeVisible();
  const data = await vaultData(page);
  expect(data.entries[0].body).toBe("Fictional legacy writing");
  expect(data.drafts[0].body).toBe("A fictional earlier draft");
  const remaining = await page.evaluate(async () => {
    const p = "/src/lib/storage/legacy.ts";
    return (await import(p)).readLegacy();
  });
  expect(remaining.thoughts).toHaveLength(0);
});
test("mobile navigation, keyboard dialog focus and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await createVault(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Letters Never Sent" }).click();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Write a letter" }).click();
  await page
    .getByRole("textbox", { name: "Your letter", exact: true })
    .fill("Fictional mobile letter.");
  await page.getByRole("button", { name: "Keep this letter" }).click();
  await expect(page.getByRole("status").first()).toContainText("Kept");
  await expect(page.locator(".sealed-letter svg")).toHaveCSS(
    "animation-name",
    "none",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Let it go", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("real product screenshots", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/vault-desktop.png",
    fullPage: true,
  });
  await createVault(page);
  await page.screenshot({
    path: "docs/screenshots/quiet-room-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Begin writing" }).click();
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .fill("Fictional example — a little space on the page.");
  await page
    .getByRole("textbox", { name: "Optional title" })
    .fill("A fictional page");
  await page.getByRole("button", { name: "Keep this thought" }).click();
  await expect(page.getByRole("status")).toContainText("Kept");
  await thought(
    page,
    "Another fictional page",
    "Fictional example — another place to begin.",
  );
  await page
    .getByRole("link", { name: "Letters Never Sent", exact: true })
    .click();
  await page.getByRole("button", { name: "Write a letter" }).click();
  await page
    .getByRole("textbox", { name: "Optional title" })
    .fill("A fictional unsent letter");
  await page
    .getByRole("textbox", { name: "Your letter", exact: true })
    .fill("Fictional example — these words stay on the page.");
  await page.getByRole("button", { name: "Keep this letter" }).click();
  await expect(page.getByRole("status").first()).toContainText("Kept");
  await page
    .getByRole("link", { name: "Letter collection", exact: true })
    .click();
  await page.screenshot({
    path: "docs/screenshots/letters-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Thought Constellation" }).click();
  await expect(page.locator(".star-title")).toHaveCount(3);
  await page
    .getByText("Arrange your connections & themes", { exact: true })
    .click();
  await page
    .getByLabel("First star", { exact: true })
    .selectOption({ label: "A fictional page" });
  await page
    .getByLabel("Second star", { exact: true })
    .selectOption({ label: "Another fictional page" });
  await page
    .getByRole("button", { name: "Connect stars", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove connection", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("First star", { exact: true })
    .selectOption({ label: "Another fictional page" });
  await page
    .getByLabel("Second star", { exact: true })
    .selectOption({ label: "A fictional unsent letter" });
  await page
    .getByRole("button", { name: "Connect stars", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove connection", exact: true }),
  ).toHaveCount(2);
  await page
    .getByText("Arrange your connections & themes", { exact: true })
    .click();
  await page.screenshot({
    path: "docs/screenshots/constellation-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, "/");
  await page.screenshot({
    path: "docs/screenshots/quiet-room-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Begin writing" }).click();
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .fill("Fictional example — a little space on the page.");
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: "docs/screenshots/writing-mobile.png",
    fullPage: true,
  });
});
test("automated accessibility checks across real screens", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  async function check() {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await check();
  await createVault(page);
  await check();
  await page.getByRole("button", { name: "Begin writing" }).click();
  await check();
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .fill("Fictional accessibility sample.");
  await page
    .getByRole("button", { name: "Keep this thought", exact: true })
    .click();
  await page.getByRole("link", { name: "The Archive", exact: true }).click();
  await check();
  await page
    .getByRole("link", { name: "Letters Never Sent", exact: true })
    .click();
  await check();
  await page
    .getByRole("link", { name: "Privacy & Settings", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Privacy & Settings" }),
  ).toBeVisible();
  await check();
  await page
    .getByRole("link", { name: "Thought Constellation", exact: true })
    .click();
  await expect(page.locator(".star-title")).toBeVisible();
  await check();
  await page.getByRole("button", { name: "List view" }).click();
  await check();
});
test("a failed draft write warns before leaving and permits an explicit discard lock", async ({
  page,
}) => {
  await createVault(page);
  await page.getByRole("button", { name: "Begin writing" }).click();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "vault")
        throw new DOMException("Fictional quota failure", "QuotaExceededError");
      return original.apply(this, args);
    };
  });
  await page
    .getByRole("textbox", { name: "Your thought", exact: true })
    .fill("Fictional unsaved text");
  await expect(page.getByRole("alert").first()).toContainText(
    "Fictional quota failure",
  );
  await page.getByRole("link", { name: "The Archive", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Leave with unsaved changes?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your thought", exact: true }),
  ).toHaveValue("Fictional unsaved text");
  await page.getByRole("button", { name: "Lock your space" }).click();
  await expect(
    page.getByRole("dialog", { name: "Lock with unsaved changes?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Discard unsaved changes & lock" })
    .click();
  await expect(
    page.getByRole("button", { name: "Unlock your space" }),
  ).toBeVisible();
});
test("inactivity locking drops the unlocked interface", async ({ page }) => {
  await page.clock.install();
  await createVault(page);
  await page
    .getByRole("link", { name: "Privacy & Settings", exact: true })
    .click();
  await page.getByLabel("Lock after inactivity").selectOption("5");
  await page.clock.fastForward(5 * 60000 + 1000);
  await expect(
    page.getByRole("button", { name: "Unlock your space" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Privacy & Settings" }),
  ).toHaveCount(0);
});
