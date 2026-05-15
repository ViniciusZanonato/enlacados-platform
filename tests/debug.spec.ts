import { test } from '@playwright/test';

test('debug auth page', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err));
    page.on('requestfailed', req => console.log(`BROWSER REQUEST FAILED: ${req.url()} - ${req.failure()?.errorText}`));

    await page.goto('/auth');
    // Wait a bit for js to run
    await page.waitForTimeout(5000);

    const content = await page.content();
    console.log('--- PAGE CONTENT START ---');
    // Log only body to keep it shorter
    console.log(await page.evaluate(() => document.body.innerHTML));
    console.log('--- PAGE CONTENT END ---');
});
