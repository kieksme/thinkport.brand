import { test, expect } from '@playwright/test';

test.describe('Impressum page', () => {
  test('exists and shows Impressum content', async ({ page }) => {
    const response = await page.goto('/impressum.html', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Impressum/);

    const main = page.getByRole('main');
    await expect(main).toBeVisible({ timeout: 10_000 });
    await expect(main.getByText(/Thinkport GmbH|§ 5 TMG|Angaben gemäß/).first()).toBeVisible();
  });
});
