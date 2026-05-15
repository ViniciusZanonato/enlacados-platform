import { test as base, Page } from '@playwright/test';

// Credenciais de teste — defina no .env ou passe via env vars ao rodar
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? '';

export class AuthPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth');
    await this.page.waitForLoadState('networkidle');
  }

  async fillLogin(email: string, password: string) {
    await this.page.getByPlaceholder('seu@email.com').fill(email);
    await this.page.getByPlaceholder('Sua senha').fill(password);
  }

  async submitLogin() {
    await this.page.getByRole('button', { name: /entrar/i }).click();
  }

  async loginAs(email: string, password: string) {
    await this.goto();
    await this.fillLogin(email, password);
    await this.submitLogin();
  }

  async waitForRedirectAfterLogin() {
    await this.page.waitForURL(url => !url.pathname.includes('/auth'), { timeout: 10000 });
  }
}

// Fixture estendido com AuthPage disponível em todos os testes
export const test = base.extend<{ authPage: AuthPage }>({
  authPage: async ({ page }, use) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(new AuthPage(page));
  },
});

export { expect } from '@playwright/test';
export { TEST_USER_EMAIL, TEST_USER_PASSWORD };
