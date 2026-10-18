import { test, expect, devices, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Mobile responsive audit. Read-only: navigates each route at two mobile
 * viewports, measures horizontal overflow / offending elements / touch-target
 * sizes / tiny fonts, and dumps a JSON report + full-page screenshots.
 *
 * Run:  npx playwright test e2e/mobile-responsive.spec.ts
 */

const OUT_DIR =
  process.env.AUDIT_OUT ?? path.resolve("playwright-report", "mobile-audit");
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14-pro", width: 393, height: 852 },
];

type RouteDef = { id: string; path: string; wait?: string };

const PUBLIC_ROUTES: RouteDef[] = [
  { id: "publico-eventos", path: "/publico/eventos" },
  { id: "publico-calendario", path: "/publico/calendario" },
];

// Priority order requested: TeaRoom > Eventos/Tickets > Ventas > Reservas
const ADMIN_ROUTES: RouteDef[] = [
  { id: "admin-tearoom", path: "/" },
  { id: "admin-eventos-tickets", path: "/eventos-tickets" },
  { id: "admin-reporte-ventas", path: "/reporte-ventas" },
  { id: "admin-reservas", path: "/reservas" },
  { id: "admin-inventario", path: "/inventario" },
  { id: "admin-empleados", path: "/empleados" },
];

const AUTH_ROUTES: RouteDef[] = [
  { id: "auth-login", path: "/login" },
  { id: "auth-forgot", path: "/forgot-password" },
];

const measure = async (page: Page) => {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const describe = (el: Element) => {
      const cls =
        typeof el.className === "string" ? el.className.slice(0, 90) : "";
      const txt = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 50);
      return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${
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

    const overflows = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.right > vw + 1 || r.left < -1;
    };

    const all = Array.from(document.querySelectorAll("body *")).filter(visible);

    // Root causes = overflowing elements whose parent does NOT overflow.
    const offenders = all
      .filter(overflows)
      .filter((el) => !(el.parentElement && overflows(el.parentElement)))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el: describe(el),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          overshootPx: Math.round(Math.max(r.right - vw, 0) + Math.max(-r.left, 0)),
        };
      })
      .sort((a, b) => b.overshootPx - a.overshootPx)
      .slice(0, 12);

    const interactive = Array.from(
      document.querySelectorAll(
        "button, a[href], [role='button'], input:not([type='hidden']), select, textarea, [role='tab'], [role='menuitem']",
      ),
    ).filter(visible);

    const smallTargets = interactive
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el: describe(el), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter((t) => t.w < 40 || t.h < 40)
      .slice(0, 12);

    const tinyFonts = all
      .filter((el) => {
        const hasOwnText = Array.from(el.childNodes).some(
          (n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0,
        );
        if (!hasOwnText) return false;
        return parseFloat(getComputedStyle(el).fontSize) < 12;
      })
      .map((el) => ({
        el: describe(el),
        fontSize: getComputedStyle(el).fontSize,
      }))
      .slice(0, 10);

    // Elements that clip their own content horizontally without a scroller.
    const clipped = all
      .filter((el) => {
        const s = getComputedStyle(el);
        return (
          el.scrollWidth > el.clientWidth + 2 &&
          el.clientWidth > 0 &&
          s.overflowX === "hidden"
        );
      })
      .map((el) => ({
        el: describe(el),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }))
      .slice(0, 10);

    const scroller = document.scrollingElement ?? document.documentElement;

    return {
      viewportWidth: vw,
      docScrollWidth: scroller.scrollWidth,
      horizontalScroll: scroller.scrollWidth > vw + 1,
      overflowPx: Math.max(scroller.scrollWidth - vw, 0),
      bodyTextLength: (document.body.innerText ?? "").trim().length,
      offenders,
      smallTargets,
      tinyFonts,
      clipped,
    };
  });
};

const report: Record<string, unknown>[] = [];

test.afterAll(async () => {
  const file = path.join(OUT_DIR, `report-${process.env.AUDIT_TAG ?? "run"}.json`);
  let existing: Record<string, unknown>[] = [];
  if (fs.existsSync(file)) existing = JSON.parse(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, JSON.stringify([...existing, ...report], null, 2));
});

const auditRoute = async (
  page: Page,
  route: RouteDef,
  vp: (typeof VIEWPORTS)[number],
) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });

  await page.goto(route.path, { waitUntil: "domcontentloaded" });
  // Let lazy chunks + first data fetch settle.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const metrics = await measure(page);
  const shot = `${route.id}__${vp.name}.png`;
  await page.screenshot({
    path: path.join(OUT_DIR, shot),
    fullPage: true,
  });

  report.push({
    route: route.id,
    url: route.path,
    viewport: vp.name,
    finalUrl: new URL(page.url()).pathname,
    screenshot: shot,
    consoleErrors: consoleErrors.slice(0, 5),
    ...metrics,
  });

  // Hard assertion only on page-level horizontal scroll — the rest is reported.
  expect(
    metrics.overflowPx,
    `${route.id} @${vp.name}: página desborda ${metrics.overflowPx}px. Culpables: ${JSON.stringify(metrics.offenders.slice(0, 3))}`,
  ).toBeLessThanOrEqual(1);
};

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({
      userAgent: devices["Pixel 5"].userAgent,
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    for (const route of [...ADMIN_ROUTES, ...PUBLIC_ROUTES]) {
      test(`${route.id}`, async ({ page }) => {
        await auditRoute(page, route, vp);
      });
    }

    for (const route of AUTH_ROUTES) {
      test(`${route.id}`, async ({ page, context }) => {
        await context.clearCookies();
        await page.addInitScript(() => {
          try {
            window.localStorage.clear();
          } catch {
            /* noop */
          }
        });
        await auditRoute(page, route, vp);
      });
    }
  });
}
