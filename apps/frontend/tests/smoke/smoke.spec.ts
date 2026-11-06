import { expect, test } from "@playwright/test";

test("deployed pages open and a signed-out visitor can view a public list and return to it after sign-in", async ({
  page,
}) => {
  const routes: Array<{ path: string; heading: RegExp }> = [
    { path: "/", heading: /Give your people what they want/i },
    { path: "/login", heading: /Sign in/i },
    { path: "/signup", heading: /Create an account/i },
    { path: "/confirm", heading: /Verify your email/i },
    { path: "/forgot-password", heading: /Reset password|Forgot password/i },
    { path: "/privacy", heading: /Privacy/i },
  ];

  for (const route of routes) {
    const res = await page.goto(route.path);
    expect(res?.status(), `status for ${route.path}`).toBe(200);
    await expect(
      page.getByRole("heading", { name: route.heading }).first(),
    ).toBeVisible();
  }

  const token = process.env.SMOKE_LIST_TOKEN;
  const email = process.env.SMOKE_EMAIL;
  const password = process.env.SMOKE_PASSWORD;
  expect(token, "SMOKE_LIST_TOKEN is required for the smoke check").toBeTruthy();

  await page.goto(`/list?t=${token}`);
  await expect(page.getByText(/open, .* reserved, .* purchased/)).toBeVisible();
  await expect(page.getByRole("button", { name: "I'll get this" })).toBeVisible();

  await page.getByRole("button", { name: "I'll get this" }).click();
  await expect(page).toHaveURL(/\/login/);

  if (email && password) {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/list\?(t=smoke-public-2026|id=smoke-list-2026)/);
    await expect(page.getByText("Warm wool scarf")).toBeVisible();
  }
});
