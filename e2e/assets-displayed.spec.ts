import { test, expect } from '@playwright/test';
import { APP_PAGES } from './pages';

test.describe('Same-origin assets load and display', () => {
  for (const path of APP_PAGES) {
    test(`${path || '/'} has all same-origin images loaded`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2_000);

      const brokenSameOriginImages = await page.evaluate(() => {
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        return [...document.images]
          .filter((img) => img.src.startsWith(origin))
          .filter((img) => {
            try {
              return new URL(img.src).pathname !== pathname;
            } catch {
              return true;
            }
          })
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.src);
      });

      expect(
        brokenSameOriginImages,
        `Same-origin images failed to load (404 or error): ${brokenSameOriginImages.join(', ') || 'none'}`
      ).toHaveLength(0);
    });
  }
});
