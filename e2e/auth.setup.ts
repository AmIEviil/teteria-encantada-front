import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

// Logs in once via the real UI and saves localStorage (token/userData) for reuse.
setup("authenticate", async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Set E2E_USERNAME and E2E_PASSWORD env vars (a real backend user) before running e2e tests.",
    );
  }

  await page.goto("/login");
  await page.getByLabel("Nombre de usuario").fill(username);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  // App redirects away from /login on success.
  await expect(page).not.toHaveURL(/\/login$/);
  await page.context().storageState({ path: authFile });
});
