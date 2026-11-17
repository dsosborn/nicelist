import { expect, test } from "@playwright/test";
import { TrialFixtureWorld } from "./fixtures";

test("paste fill, hidden contribution, thank-you names, next season, and claim mail skips the owner", async ({
  page,
}) => {
  const world = new TrialFixtureWorld();
  const ada = world.seedUser("ada@example.com", "Winter2026", "Ada");
  const sam = world.seedUser("sam@example.com", "Winter2026", "Sam");
  world.makeFriends(ada.sub, sam.sub);
  const adaList = world.lists.find((list) => list.ownerId === ada.sub && !list.isChild)!;
  await world.attach(page);

  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/list\?id=/);

  await page.getByLabel("Product link").fill("https://shop.example/mug?size=M");
  await page.getByLabel("Product link").blur();
  await page.getByRole("button", { name: "More details" }).click();
  await expect(page.getByLabel("Title").first()).toHaveValue("Oak mug");
  await expect(page.getByLabel("Notes")).toHaveValue("size: from the link");
  await page.getByRole("button", { name: "Add gift" }).click();
  await expect(page.getByRole("img", { name: "Oak mug" })).toBeVisible();

  await page.getByRole("button", { name: "Custom gift" }).click();
  await page.getByLabel("Title").fill("Trip");
  await page.getByLabel("Goal amount").fill("40");
  await page.getByRole("button", { name: "Add gift" }).click();
  await expect(page.getByText("Goal $40.00")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/list/);
  await page.goto(`/list?t=${adaList.shareToken}`);

  await page.route("https://checkout.example/**", (route) =>
    route.fulfill({ body: "pay", contentType: "text/html" }),
  );
  page.once("dialog", (dialog) => dialog.accept("10"));
  await Promise.all([
    page.waitForURL(/checkout\.example/),
    page.getByRole("button", { name: "Chip in" }).click(),
  ]);
  await page.goto(`/list?t=${adaList.shareToken}`);
  await expect(page.getByText("Goal $40.00, $10.00 in")).toBeVisible();

  await page.getByRole("button", { name: "I'll get this" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Yes" }).click();

  const claimMail = world.mail.filter((row) => row.action === "purchased" || row.action === "reserved");
  expect(claimMail.length).toBeGreaterThan(0);
  for (const row of claimMail) {
    expect(row.to).not.toContain(ada.sub);
    expect(row.buyerNamed).toBe(false);
  }

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("body")).not.toContainText("Received");
  await expect(page.locator("body")).not.toContainText("$10.00");
  await expect(page.getByText("Goal $40.00")).toBeVisible();

  await page.getByRole("button", { name: "Reveal" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reveal" }).click();
  await expect(page.locator("body")).not.toContainText("Purchased by Sam");
  await page.getByRole("button", { name: "See which gifts were purchased" }).click();
  await expect(page.getByText("Purchased by Sam")).toBeVisible();

  await page.getByRole("link", { name: "Shopping list" }).click();
  await page.getByLabel("Person with no account").fill("Grandpa");
  await page.getByRole("button", { name: "Add name" }).click();
  await expect(page.getByRole("heading", { name: "Grandpa" })).toBeVisible();
  await page.getByRole("button", { name: "Start next season" }).click();
  await expect(page.getByRole("heading", { name: "Grandpa" })).toBeVisible();
  await expect(page.getByLabel("Shopping list name")).toHaveValue("Christmas 2027");
});
