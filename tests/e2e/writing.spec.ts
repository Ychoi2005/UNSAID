import { expect, test } from "@playwright/test";
test("write, restore draft, keep, reload, edit, search and delete", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:5173")) external.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Let it out", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Optional title" })
    .fill("A sample evening");
  await page
    .getByRole("textbox", { name: "Your thought" })
    .fill("Only a non-sensitive sample.");
  await page
    .getByRole("textbox", { name: "Tags, if you’d like" })
    .fill("sample, evening");
  await expect(page.getByRole("status")).toContainText("Draft kept");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Your thought" })).toHaveValue(
    "Only a non-sensitive sample.",
  );
  await page.getByRole("button", { name: "Keep this thought" }).click();
  await expect(
    page.getByRole("heading", { name: "A sample evening" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /A sample evening/ }).click();
  await page.getByRole("button", { name: "Edit thought" }).click();
  await page
    .getByRole("textbox", { name: "Your thought" })
    .fill("A revised sample.");
  await page.getByRole("button", { name: "Keep this thought" }).click();
  await page.getByRole("textbox", { name: "Search thoughts" }).fill("evening");
  await expect(
    page.getByRole("heading", { name: "A sample evening" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /A sample evening/ }).click();
  await expect(
    page.getByText("A revised sample.", { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Let it go", exact: true }).click();
  await page.getByRole("button", { name: "Keep it here" }).click();
  await expect(
    page.getByRole("heading", { name: "A sample evening" }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Let it go", exact: true }).click();
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name: "Let it go", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Search thoughts" }).fill("");
  await expect(
    page.getByRole("heading", { name: "Nothing you need to fill." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Nothing you need to fill." }),
  ).toBeVisible();
  expect(external).toEqual([]);
});
test("responsive welcome and keyboard navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Some thoughts are easier/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Let it out", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your thought" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("draft replacement is explicit and draft discard supports keyboard cancellation", async ({
  page,
}) => {
  await page.goto("/write");
  await page
    .getByRole("textbox", { name: "Your thought" })
    .fill("A saved sample");
  await page.getByRole("button", { name: "Keep this thought" }).click();
  await page.getByRole("link", { name: "Let it out", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your thought" })
    .fill("An unfinished sample");
  await expect(page.getByRole("status")).toContainText("Draft kept");
  await page.getByRole("link", { name: "My thoughts" }).click();
  await page.getByRole("button", { name: /An untitled thought/ }).click();
  await page.getByRole("button", { name: "Edit thought" }).click();
  await expect(
    page.getByRole("heading", { name: "You have an unfinished draft." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep it here" }).click();
  await page.getByRole("button", { name: "Close thought" }).click();
  await page.getByRole("link", { name: "Let it out", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Your thought" })).toHaveValue(
    "An unfinished sample",
  );
  await page.getByRole("button", { name: "Let it go" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Let it go" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Let it go" })
    .click();
  await expect(page.getByRole("textbox", { name: "Your thought" })).toHaveValue(
    "",
  );
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Your thought" })).toHaveValue(
    "",
  );
});
test("storage failure is visible and never claims a successful save", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      value: {
        open() {
          throw new Error("Storage blocked");
        },
      },
    });
  });
  await page.goto("/write");
  await expect(page.getByRole("alert")).toContainText(
    "Your draft could not be opened",
  );
  await expect(
    page.getByRole("button", { name: "Keep this thought" }),
  ).toBeDisabled();
});
test("capture the real desktop and mobile foundation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/quiet-room-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/quiet-room-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Let it out", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your thought" })
    .fill("A small, non-sensitive sample thought.");
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: "docs/screenshots/writing-mobile.png",
    fullPage: true,
  });
});
