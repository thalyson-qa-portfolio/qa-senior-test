@login @regression
Feature: Login
  Como usuario do site Automation Exercise
  Quero fazer login na minha conta
  Para acessar funcionalidades exclusivas

  @login-valid @smoke
  Scenario: Login com credenciais validas
    Given um novo usuario foi cadastrado
    And estou na pagina de login
    When preencho o email do usuario cadastrado
    And preencho a senha do usuario cadastrado
    And clico no botao de login
    Then devo ver a mensagem "Logged in as"

  @login-invalid
  Scenario: Login com credenciais invalidas
    Given estou na pagina de login
    When preencho o email "email_invalido@email.com"
    And preencho a senha "senha_errada"
    And clico no botao de login
    Then devo ver a mensagem de erro "Your email or password is incorrect!"

  @login-empty-fields
  Scenario: Login com campos vazios
    Given estou na pagina de login
    When deixo os campos de login vazios
    And clico no botao de login
    Then devo ver erro de campo obrigatorio no login

  @signup-no-address
  Scenario: Cadastro sem preencher endereco
    Given estou na pagina de cadastro
    When preencho os dados basicos do cadastro
    And deixo o campo de endereco vazio
    And clico em criar conta
    Then devo ver erro de campo obrigatorio no endereco
