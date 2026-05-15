import { test, expect } from '@playwright/test';

/**
 * Testa os route guards — todas as rotas protegidas devem redirecionar para /auth
 * quando o usuário não está autenticado.
 */

const PROTECTED_ROUTES = [
  '/perfil',
  '/portal/student',
  '/portal/professional',
  '/portal/institutional/dashboard',
  '/portal/cpa',
  '/social',
  '/chat',
  '/gamification',
  '/settings',
  '/dashboard/upload-students',
  '/dashboard/upload-history',
  '/calendario',
];

// Estas rotas exigem autenticação E role específico.
// Sem login, devem redirecionar para /auth (via ProtectedRoute → RoleRoute chain).
const ROLE_RESTRICTED_ROUTES = [
  '/portal/student',               // requer profile_type = personal
  '/portal/professional',          // requer profile_type = professional
  '/portal/institutional/dashboard', // requer profile_type = institutional
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/profiles',
];

const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/sobre',
  '/planos',
  '/contato',
  '/faq',
  '/blog',
  '/marketplace',
  '/politica-de-privacidade',
  '/termos-de-uso',
  '/lgpd',
];

test.describe('Route Guards — Usuário não autenticado', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`redireciona ${route} → /auth`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });
  }
});

test.describe('Role Guards — Usuário não autenticado (deve cair em /auth)', () => {
  for (const route of ROLE_RESTRICTED_ROUTES) {
    test(`bloqueia ${route} sem login`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });
  }
});

test.describe('Admin Route Guard — Usuário não autenticado', () => {
  for (const route of ADMIN_ROUTES) {
    test(`bloqueia acesso não autenticado a ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // Deve redirecionar para /auth (via RoleRoute → ProtectedRoute chain)
      await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
    });
  }
});

test.describe('Rotas Públicas — acessíveis sem autenticação', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`carrega ${route} sem redirect`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Não deve redirecionar para /auth
      // (exceto se a própria rota for /auth)
      if (route !== '/auth') {
        await expect(page).not.toHaveURL(/\/auth/);
      }

      // Página não deve ter crash (sem div de erro genérico)
      await expect(page.locator('body')).not.toBeEmpty();
    });
  }
});

test.describe('Página 404', () => {
  test('exibe página not found para rota inexistente', async ({ page }) => {
    await page.goto('/rota-que-nao-existe-xyz');
    await page.waitForLoadState('networkidle');

    // Deve mostrar "404" ou "Página Não Encontrada"
    await expect(
      page.getByText(/404|página não encontrada|not found/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});
