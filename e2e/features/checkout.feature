@checkout @regression
Feature: Checkout
  Como usuario do site Automation Exercise
  Quero realizar uma compra
  Para adquirir produtos do site

  Background:
    Given um novo usuario esta logado
    And estou na pagina inicial
    When adiciono o primeiro produto ao carrinho
    And vou para o carrinho
    And prossigo para o checkout
    And preencho um comentario "Pedido de teste"
    And clico em realizar pedido

  @checkout-success @smoke
  Scenario: Checkout completo com sucesso
    When preencho os dados do cartao
    And confirmo o pagamento
    Then devo ver a mensagem de sucesso "Congratulations! Your order has been confirmed!"

  @checkout-empty-fields
  Scenario: Checkout com campos de pagamento vazios
    When deixo os campos do cartao vazios
    And confirmo o pagamento
    Then devo ver erro de campos obrigatorios

  @checkout-invalid-card
  Scenario: Checkout com numero de cartao invalido
    When preencho os dados do cartao com numero invalido
    And confirmo o pagamento
    Then devo ver a mensagem de sucesso "Congratulations! Your order has been confirmed!"
