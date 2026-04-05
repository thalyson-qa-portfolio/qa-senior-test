import { expect, Page } from '@playwright/test';
import { E2E_BASE_URL } from '../support/config';

export class LoginPage {
  // Locators de login
  private readonly emailInput = 'input[data-qa="login-email"]';
  private readonly passwordInput = 'input[data-qa="login-password"]';
  private readonly loginButton = 'button[data-qa="login-button"]';
  private readonly loggedInMessage = 'a:has-text("Logged in as")';
  private readonly errorMessage = 'text=Your email or password is incorrect!';

  // Locators de signup
  private readonly signupNameInput = 'input[data-qa="signup-name"]';
  private readonly signupEmailInput = 'input[data-qa="signup-email"]';
  private readonly signupButton = 'button[data-qa="signup-button"]';
  private readonly signupPasswordInput = 'input[data-qa="password"]';
  private readonly addressInput = 'input[data-qa="address"]';
  private readonly createAccountButton = 'button[data-qa="create-account"]';

  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto(`${E2E_BASE_URL}/login`);
  }

  async fillEmail(email: string) {
    await this.page.fill(this.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.page.fill(this.passwordInput, password);
  }

  async clickLogin() {
    await this.page.click(this.loginButton);
  }

  async login(email: string, password: string) {
    await this.navigate();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
    await this.page.waitForSelector(this.loggedInMessage);
  }

  async createAccountViaAPI(email: string, password: string) {
    await this.page.request.post(`${E2E_BASE_URL}/api/createAccount`, {
      form: {
        name: 'Usuario Teste',
        email,
        password,
        title: 'Mr',
        birth_date: '10',
        birth_month: '5',
        birth_year: '1990',
        firstname: 'Usuario',
        lastname: 'Teste',
        company: 'Test Company',
        address1: 'Rua Teste 123',
        address2: '',
        country: 'United States',
        zipcode: '90001',
        state: 'California',
        city: 'Los Angeles',
        mobile_number: '123456789',
      },
    });
  }

  async isLoggedIn() {
    return this.page.locator(this.loggedInMessage).isVisible();
  }

  getLoggedInMessageLocator() {
    return this.page.locator(this.loggedInMessage);
  }

  getErrorMessageLocator() {
    return this.page.locator(this.errorMessage);
  }

  getEmailInput() {
    return this.page.locator(this.emailInput);
  }

  getPasswordInput() {
    return this.page.locator(this.passwordInput);
  }

  /** Ainda na rota de login (HTML5 ou erro de credenciais sem redirecionar). */
  async expectStillOnLoginPath() {
    await expect(this.page).toHaveURL(/\/login\b/i);
  }

  /** Fluxo de cadastro em /signup apos "Signup" na pagina de login. */
  async expectStillOnSignupPath() {
    await expect(this.page).toHaveURL(/\/signup\b/i);
  }

  /** Estado de sucesso de login nao deve aparecer em fluxos negativos. */
  async expectNotLoggedInUi() {
    await expect(this.page.locator(this.loggedInMessage)).not.toBeVisible();
  }

  async navigateToSignup() {
    await this.page.goto(`${E2E_BASE_URL}/login`);
    await this.page.fill(this.signupNameInput, 'Usuario Teste');
    await this.page.fill(this.signupEmailInput, `teste_${Date.now()}@email.com`);
    await this.page.click(this.signupButton);
    await this.page.waitForSelector(this.signupPasswordInput);
  }

  async fillSignupBasicData() {
    await this.page.fill(this.signupPasswordInput, 'Senha123!');
    await this.page.selectOption('select[data-qa="days"]', '10');
    await this.page.selectOption('select[data-qa="months"]', '5');
    await this.page.selectOption('select[data-qa="years"]', '1990');
    await this.page.fill('input[data-qa="first_name"]', 'Usuario');
    await this.page.fill('input[data-qa="last_name"]', 'Teste');
    await this.page.selectOption('select[data-qa="country"]', 'United States');
    await this.page.fill('input[data-qa="state"]', 'California');
    await this.page.fill('input[data-qa="city"]', 'Los Angeles');
    await this.page.fill('input[data-qa="zipcode"]', '90001');
    await this.page.fill('input[data-qa="mobile_number"]', '123456789');
  }

  async clearAddressField() {
    await this.page.fill(this.addressInput, '');
  }

  async clickCreateAccount() {
    await this.page.click(this.createAccountButton);
  }

  getAddressInput() {
    return this.page.locator(this.addressInput);
  }
}
