import { Page } from '@playwright/test';
import { E2E_BASE_URL } from '../support/config';

export class ProductsPage {
  // Locators
  private readonly searchInput = '#search_product';
  private readonly searchButton = '#submit_search';
  private readonly productsTitle = 'h2.title:has-text("All Products")';
  private readonly searchedProductsTitle = 'h2:has-text("Searched Products")';
  private readonly productsList = '.features_items';
  private readonly productItems = '.features_items .product-image-wrapper';
  private readonly categoryTitle = '.title';

  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto(`${E2E_BASE_URL}/products`);
  }

  async navigateToMenu(menu: string) {
    await this.page.goto(`${E2E_BASE_URL}/${menu.toLowerCase()}`);
  }

  async clickCategory(category: string) {
    await this.page.click(`a[href="#${category}"]`);
  }

  async clickSubcategory(subcategory: string) {
    const links = this.page.locator(`a:has-text("${subcategory}")`);
    const n = await links.count();
    for (let i = 0; i < n; i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        await link.click();
        return;
      }
    }
    throw new Error(`Nenhum link visivel para subcategoria: ${subcategory}`);
  }

  async search(term: string) {
    await this.navigate();
    await this.page.fill(this.searchInput, term);
    await this.page.click(this.searchButton);
  }

  async getProductsCount() {
    return this.page.locator(this.productItems).count();
  }

  getProductsTitle() {
    return this.page.locator(this.productsTitle);
  }

  getSearchedProductsTitle() {
    return this.page.locator(this.searchedProductsTitle);
  }

  getProductsList() {
    return this.page.locator(this.productsList);
  }

  getCategoryTitle() {
    return this.page.locator(this.categoryTitle);
  }
}
