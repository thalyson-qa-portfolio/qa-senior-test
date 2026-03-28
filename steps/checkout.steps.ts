import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/hooks';
import { CheckoutPage } from '../pages/CheckoutPage';

let checkoutPage: CheckoutPage;

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

Then('devo ver erro de campos obrigatorios', async () => {
  await expect(checkoutPage.getNameOnCardInput()).toHaveAttribute('required', '');
});
