import { test, expect, devices, type Page } from "@playwright/test";
import { installMocks } from "./fixtures/mockApi";
import fs from "node:fs";
import path from "node:path";

/**
 * Mobile responsive audit WITH DATA. The dev database is empty, so every list
 * renders its empty state and hides the real layout stress (long names, wide
 * tables, many rows). This spec intercepts the API and serves dense fixtures
 * so we can measure how the UI behaves with realistic content. Read-only:
 * nothing is written to the backend.
 *
 * Run: npx playwright test e2e/mobile-responsive-data.spec.ts
 */

const OUT_DIR =
  process.env.AUDIT_OUT ??
  path.resolve("playwright-report", "mobile-audit-data");
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-14-pro", width: 393, height: 852 },
];

type RouteDef = { id: string; path: string };

const ROUTES: RouteDef[] = [
  { id: "data-admin-tearoom", path: "/" },
  { id: "data-admin-eventos-tickets", path: "/eventos-tickets" },
  { id: "data-admin-reporte-ventas", path: "/reporte-ventas" },
  { id: "data-admin-reservas", path: "/reservas" },
  { id: "data-admin-inventario", path: "/inventario" },
  { id: "data-admin-empleados", path: "/empleados" },
  { id: "data-publico-eventos", path: "/publico/eventos" },
  { id: "data-publico-evento-detalle", path: "/publico/eventos/event-1" },
  { id: "data-publico-calendario", path: "/publico/calendario" },
];

const measure = async (page: Page) =>
  page.evaluate(() => {
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

    const offenders = all
      .filter(overflows)
      .filter((el) => !(el.parentElement && overflows(el.parentElement)))
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
      .sort((a, b) => b.overshootPx - a.overshootPx)
      .slice(0, 12);

    // Text nodes visually truncated by their own box (ellipsis or hard clip).
    const truncated = all
      .filter((el) => {
        const s = getComputedStyle(el);
        const clips =
          s.textOverflow === "ellipsis" ||
          s.overflow === "hidden" ||
          s.overflowX === "hidden";
        return clips && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0;
      })
      .map((el) => ({
        el: describe(el),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }))
      .slice(0, 12);

    // Wide blocks (tables/grids): can the user actually reach the hidden part?
    const wide = all
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > vw + 8 && (el.tagName === "TABLE" || el.scrollWidth > vw);
      })
      .slice(0, 6)
      .map((el) => {
        let node: HTMLElement | null = el.parentElement;
        let scrollableAncestor: string | null = null;
        while (node) {
          const s = getComputedStyle(node);
          if (
            (s.overflowX === "auto" || s.overflowX === "scroll") &&
            node.scrollWidth > node.clientWidth + 2
          ) {
            scrollableAncestor = describe(node);
            break;
          }
          node = node.parentElement;
        }
        return {
          el: describe(el),
          width: Math.round(el.getBoundingClientRect().width),
          reachableByScroll: Boolean(scrollableAncestor),
          scrollableAncestor,
        };
      });

    const scroller = document.scrollingElement ?? document.documentElement;
    return {
      viewportWidth: vw,
      overflowPx: Math.max(scroller.scrollWidth - vw, 0),
      bodyTextLength: (document.body.innerText ?? "").trim().length,
      offenders,
      truncated,
      wide,
    };
  });

const report: Record<string, unknown>[] = [];

test.afterAll(() => {
  const file = path.join(OUT_DIR, "report-data.json");
  let existing: Record<string, unknown>[] = [];
  if (fs.existsSync(file)) existing = JSON.parse(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, JSON.stringify([...existing, ...report], null, 2));
});

for (const vp of VIEWPORTS) {
  test.describe(`data ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({
      userAgent: devices["Pixel 5"].userAgent,
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    for (const route of ROUTES) {
      test(route.id, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on("console", (m) => {
          if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
        });
        await installMocks(page);
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page
          .waitForLoadState("networkidle", { timeout: 15_000 })
          .catch(() => {});
        await page.waitForTimeout(1500);

        const metrics = await measure(page);
        const shot = `${route.id}__${vp.name}.png`;
        await page.screenshot({ path: path.join(OUT_DIR, shot), fullPage: true });

        report.push({
          route: route.id,
          viewport: vp.name,
          finalUrl: new URL(page.url()).pathname,
          screenshot: shot,
          consoleErrors: consoleErrors.slice(0, 5),
          ...metrics,
        });

        expect(
          metrics.overflowPx,
          `${route.id} @${vp.name}: desborda ${metrics.overflowPx}px`,
        ).toBeLessThanOrEqual(1);
      });
    }
  });
}
