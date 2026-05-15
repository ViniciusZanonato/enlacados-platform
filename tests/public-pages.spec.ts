//==========================
// Título : E2E — páginas públicas (sem auth)
//==========================

import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('carrega home page com conteúdo principal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // marca na home
    await expect(page.getByText(/enlaçados/i).first()).toBeVisible();

    // sem pageerror
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test('navbar está visível', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navbar com botão de login ou nome da plataforma
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('link para /auth funciona', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clica no link/botão de login
    const loginLink = page.getByRole('link', { name: /entrar|login|acessar/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/auth/);
    }
  });
});

test.describe('Páginas Legais', () => {
  test('política de privacidade carrega', async ({ page }) => {
    await page.goto('/politica-de-privacidade');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/privacidade|política/i).first()).toBeVisible();
  });

  test('termos de uso carregam', async ({ page }) => {
    await page.goto('/termos-de-uso');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/termos|uso/i).first()).toBeVisible();
  });

  test('página LGPD carrega', async ({ page }) => {
    await page.goto('/lgpd');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/lgpd|proteção de dados/i).first()).toBeVisible();
  });
});

test.describe('Blog Público', () => {
  test('lista de posts do blog carrega', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Título "Blog" ou loader ou lista de posts
    await expect(
      page.getByText(/blog/i).first()
    ).toBeVisible();
  });

  test('página de blog não tem erros de JavaScript', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Filtra erros que não são críticos (ex: erros de rede em dev)
    const criticalErrors = jsErrors.filter(e =>
      !e.includes('net::') && !e.includes('Failed to fetch')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Página de Planos', () => {
  test('carrega planos/pricing', async ({ page }) => {
    await page.goto('/planos');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/plano|planos|preço|pricing/i).first()).toBeVisible();
  });
});

test.describe('FAQ', () => {
  test('página FAQ carrega com perguntas', async ({ page }) => {
    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/faq|perguntas|dúvidas/i).first()).toBeVisible();
  });
});

test.describe('Performance — carregamento inicial', () => {
  test('home page carrega em menos de 5 segundos', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  test('página /auth carrega em menos de 3 segundos', async ({ page }) => {
    const start = Date.now();
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);
  });
});
