import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/hooks';
import { LoginPage } from '../pages/LoginPage';

let userEmail: string;
let userPassword: string;
let loginPage: LoginPage;

Given('um novo usuario foi cadastrado', async () => {
  userEmail = `teste_${Date.now()}@email.com`;
  userPassword = 'Senha123!';
  loginPage = new LoginPage(page);
  await loginPage.createAccountViaAPI(userEmail, userPassword);
});

Given('um novo usuario esta logado', async () => {
  userEmail = `teste_${Date.now()}@email.com`;
  userPassword = 'Senha123!';
  loginPage = new LoginPage(page);
  await loginPage.createAccountViaAPI(userEmail, userPassword);
  await loginPage.login(userEmail, userPassword);
});

Given('estou na pagina de login', async () => {
  loginPage = new LoginPage(page);
  await loginPage.navigate();
});

When('preencho o email do usuario cadastrado', async () => {
  await loginPage.fillEmail(userEmail);
});

When('preencho a senha do usuario cadastrado', async () => {
  await loginPage.fillPassword(userPassword);
});

When('preencho o email {string}', async (email: string) => {
  await loginPage.fillEmail(email);
});

When('preencho a senha {string}', async (senha: string) => {
  await loginPage.fillPassword(senha);
});

When('clico no botao de login', async () => {
  await loginPage.clickLogin();
});

Then('devo ver a mensagem {string}', async (_mensagem: string) => {
  await expect(loginPage.getLoggedInMessageLocator()).toBeVisible();
});

Then('devo ver a mensagem de erro {string}', async (mensagem: string) => {
  await expect(page.locator(`text=${mensagem}`)).toBeVisible();
});

When('deixo os campos de login vazios', async () => {
  await loginPage.fillEmail('');
  await loginPage.fillPassword('');
});

Then('devo ver erro de campo obrigatorio no login', async () => {
  await expect(loginPage.getEmailInput()).toHaveAttribute('required', '');
});

Given('estou na pagina de cadastro', async () => {
  loginPage = new LoginPage(page);
  await loginPage.navigateToSignup();
});

When('preencho os dados basicos do cadastro', async () => {
  await loginPage.fillSignupBasicData();
});

When('deixo o campo de endereco vazio', async () => {
  await loginPage.clearAddressField();
});

When('clico em criar conta', async () => {
  await loginPage.clickCreateAccount();
});

Then('devo ver erro de campo obrigatorio no endereco', async () => {
  await expect(loginPage.getAddressInput()).toHaveAttribute('required', '');
});
