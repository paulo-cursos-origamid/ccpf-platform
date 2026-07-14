# ADR-001 — Adoção de DDD Leve

## Status

**Aceito**

---

# Contexto

O CCPF é um sistema de gestão financeira pessoal que possui múltiplos módulos e tendência de crescimento contínuo.

Durante o planejamento da arquitetura foram avaliadas duas abordagens:

* DDD Completo
* DDD Leve

O DDD Completo adicionaria uma quantidade significativa de abstrações, como Aggregates complexos, Factories, Specifications e Domain Events, aumentando a curva de aprendizado e a complexidade do código.

Para o contexto do projeto, essa complexidade não traz benefícios proporcionais.

---

# Decisão

A arquitetura oficial da CCPF CLI utilizará **DDD Leve**.

Cada módulo será organizado em camadas bem definidas:

* Application
* Domain
* Infrastructure

As responsabilidades serão separadas sem introduzir abstrações desnecessárias.

O foco será manter:

* simplicidade;
* legibilidade;
* baixo acoplamento;
* alta coesão.

---

# Consequências

## Positivas

* Código mais simples.
* Menor curva de aprendizado.
* Maior produtividade.
* Arquitetura consistente.
* Fácil manutenção.

## Negativas

* Alguns padrões avançados do DDD não serão utilizados inicialmente.
* Caso o domínio cresça significativamente, poderá ser necessário revisar determinadas decisões.

---

# Alternativas Consideradas

## DDD Completo

Vantagens:

* Grande poder de modelagem.
* Excelente para domínios extremamente complexos.

Desvantagens:

* Complexidade elevada.
* Muitas abstrações.
* Maior esforço de manutenção.

Foi descartado por não atender às necessidades atuais do projeto.

---

# Revisão

Esta decisão poderá ser revisada caso a complexidade do domínio aumente significativamente.
