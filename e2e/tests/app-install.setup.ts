import { test as setup } from '@playwright/test';
import { AppBuilderPage, AppCatalogPage, config } from '@crowdstrike/foundry-playwright';

setup('install app', async ({ page }) => {
  setup.setTimeout(300000);
  const appBuilder = new AppBuilderPage(page);
  await appBuilder.disableWorkflowProvisioning(config.appName);

  const catalog = new AppCatalogPage(page);

  await catalog.installApp(config.appName, {
    configureSettings: async (page) => {
      const nextButton = page.getByRole('button', { name: 'Next setting' });

      // Screen 1: Workday get leavers data — Name, Workday host
      await page.getByRole('textbox', { name: 'Name' }).fill('Workday Get Leavers');
      await page.getByRole('textbox', { name: 'Workday host' }).fill('https://wd2-impl.workday.com');
      await nextButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});

      // Screen 2: Workday generate access token — Name, Workday host, clientID, clientSecret
      await page.getByRole('textbox', { name: 'Name' }).fill('Workday Access Token');
      await page.getByRole('textbox', { name: 'Workday host' }).fill('https://wd2-impl.workday.com');
      await page.getByRole('textbox', { name: 'clientID' }).fill('test-client-id');
      await page.getByRole('textbox', { name: 'clientSecret' }).fill('test-client-secret');
      await nextButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});

      // Screen 3: Setting 3 — tenant IDs, refresh token (Target Groups pre-filled)
      await page.getByRole('textbox', { name: 'Workday tenant Id (Generate access token)' }).fill('test-tenant-id');
      await page.getByRole('textbox', { name: 'Refresh token' }).fill('test-refresh-token');
      await page.getByRole('textbox', { name: 'Workday tenant Id (Get leavers data)' }).fill('test-tenant-id');
      await nextButton.click();
      await page.waitForLoadState('networkidle').catch(() => {});

      // Screen 4: Setting 4 — same fields as Screen 3 (Target Groups pre-filled)
      await page.getByRole('textbox', { name: 'Workday tenant Id (Generate access token)' }).fill('test-tenant-id');
      await page.getByRole('textbox', { name: 'Refresh token' }).fill('test-refresh-token');
      await page.getByRole('textbox', { name: 'Workday tenant Id (Get leavers data)' }).fill('test-tenant-id');

      // "Install app" button is visible on Screen 4
    },
  });
});
