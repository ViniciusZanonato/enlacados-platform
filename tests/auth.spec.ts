import { test, expect, AuthPage, TEST_USER_EMAIL, TEST_USER_PASSWORD } from './fixtures/auth.fixture';

// Seletor específico do botão de submit do form de login (não o "Entrar" da navbar)
const loginSubmitBtn = (page: Parameters<typeof test>[1] extends { page: infer P } ? P : never) =>
  page.locator('button[type="submit"]').filter({ hasText: /^entrar$/i });

test.describe('Auth Page — UI', () => {
  test('exibe formulário de login ao acessar /auth', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder('seu@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('Sua senha')).toBeVisible();
    // Botão de submit do form (não o "Entrar" da navbar)
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('exibe aba de cadastro ao clicar em "Criar conta"', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /cadastrar|criar conta|registrar/i }).click();

    await expect(page.getByPlaceholder(/nome completo|seu nome/i)).toBeVisible();
  });

  test('botão Google OAuth é visível', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});

test.describe('Auth Page — Validação de Formulário', () => {
  test('exibe erro ao submeter login com campos vazios', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Clica no botão de submit do form de login
    await page.locator('button[type="submit"]').first().click();

    // Aguarda mensagem de erro ou campo inválido (HTML5 validation ou toast)
    const hasToast = await page.getByText(/email|senha|obrigatório|inválido/i).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    const hasInvalidField = await page.locator(':invalid').count() > 0;

    expect(hasToast || hasInvalidField).toBeTruthy();
  });

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('seu@email.com').fill('usuario-invalido@teste.com');
    await page.getByPlaceholder('Sua senha').fill('senha-errada-123');
    await page.locator('button[type="submit"]').first().click();

    // Aguarda toast ou mensagem de erro de autenticação
    await expect(
      page.getByText(/credenciais|senha|email|inválido|incorrect|invalid/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('exibe erro de senha muito curta no cadastro', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /cadastrar|criar conta|registrar/i }).click();

    await page.getByPlaceholder(/nome completo|seu nome/i).fill('Usuário Teste');
    // Pegar o email do form de cadastro (diferente do de login)
    await page.getByPlaceholder(/seu@email\.com/i).last().fill('teste@exemplo.com');
    // Preenche senha e confirmação com valor curto para acionar validação
    const senhaFields = page.getByPlaceholder(/mínimo 6 caracteres/i);
    await senhaFields.first().fill('123');
    // Campo confirmar senha (segundo campo de senha)
    const allPasswordInputs = page.locator('input[type="password"]');
    await allPasswordInputs.last().fill('123');

    await page.locator('button[type="submit"]').last().click();

    // Toast de erro: senha muito curta OU senhas não coincidem (ambos são erros de validação válidos)
    await expect(
      page.getByText(/6 caracteres|senha|coincidem|mínimo/i).first()
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Auth Flow — Usuário Real', () => {
  test.skip(!TEST_USER_EMAIL, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD para rodar testes de login real');

  test('login com credenciais válidas redireciona para portal', async ({ authPage, page }) => {
    await authPage.loginAs(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await authPage.waitForRedirectAfterLogin();

    await expect(page).not.toHaveURL(/\/auth/);
  });

  test('logout limpa sessão e redireciona para home', async ({ authPage, page }) => {
    await authPage.loginAs(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await authPage.waitForRedirectAfterLogin();

    await page.getByRole('button', { name: /sair|logout/i }).click();

    await page.goto('/portal/student');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('usuário logado acessando /auth é redirecionado', async ({ authPage, page }) => {
    await authPage.loginAs(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await authPage.waitForRedirectAfterLogin();

    await page.goto('/auth');
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
