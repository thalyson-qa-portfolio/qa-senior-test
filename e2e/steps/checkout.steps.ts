import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/hooks';
import { CheckoutPage } from '../pages/CheckoutPage';

let checkoutPage: CheckoutPage;

const SUCCESS_TEXT = 'Congratulations! Your order has been confirmed!';

Given('estou na pagina inicial', async () => {
  checkoutPage = new CheckoutPage(page);
  await checkoutPage.navigateToHome();
});

When('adiciono o primeiro produto ao carrinho', async () => {
  await checkoutPage.addFirstProductToCart();
});

When('vou para o carrinho', async () => {
  await checkoutPage.goToCart();
});

When('prossigo para o checkout', async () => {
  await checkoutPage.proceedToCheckout();
});

When('preencho um comentario {string}', async (comentario: string) => {
  await checkoutPage.fillComment(comentario);
});

When('clico em realizar pedido', async () => {
  await checkoutPage.placeOrder();
});

When('preencho os dados do cartao', async () => {
  await checkoutPage.fillValidCardDetails();
});

When('confirmo o pagamento', async () => {
  await checkoutPage.confirmPayment();
});

Then('devo ver a mensagem de sucesso {string}', async (mensagem: string) => {
  await expect(page.locator(`text=${mensagem}`)).toBeVisible();
});

When('deixo os campos do cartao vazios', async () => {
  await checkoutPage.clearCardFields();
});

When('preencho os dados do cartao com numero invalido', async () => {
  await checkoutPage.fillInvalidCardDetails();
});

/**
 * Objetivo do assert: menos ambiguidade (escopo no form de pagamento), nao "corrigir" o demo.
 * @known_issue: o site pode ainda confirmar o pedido — cenario continua instavel por bug do demo.
 */
Then('o pagamento com cartao invalido deve ser recusado com mensagem de erro', async () => {
  await checkoutPage.expectOrderNotConfirmed(SUCCESS_TEXT);

  const scope = checkoutPage.getPaymentScope();
  const hasForm = (await scope.count()) > 0;
  const alvo = hasForm
    ? scope
    : checkoutPage.getPayButton().locator('xpath=ancestor::div[contains(@class,"modal")][1]');

  const erroNoEscopo = alvo.getByText(
    /invalid|incorrect|declined|failed|rejected|could not|unable to process|unsuccessful|card/i,
  );
  await expect(erroNoEscopo.first()).toBeVisible({ timeout: 5000 });
});

Then('devo ver erro de campos obrigatorios', async () => {
  await checkoutPage.expectOrderNotConfirmed(SUCCESS_TEXT);
  await expect(checkoutPage.getPayButton()).toBeVisible();

  const nome = checkoutPage.getNameOnCardInput();
  const numero = checkoutPage.getCardNumberInput();
  const cvc = checkoutPage.getCvcInput();
  const mes = checkoutPage.getExpiryMonthInput();
  const ano = checkoutPage.getExpiryYearInput();

  await expect(nome).toHaveAttribute('required', '');
  await expect(numero).toHaveAttribute('required', '');
  await expect(cvc).toHaveAttribute('required', '');
  await expect(mes).toHaveAttribute('required', '');
  await expect(ano).toHaveAttribute('required', '');

  // HTML5: submit bloqueado; pelo menos um campo reporta invalido (geralmente o primeiro vazio).
  const invalidos = await Promise.all(
    [nome, numero, cvc, mes, ano].map((loc) =>
      loc.evaluate((el: HTMLInputElement) => !el.validity.valid),
    ),
  );
  expect(invalidos.some(Boolean)).toBe(true);
});
