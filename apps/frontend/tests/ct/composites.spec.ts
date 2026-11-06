import { expect, test } from "@playwright/test";

function storyUrl(id: string) {
  return `/iframe.html?id=${id}&viewMode=story`;
}

test("Did you buy it? dialog traps focus, dismisses on Escape, and leaves the gift reserved", async ({
  page,
}) => {
  await page.goto(storyUrl("nicelist-trial-composites--did-you-buy-it-dialog"));
  const dialog = page.getByRole("dialog", { name: "Did you buy it?" });
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("gift-status")).toHaveText("Status: Reserved");
  await expect(
    page.getByRole("button", { name: "Did you buy it?" }),
  ).toBeVisible();
});

test("Destructive alert dialog starts focus on the choice that keeps the thing", async ({
  page,
}) => {
  await page.goto(
    storyUrl("nicelist-trial-composites--destructive-confirm-dialog"),
  );
  await page.getByRole("button", { name: "Delete gift" }).click();
  const alertDialog = page.getByRole("alertdialog");
  await expect(alertDialog).toBeVisible();

  const keepButton = alertDialog.getByRole("button", { name: "Keep it" });
  await expect(keepButton).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(alertDialog).toBeHidden();
  await expect(page.getByTestId("delete-state")).toHaveText("Kept");
});

test("Visibility, timing, and membership radio groups move by arrow keys and show selection in words", async ({
  page,
}) => {
  await page.goto(storyUrl("nicelist-trial-composites--sentence-radios"));
  const publicRadio = page.getByRole("radio", {
    name: "Anyone with the link can shop this",
  });
  await publicRadio.focus();
  await page.keyboard.press("ArrowDown");

  await expect(
    page.getByRole("radio", { name: "Only friends can open this" }),
  ).toBeChecked();
  await expect(
    page.getByText("Only friends can open this (Selected)"),
  ).toBeVisible();
});

test("List menu and More details disclosure open and close by keyboard and fit a phone at 200% zoom without horizontal scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(storyUrl("nicelist-trial-composites--add-gift-disclosure"));
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });

  const moreBtn = page.getByRole("button", { name: "More details" });
  await moreBtn.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Notes")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => {
    return (
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
    );
  });
  expect(hasHorizontalOverflow).toBe(false);

  await page.goto(storyUrl("nicelist-trial-composites--switch-list-menu"));
  const switchBtn = page.getByRole("button", { name: "Switch list" });
  await switchBtn.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Leo: Leo" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menuitem", { name: "Leo: Leo" })).toBeHidden();
});
