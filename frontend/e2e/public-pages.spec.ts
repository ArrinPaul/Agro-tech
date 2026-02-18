import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    // Check branding
    await expect(page.locator("text=Welcome to AgroTech")).toBeVisible();
    await expect(
      page.locator("text=Smart Crop & Warehouse Management Platform")
    ).toBeVisible();

    // Check feature list
    await expect(page.locator("text=Full CRUD operations")).toBeVisible();
    await expect(
      page.locator("text=Real-time dashboard analytics")
    ).toBeVisible();
    await expect(
      page.locator("text=AI-powered insights & suggestions")
    ).toBeVisible();

    // Clerk Sign-In component should render
    await expect(
      page.locator('[class*="cl-rootBox"], [data-clerk]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("sign-up page renders correctly", async ({ page }) => {
    await page.goto("/sign-up");

    await expect(page.locator("text=Join AgroTech")).toBeVisible();
    await expect(
      page.locator("text=Start managing your farm operations today")
    ).toBeVisible();

    // Clerk Sign-Up component should render
    await expect(
      page.locator('[class*="cl-rootBox"], [data-clerk]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(page.locator("text=404")).toBeVisible({ timeout: 10000 });
  });

  test("unauthorized page renders", async ({ page }) => {
    await page.goto("/unauthorized");

    await expect(page.locator("text=Access Denied")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Auth Redirect", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/");

    // Should redirect to /login
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects from /warehouses to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/warehouses");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects from /crops to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/crops");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects from /resources to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/resources");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects from /allocations to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/allocations");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects from /ai-insights to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/ai-insights");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects from /reports to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/reports");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects from /audit-log to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/audit-log");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Clerk Sign-in UI", () => {
  test("login page has sign-in form elements", async ({ page }) => {
    await page.goto("/login");

    // Wait for Clerk to render
    await page.waitForSelector('[class*="cl-"], [data-clerk]', {
      timeout: 15000,
    });

    // Clerk renders email input and continue button
    const clerkRoot = page.locator(
      '[class*="cl-rootBox"], [data-clerk], [id*="clerk"]'
    );
    await expect(clerkRoot.first()).toBeVisible();
  });

  test("sign-up page has sign-up form elements", async ({ page }) => {
    await page.goto("/sign-up");

    await page.waitForSelector('[class*="cl-"], [data-clerk]', {
      timeout: 15000,
    });

    const clerkRoot = page.locator(
      '[class*="cl-rootBox"], [data-clerk], [id*="clerk"]'
    );
    await expect(clerkRoot.first()).toBeVisible();
  });
});
