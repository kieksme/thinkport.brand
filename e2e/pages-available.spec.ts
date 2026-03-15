import { test, expect } from '@playwright/test';
import { APP_PAGES } from './pages';

const GOOGLE_VERIFICATION_PATH = '/google920fd9ad773da353.html';

test.describe('All app pages are available', () => {
  for (const path of APP_PAGES) {
    test(`${path || '/'} returns 200 and has expected content`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);

      if (path === GOOGLE_VERIFICATION_PATH) {
        await expect(page.locator('body')).toContainText('google-site-verification');
      } else {
        await expect(page.locator('main[role="main"]')).toBeVisible({ timeout: 10_000 });
      }
    });
  }
});
