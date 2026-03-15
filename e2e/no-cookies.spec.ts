import { test, expect } from '@playwright/test';

test.describe('No cookies when analytics is blocked', () => {
  test('no cookies are set after visiting pages with analytics blocked', async ({
    page,
    context,
  }) => {
    const abortAnalytics = (route: { abort: () => Promise<void> }) => route.abort();
    await context.route(/swetrix|datadoghq|datadog|analytics-api\.kieks\.me/, abortAnalytics);

    await page.goto('/', { waitUntil: 'networkidle' });
    await page.goto('/impressum.html', { waitUntil: 'networkidle' });

    const cookies = await context.cookies();
    expect(cookies).toHaveLength(0);
  });
});
