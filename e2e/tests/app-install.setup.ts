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

      // Fill each settings screen in whatever order the app presents them.
      // Detect the current screen by checking for a unique field.
      for (let screen = 0; screen < 3; screen++) {
        if (await page.getByRole('textbox', { name: 'Workday tenant Id (Generate access token)' }).isVisible({ timeout: 3000 }).catch(() => false)) {
          // Configuration 1 screen — tenant IDs, refresh token (Target Groups pre-filled)
          await page.getByRole('textbox', { name: 'Workday tenant Id (Generate access token)' }).fill('test-tenant-id');
          await page.getByRole('textbox', { name: 'Refresh token' }).fill('test-refresh-token');
          await page.getByRole('textbox', { name: 'Workday tenant Id (Get leavers data)' }).fill('test-tenant-id');
        } else if (await page.getByRole('textbox', { name: 'clientID' }).isVisible({ timeout: 3000 }).catch(() => false)) {
          // Workday generate access token screen — Name, Workday host, clientID, clientSecret
          await page.getByRole('textbox', { name: 'Name' }).fill('Workday Access Token');
          await page.getByRole('textbox', { name: 'Workday host' }).fill('https://wd2-impl.workday.com');
          await page.getByRole('textbox', { name: 'clientID' }).fill('test-client-id');
          await page.getByRole('textbox', { name: 'clientSecret' }).fill('test-client-secret');
        } else {
          // Workday get leavers data screen — Name, Workday host
          await page.getByRole('textbox', { name: 'Name' }).fill('Workday Get Leavers');
          await page.getByRole('textbox', { name: 'Workday host' }).fill('https://wd2-impl.workday.com');
        }

        if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await nextButton.click();
          await page.waitForLoadState('domcontentloaded').catch(() => {});
        }
      }
    },
  });
});
