import { test, expect, devices, type Page } from "@playwright/test";
import { installMocks } from "./fixtures/mockApi";
import fs from "node:fs";
import path from "node:path";

/**
 * Mobile audit of the interactive surfaces (menus, modals, panels) that the
 * static route audit never reaches. Same read-only API mocks.
 *
 * Run: npx playwright test e2e/mobile-responsive-interactions.spec.ts
 */

const OUT_DIR =
  process.env.AUDIT_OUT ??
  path.resolve("playwright-report", "mobile-audit-interactions");
fs.mkdirSync(OUT_DIR, { recursive: true });

const VP = { name: "iphone-se", width: 375, height: 667 };

const measure = (page: Page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const describe = (el: Element) => {
      const cls =
        typeof el.className === "string" ? el.className.slice(0, 80) : "";
      const txt = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()}${
        cls ? "." + cls.trim().split(/\s+/).slice(0, 3).join(".") : ""
      }${txt ? ` |"${txt}"` : ""}`;
    };
    const visible = (el: Element) => {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0")
        return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const all = Array.from(document.querySelectorAll("body *")).filter(visible);
    const offenders = all
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.right > vw + 1 || r.left < -1;
      })
      .filter((el) => {
        const p = el.parentElement;
        if (!p) return true;
        const pr = p.getBoundingClientRect();
        return !(pr.right > vw + 1 || pr.left < -1);
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el: describe(el),
          width: Math.round(r.width),
          overshootPx: Math.round(
            Math.max(r.right - vw, 0) + Math.max(-r.left, 0),
          ),
        };
      })
      .slice(0, 8);

    // Dialog/panel taller than the viewport with no internal scroller is a trap.
    const dialogs = Array.from(
      document.querySelectorAll("[role='dialog'], .MuiDialog-paper, dialog"),
    )
      .filter(visible)
      .map((el) => {
        const r = el.getBoundingClientRect();
        const scrollable = Array.from(el.querySelectorAll("*")).some((c) => {
          const s = getComputedStyle(c);
          return (
            (s.overflowY === "auto" || s.overflowY === "scroll") &&
            c.scrollHeight > c.clientHeight + 2
          );
        });
        return {
          el: describe(el),
          width: Math.round(r.width),
          height: Math.round(r.height),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          tallerThanViewport: r.height > vh + 2,
          hasInternalScroll: scrollable,
        };
      });

    const scroller = document.scrollingElement ?? document.documentElement;
    return {
      viewportWidth: vw,
      overflowPx: Math.max(scroller.scrollWidth - vw, 0),
      offenders,
      dialogs,
    };
  });

const report: Record<string, unknown>[] = [];

test.afterAll(() => {
  // Append: a failed test restarts the worker, which would otherwise drop the
  // entries collected before the restart.
  const file = path.join(OUT_DIR, "report-interactions.json");
  let existing: Record<string, unknown>[] = [];
  if (fs.existsSync(file)) existing = JSON.parse(fs.readFileSync(file, "utf8"));
  const merged = [...existing, ...report].filter(
    (e, i, arr) => arr.findIndex((o) => o.id === e.id) === i,
  );
  fs.writeFileSync(file, JSON.stringify(merged, null, 2));
});

const snap = async (page: Page, id: string) => {
  await page.waitForTimeout(700);
  const metrics = await measure(page);
  const shot = `${id}__${VP.name}.png`;
  await page.screenshot({ path: path.join(OUT_DIR, shot), fullPage: false });
  report.push({ id, screenshot: shot, ...metrics });
  return metrics;
};

test.describe(`interactions ${VP.name}`, () => {
  test.use({
    userAgent: devices["Pixel 5"].userAgent,
    viewport: { width: VP.width, height: VP.height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });

  const open = async (page: Page, url: string) => {
    await installMocks(page);
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1200);
  };

  test("topbar-menu", async ({ page }) => {
    await open(page, "/reservas");
    await page.locator("div[class*='topBarContainer'] button").first().click();
    await snap(page, "topbar-menu-open");
  });

  test("inventario-modal-crear-producto", async ({ page }) => {
    await open(page, "/inventario");
    await page.getByRole("button", { name: /Crear Producto/i }).click();
    await snap(page, "inventario-modal-crear");
  });

  test("eventos-form-nuevo-evento", async ({ page }) => {
    await open(page, "/eventos-tickets");
    await page.getByRole("button", { name: /Generar nuevo evento/i }).click();
    await snap(page, "eventos-form-nuevo");
  });

  test("eventos-registrar-tickets", async ({ page }) => {
    await open(page, "/eventos-tickets");
    await page.getByRole("button", { name: /Registrar tickets/i }).first().click();
    await snap(page, "eventos-registrar-tickets");
  });

  test("reservas-horario-semanal", async ({ page }) => {
    await open(page, "/reservas");
    await page.getByRole("button", { name: /Configurar horario semanal/i }).click();
    await snap(page, "reservas-horario-semanal");
  });

  test("tearoom-mesa-panel", async ({ page }) => {
    await open(page, "/");
    await page
      .getByText(/^(MESA_1|Mesa 1( .*)?)$/)
      .first()
      .click({ force: true });
    await snap(page, "tearoom-mesa-panel");
  });

  test("tearoom-panel-ordenes", async ({ page }) => {
    await open(page, "/");
    await page.getByText(/Panel de ordenes/i).first().click({ force: true });
    await snap(page, "tearoom-panel-ordenes");
  });

  test("publico-menu", async ({ page }) => {
    await open(page, "/publico/eventos");
    await page.locator("div[class*='topBarContainer'] button").first().click();
    await snap(page, "publico-menu-open");
  });

  test("calendario-dia-con-evento", async ({ page }) => {
    await open(page, "/publico/calendario");
    await page.locator("button.calendarEventCard").first().click();
    await snap(page, "calendario-evento-click");
  });

  // Sanity: no test above may leave the page horizontally scrollable.
  test.afterEach(async () => {
    for (const entry of report) {
      expect(
        entry.overflowPx as number,
        `${entry.id}: desborda ${entry.overflowPx}px`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
