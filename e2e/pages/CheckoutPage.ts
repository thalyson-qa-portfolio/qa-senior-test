import { Page } from '@playwright/test';
import { E2E_BASE_URL } from '../support/config';

export class CheckoutPage {
  // Locators de produto
  private readonly productInfo = '.productinfo';
  private readonly addToCartButton = '.productinfo .add-to-cart';
  private readonly continueShoppingButton = 'button:has-text("Continue Shopping")';

  // Locators de carrinho
  private readonly viewCartLink = 'a[href="/view_cart"]';
  private readonly proceedToCheckoutButton = 'a:has-text("Proceed To Checkout")';
  private readonly commentField = 'textarea[name="message"]';
  private readonly placeOrderButton = 'a:has-text("Place Order")';

  // Locators de pagamento
  private readonly nameOnCardInput = 'input[data-qa="name-on-card"]';
  private readonly cardNumberInput = 'input[data-qa="card-number"]';
  private readonly cvcInput = 'input[data-qa="cvc"]';
  private readonly expiryMonthInput = 'input[data-qa="expiry-month"]';
  private readonly expiryYearInput = 'input[data-qa="expiry-year"]';
  private readonly payButton = 'button[data-qa="pay-button"]';

  constructor(private page: Page) {}

  async navigateToHome() {
    await this.page.goto(E2E_BASE_URL);
  }

  async addFirstProductToCart() {
    await this.page.hover(this.productInfo);
    await this.page.click(this.addToCartButton);
    await this.page.click(this.continueShoppingButton);
  }

  async goToCart() {
    await this.page.click(this.viewCartLink);
  }

  async proceedToCheckout() {
    await this.page.click(this.proceedToCheckoutButton);
  }

  async fillComment(comment: string) {
    await this.page.fill(this.commentField, comment);
  }

  async placeOrder() {
    await this.page.click(this.placeOrderButton);
  }

  async fillCardDetails(name: string, number: string, cvc: string, month: string, year: string) {
    await this.page.fill(this.nameOnCardInput, name);
    await this.page.fill(this.cardNumberInput, number);
    await this.page.fill(this.cvcInput, cvc);
    await this.page.fill(this.expiryMonthInput, month);
    await this.page.fill(this.expiryYearInput, year);
  }

  async fillValidCardDetails() {
    await this.fillCardDetails('Usuario Teste', '4111111111111111', '123', '12', '2030');
  }

  async fillInvalidCardDetails() {
    await this.fillCardDetails('Usuario Teste', '0000000000000000', '000', '01', '2020');
  }

  async clearCardFields() {
    await this.fillCardDetails('', '', '', '', '');
  }

  async confirmPayment() {
    await this.page.click(this.payButton);
  }

  getNameOnCardInput() {
    return this.page.locator(this.nameOnCardInput);
  }
}
