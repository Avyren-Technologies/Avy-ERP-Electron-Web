import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const TEST_EMAIL = process.env.E2E_USER_EMAIL || 'admin@test.com';
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD || 'Test@123';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORAGE_STATE_PATH = path.join(__dirname, '../../.auth/company-admin.json');

setup('authenticate as company admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Wait for the login form to be visible
  await expect(page.getByText('Sign In').first()).toBeVisible({ timeout: 15_000 });

  // Fill login form using the actual placeholders
  // Email field: placeholder="name@company.com"
  const emailInput = page.getByPlaceholder('name@company.com');
  await emailInput.fill(TEST_EMAIL);

  // Password field: placeholder="••••••••"
  // Use locator by input type since bullet chars are fragile
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(TEST_PASSWORD);

  // Click Sign In button
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to app dashboard
  await page.waitForURL(/\/app\//, { timeout: 30_000 });

  // Verify we're logged in
  await expect(page).toHaveURL(/\/app\//);

  // Save storage state (includes localStorage with auth tokens)
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
