import { test, expect, type Page } from "@playwright/test";

// Full flow: authenticated user creates a reservation on /reservas.
// Requires backend (:3000) + DB up with >=1 ACTIVE table and a weekly schedule that
// has at least one open day with available slots. If none exist, the test skips
// rather than failing on empty data — fix the seed, not the test.

// Picks the first selectable option of a MUI <TextField select>, skipping placeholders.
async function selectFirstOption(page: Page, comboName: string, skip: string[]) {
  await page.getByRole("combobox", { name: comboName }).click();
  const options = page.getByRole("listbox").getByRole("option");
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    const disabled = (await option.getAttribute("aria-disabled")) === "true";
    const text = ((await option.textContent()) ?? "").trim();
    const isPlaceholder = skip.some((s) => text.startsWith(s));
    if (!disabled && text && !isPlaceholder) {
      await option.click();
      return true;
    }
  }
  // Close the menu and report nothing usable.
  await page.keyboard.press("Escape");
  return false;
}

test("create a reservation end-to-end", async ({ page }) => {
  const holderName = `E2E ${Date.now()}`;

  await page.goto("/reservas");
  await expect(page.getByRole("heading", { name: "Crear reserva" })).toBeVisible();

  // 1. Mesa (drives nothing else, pick any active one).
  const gotTable = await selectFirstOption(page, "Mesa", ["Seleccionar mesa"]);
  test.skip(!gotTable, "No ACTIVE table in the backend — seed at least one table.");

  // 2. Dia — custom calendar. Open it, click the first enabled day, confirm.
  await page.getByRole("button", { name: "seleccione fecha" }).click();
  // While the calendar popup is open, the only digit-labelled buttons on the page are the days.
  const enabledDays = page
    .locator("button:not([disabled])")
    .filter({ hasText: /^\d{1,2}$/ });
  test.skip(
    (await enabledDays.count()) === 0,
    "No available reservation days — configure the weekly schedule.",
  );
  await enabledDays.first().click();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  // 3. Hora — time slots depend on the chosen day.
  const gotTime = await selectFirstOption(page, "Hora", ["Sin horarios disponibles"]);
  test.skip(!gotTime, "No available time slots for the selected day.");

  // 4. Titular (unique, used as the assertion anchor).
  await page.getByLabel("Nombre titular").fill(holderName);

  // 5. Submit.
  await page.getByRole("button", { name: "Guardar reserva" }).click();

  // On success the form clears and the list refetches — the new reservation shows up.
  await expect(page.getByLabel("Nombre titular")).toHaveValue("");
  await expect(page.getByText(holderName).first()).toBeVisible();
});
