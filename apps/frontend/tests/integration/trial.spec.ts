import { expect, test } from "@playwright/test";
import { TrialFixtureWorld } from "./fixtures";

test("trial journey: sign up, write a list, guest and friend shopping, poke, shopping list, and reveal without spoiling", async ({
  page,
}) => {
  const world = new TrialFixtureWorld();
  await world.attach(page);

  // 1. Owner signs up, confirms, signs in, and lands on /list
  await page.goto("/signup");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/confirm\?email=ada%40example\.com/);
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/list\?id=/);
  await expect(
    page.getByText(
      "People can mark gifts as taken, and you will not see that until you reveal the list.",
    ),
  ).toBeVisible();

  // Add an Amazon product and an experience
  await page
    .getByLabel("Product link")
    .fill("https://www.amazon.com/dp/B00SWEATER?size=M");
  await page.getByRole("button", { name: "More details" }).click();
  await page.getByLabel("Title").fill("Navy cable sweater");
  await page.getByLabel("Notes").fill("Size M, navy");
  await page.getByLabel("Price").fill("45");
  await page.getByRole("button", { name: "Add gift" }).click();
  await expect(page.getByText("Navy cable sweater")).toBeVisible();

  const adaUser = world.users.get("ada@example.com")!;
  const adaList = world.lists.find((l) => l.ownerId === adaUser.sub)!;
  const sharePath = `/list?t=${adaList.shareToken}`;

  // Sign out to become a guest
  await page.getByRole("button", { name: "Sign out" }).click();

  // 2. Guest opens the public share link, sees open count, and taps I'll get this -> sent to /login and returned
  const sam = world.seedUser("sam@example.com", "Winter2026", "Sam");
  world.makeFriends(adaUser.sub, sam.sub);

  await page.goto(sharePath);
  await expect(page.getByText("Navy cable sweater")).toBeVisible();
  await expect(page.getByText("1 open, 0 reserved, 0 purchased")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Sam");

  await page.getByRole("button", { name: "I'll get this" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Returned to the shared list
  await expect(page).toHaveURL(new RegExp(`/list\\?t=${adaList.shareToken}`));
  await expect(page.getByText("1 still open")).toBeVisible();

  // 3. Friend reserves the gift, sees Did you buy it?, leaves a shopper note, and marks purchased
  await page.getByRole("button", { name: "I'll get this" }).click();
  const dialog = page.getByRole("dialog", { name: "Did you buy it?" });
  await expect(dialog).toBeVisible();
  const buyHref = await dialog.getByRole("link", { name: "Buy" }).getAttribute("href");
  expect(buyHref).toContain("tag=nicelist-20");
  expect(buyHref).toContain("ascsubtag=");

  await dialog.getByLabel("Note for other shoppers").fill("getting the navy one");
  await dialog.getByRole("button", { name: "Yes" }).click();
  await expect(page.getByText("Bought by Sam — getting the navy one")).toBeVisible();

  // 4. Friend pokes Ada for ideas under $25
  await page
    .getByRole("button", { name: "Poke for more ideas under $25" })
    .click();
  await expect(
    page.getByText(/You poked .* for more ideas under \$25/),
  ).toBeVisible();

  // 5. Friend opens Shopping list, adds Ada and a purchased private planned gift
  await page.getByRole("link", { name: "Shopping list" }).click();
  await expect(page.getByRole("heading", { name: "Christmas 2026" })).toBeVisible();
  await page.getByRole("button", { name: `Add ${adaList.recipientName}` }).click();
  await page.getByLabel("Title").fill("Blackhawks tickets");
  await page.getByRole("button", { name: "Add planned gift" }).click();
  await expect(page.getByText("Blackhawks tickets · still to buy")).toBeVisible();
  await page.getByRole("button", { name: "Mark purchased" }).click();
  await expect(page.getByText("Blackhawks tickets · purchased")).toBeVisible();

  // 6. Ada signs back in: before reveal she sees Sam's poke, does NOT see Sam's claim or the planned gift
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/list\?id=/);
  await expect(
    page.getByText("Sam poked you for more ideas under $25"),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Bought by Sam");
  await expect(page.locator("body")).not.toContainText("getting the navy one");
  await expect(page.locator("body")).not.toContainText("Blackhawks tickets");

  // 7. Ada reveals the list: first screen is the summary without names, then purchased status and anonymous rating of suggestion
  await page.getByRole("button", { name: "Reveal" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Reveal" })
    .click();

  await expect(page.getByText("1 of 1 were purchased")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Bought by Sam");
  await page
    .getByRole("button", { name: "See which gifts were purchased" })
    .click();
  await expect(page.getByText("Purchased", { exact: true })).toBeVisible();
  await expect(page.getByText("Blackhawks tickets")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Bought by Sam");
});

test("friends-only link redirects signed-out visitor to sign-in, child-safe view hides claims and pokes locally, and WebMCP unregisters on sign-out", async ({
  page,
}) => {
  const world = new TrialFixtureWorld();
  const ada = world.seedUser("ada@example.com", "Winter2026", "Ada");
  const sam = world.seedUser("sam@example.com", "Winter2026", "Sam");
  world.makeFriends(ada.sub, sam.sub);
  const adaList = world.lists.find((l) => l.ownerId === ada.sub)!;
  adaList.visibility = "FRIENDS";

  const registered = new Set<string>();
  await page.addInitScript(() => {
    const names = new Set<string>();
    (window as Window & { __mcpNames?: () => string[] }).__mcpNames = () =>
      Array.from(names);
    Object.defineProperty(document, "modelContext", {
      value: {
        registerTool: (tool: { name: string }) => {
          names.add(tool.name);
          return {
            unregister: () => {
              names.delete(tool.name);
            },
          };
        },
        unregisterTool: (name: string) => {
          names.delete(name);
        },
      },
      configurable: true,
    });
  });

  await world.attach(page);

  // Signed-out visitor on a friends-only link goes to /login and returns after sign-in
  await page.goto(`/list?t=${adaList.shareToken}`);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`/list\\?t=${adaList.shareToken}`));

  const toolsWhileShopping = await page.evaluate(() =>
    (window as Window & { __mcpNames?: () => string[] }).__mcpNames?.() ?? [],
  );
  expect(toolsWhileShopping).toContain("nicelist_reserve");
  expect(toolsWhileShopping).toContain("nicelist_poke");

  // Sign out unregisters tools
  await page.getByRole("button", { name: "Sign out" }).click();
  const toolsAfterSignOut = await page.evaluate(() =>
    (window as Window & { __mcpNames?: () => string[] }).__mcpNames?.() ?? [],
  );
  expect(toolsAfterSignOut).toEqual([]);
  void registered;

  // Ada adds a child, Sam claims a gift on the child's list, Ada sees the claim in parent view and hides it in child-safe view
  await page.goto("/login");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("Winter2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/list\?id=/);

  await page.getByLabel("Child's name").fill("Leo");
  await page.getByRole("button", { name: "Add child" }).click();
  await expect(page.getByRole("heading", { name: "Leo", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Custom gift" }).click();
  await page.getByLabel("Title").fill("Wooden train set");
  await page.getByRole("button", { name: "Add gift" }).click();
  await expect(page.getByText("Wooden train set")).toBeVisible();

  // Ada claims the gift on Leo's list as a managing adult
  await page.getByRole("button", { name: "I'll get this" }).click();
  await page
    .getByRole("dialog", { name: "Did you buy it?" })
    .getByRole("button", { name: "Not yet" })
    .click();
  await expect(page.getByText("Taken by Ada")).toBeVisible();

  // Switch to child-safe view: claim details and ideas disappear locally
  await page
    .getByRole("button", { name: "Show the view a child would see" })
    .click();
  await expect(page.locator("body")).not.toContainText("Taken by Ada");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __mcpNames?: () => string[] }).__mcpNames?.() ??
          [],
      ),
    )
    .not.toContain("nicelist_ideas");
  const childSafeTools = await page.evaluate(() =>
    (window as Window & { __mcpNames?: () => string[] }).__mcpNames?.() ?? [],
  );
  expect(childSafeTools).not.toContain("nicelist_pokes");
});

