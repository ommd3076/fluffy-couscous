import { test, expect } from '@playwright/test';

test.describe('AR Portal Smoke Suite', () => {
  test('renders onboarding permission prompt on initial visit', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/AR Portal/i);

    // Verify main onboarding buttons exist
    const enableCameraBtn = page.getByRole('button', { name: /Enable Camera/i });
    const demoSimBtn = page.getByRole('button', { name: /Interactive Demo Simulation/i });

    await expect(enableCameraBtn).toBeVisible();
    await expect(demoSimBtn).toBeVisible();
  });

  test('launches interactive demo simulation successfully', async ({ page }) => {
    await page.goto('/?sim=1');

    // Canvas elements should mount
    const canvasContainer = page.locator('.three-canvas-container');
    await expect(canvasContainer).toBeAttached();

    // Guidance footer should appear
    const guidanceFooter = page.locator('.bottom-guidance');
    await expect(guidanceFooter).toBeVisible();
  });
});
