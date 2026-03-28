@navegacao @regression
Feature: Navegacao
  Como usuario do site Automation Exercise
  Quero navegar entre as paginas do site
  Para encontrar produtos e informacoes

  @nav-products @smoke
  Scenario: Navegar para a pagina de produtos
    Given estou na pagina inicial
    When clico no menu "Products"
    Then devo estar na pagina de produtos
    And devo ver a lista de produtos

  @nav-category
  Scenario: Navegar para uma categoria de produtos
    Given estou na pagina de produtos
    When clico na categoria "Women"
    And clico na subcategoria "Dress"
    Then devo ver produtos da categoria "Women - Dress Products"

  @nav-search
  Scenario: Buscar um produto
    Given estou na pagina inicial
    When pesquiso por "Blue Top"
    Then devo ver resultados da busca
    And devo ver produtos relacionados a "Blue Top"
