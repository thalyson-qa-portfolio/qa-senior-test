import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { page } from '../support/hooks';
import { ProductsPage } from '../pages/ProductsPage';

let productsPage: ProductsPage;

Given('estou na pagina de produtos', async () => {
  productsPage = new ProductsPage(page);
  await productsPage.navigate();
});

When('clico no menu {string}', async (menu: string) => {
  productsPage = new ProductsPage(page);
  await productsPage.navigateToMenu(menu);
});

When('clico na categoria {string}', async (categoria: string) => {
  await productsPage.clickCategory(categoria);
});

When('clico na subcategoria {string}', async (subcategoria: string) => {
  await productsPage.clickSubcategory(subcategoria);
});

When('pesquiso por {string}', async (termo: string) => {
  productsPage = new ProductsPage(page);
  await productsPage.search(termo);
});

Then('devo estar na pagina de produtos', async () => {
  await expect(productsPage.getProductsTitle()).toBeVisible();
});

Then('devo ver a lista de produtos', async () => {
  await expect(productsPage.getProductsList()).toBeVisible();
});

Then('devo ver produtos da categoria {string}', async (categoria: string) => {
  await expect(productsPage.getCategoryTitle()).toContainText(categoria);
});

Then('devo ver resultados da busca', async () => {
  await expect(productsPage.getSearchedProductsTitle()).toBeVisible();
});

Then('devo ver produtos relacionados a {string}', async (_termo: string) => {
  const count = await productsPage.getProductsCount();
  expect(count).toBeGreaterThan(0);
});
