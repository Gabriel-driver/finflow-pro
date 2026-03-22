import { test, expect } from '@playwright/test';

test.describe('Login Flow with 3D Effects', () => {
  test('should display login page with 3D animations', async ({ page }) => {
    await page.goto('/');

    // Check if login page loads
    await expect(page).toHaveTitle(/FinFlow/);

    // Check for 3D elements
    await expect(page.locator('.keyboard-grid')).toBeVisible();
    await expect(page.locator('.particle')).toHaveCount(12); // 12 particles

    // Check floating icons
    await expect(page.locator('text=💰')).toBeVisible(); // DollarSign
    await expect(page.locator('text=💳')).toBeVisible(); // CreditCard
    await expect(page.locator('text=🐷')).toBeVisible(); // PiggyBank
    await expect(page.locator('text=📈')).toBeVisible(); // TrendingUp
    await expect(page.locator('text=🛡️')).toBeVisible(); // Shield
    await expect(page.locator('text=📊')).toBeVisible(); // BarChart3

    // Check login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle login with valid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill login form
    await page.fill('input[type="email"]', 'duda@email.com');
    await page.fill('input[type="password"]', 'password');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('**/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill login form with wrong credentials
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
  });

  test('should toggle between login and signup', async ({ page }) => {
    await page.goto('/');

    // Initially shows login form
    await expect(page.locator('button[type="submit"]').locator('text=Entrar')).toBeVisible();

    // Click to switch to signup
    await page.click('text=Não tem conta? Criar agora');

    // Should show signup form
    await expect(page.locator('input[placeholder="Seu nome completo"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]').locator('text=Criar Conta')).toBeVisible();

    // Click back to login
    await page.click('text=Já tem uma conta? Entrar');

    // Should show login form again
    await expect(page.locator('button[type="submit"]').locator('text=Entrar')).toBeVisible();
  });

  test('should handle 3D card rotation on mouse move', async ({ page }) => {
    await page.goto('/');

    // Get the login card element
    const card = page.locator('.glass-card').first();

    // Move mouse over the card
    await card.hover();

    // Check if transform style is applied (rotation)
    const transform = await card.evaluate(el => window.getComputedStyle(el).transform);
    expect(transform).not.toBe('none'); // Should have rotation applied
  });

  test('should persist session after login', async ({ page, context }) => {
    await page.goto('/');

    // Login
    await page.fill('input[type="email"]', 'duda@email.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/');

    // Create new page in same context (simulates new tab)
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Should still be logged in (redirected to dashboard)
    await newPage.waitForURL('**/');
    await expect(newPage.locator('text=Dashboard')).toBeVisible();
  });

  test('should clear session on tab close simulation', async ({ page, context }) => {
    await page.goto('/');

    // Login
    await page.fill('input[type="email"]', 'duda@email.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/');

    // Simulate tab close by clearing sessionStorage
    await page.evaluate(() => {
      sessionStorage.clear();
    });

    // Refresh page
    await page.reload();

    // Should be redirected back to login
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should handle admin login', async ({ page }) => {
    await page.goto('/');

    // Login as admin (assuming admin user exists)
    await page.fill('input[type="email"]', 'admin@email.com');
    await page.fill('input[type="password"]', 'adminpass');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to admin page
    await page.waitForURL('**/admin');
    await expect(page.locator('text=Admin Panel')).toBeVisible();
  });
});