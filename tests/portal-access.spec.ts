import { test, expect } from '@playwright/test';

/**
 * Testa acesso aos portais por role.
 * Testes com usuário real requerem:
 *   TEST_USER_EMAIL, TEST_USER_PASSWORD (aluno — profile_type = 'personal')
 *   TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD (admin — profile_type = 'admin')
 *
 * Sem essas variáveis, apenas os testes de redirecionamento rodam.
 */

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? '';
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? '';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? '';

const hasStudentCreds = !!TEST_USER_EMAIL && !!TEST_USER_PASSWORD;
const hasAdminCreds = !!TEST_ADMIN_EMAIL && !!TEST_ADMIN_PASSWORD;

// Helper para login
async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('seu@email.com').fill(email);
  await page.getByPlaceholder('Sua senha').fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 10000 });
}

test.describe('Portal do Aluno — Acesso', () => {
  test.skip(!hasStudentCreds, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');

  test('aluno logado acessa /portal/student', async ({ page }) => {
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/portal/student');
    await page.waitForLoadState('networkidle');

    // Não deve redirecionar para /auth
    await expect(page).not.toHaveURL(/\/auth/);

    // Deve mostrar conteúdo do portal do aluno
    await expect(
      page.getByText(/portal do aluno|histórico|notas|turmas/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('portal do aluno exibe nome do usuário', async ({ page }) => {
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/portal/student');
    await page.waitForLoadState('networkidle');

    // Avatar ou nome na sidebar/header
    const profileSection = page.locator('[data-testid="profile-name"], .avatar, [aria-label*="perfil"]');
    await expect(profileSection.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Panel — Controle de Acesso', () => {
  test('usuário não logado é bloqueado em /admin', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
  });

  test.skip(!hasAdminCreds, 'Defina TEST_ADMIN_EMAIL e TEST_ADMIN_PASSWORD');

  test('admin logado acessa painel /admin', async ({ page }) => {
    await login(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByText(/admin|painel|gestão|dashboard/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Navegação entre portais', () => {
  test.skip(!hasStudentCreds, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD');

  test('PortalRouter redireciona para portal correto por profile_type', async ({ page }) => {
    await login(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/portal');
    await page.waitForLoadState('networkidle');

    // /portal deve redirecionar para o portal correto baseado no profile_type
    await expect(page).not.toHaveURL(/^.*\/portal$/);
  });
});

test.describe('Invitation Flow', () => {
  test('rota /invitation/:id redireciona para login se não autenticado', async ({ page }) => {
    await page.goto('/invitation/some-institution-id');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/auth/);
  });
});
