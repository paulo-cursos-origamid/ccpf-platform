# ADR-010 — Blueprint Composition

- **Status:** Aceito
- **Data:** 2026-07-10
- **Decisão:** Introduzir o conceito de composição de Blueprints na CCPF CLI.

---

# Contexto

Até o momento, cada Blueprint da CCPF CLI é responsável por gerar um único artefato.

Exemplos:

- Module
- Service
- Controller
- Repository
- Component
- Page

Embora essa abordagem seja simples, ela se torna limitada para cenários onde um único comando deve gerar uma estrutura completa composta por vários artefatos relacionados.

Por exemplo, a criação de um **Resource** no NestJS envolve a geração de diversos arquivos, como módulo, controller, service, DTOs e repository.

Executar esses Blueprints manualmente aumenta a complexidade e dificulta a padronização.

---

# Decisão

A CCPF CLI passará a suportar **Blueprints Compostos (Composite Blueprints)**.

Um Blueprint poderá ser composto por outros Blueprints, formando uma árvore de geração.

A composição será declarativa e descrita no próprio `blueprint.json`.

---

# Conceitos

## Blueprint Simples

Responsável por gerar apenas um artefato.

Exemplo:

- module
- service
- controller
- repository

Não possui dependências de geração.

---

## Blueprint Composto

Responsável por orquestrar a execução de outros Blueprints.

Não precisa possuir templates próprios.

Sua responsabilidade principal é definir quais Blueprints deverão ser executados e em qual ordem.

---

# Estrutura

Um Blueprint composto poderá declarar seus filhos utilizando a propriedade `children`.

Exemplo:

```json id="l2lq4n"
{
  "name": "resource",
  "platform": "nestjs",
  "children": ["module", "controller", "service", "repository"]
}
```

Cada item representa um Blueprint independente que será executado durante a geração.

---

# Fluxo de execução

Quando um Blueprint composto for solicitado, a CLI deverá:

1. carregar o Blueprint principal;
2. validar sua estrutura;
3. identificar os Blueprints filhos;
4. resolver dependências;
5. executar os filhos na ordem definida;
6. consolidar o resultado da geração.

---

# Papel do ArtifactGenerator

O `ArtifactGenerator` será responsável por identificar se um Blueprint é simples ou composto.

- Blueprints simples serão gerados diretamente.
- Blueprints compostos atuarão como orquestradores da geração.

Essa responsabilidade deverá permanecer transparente para quem utiliza a CLI.

---

# Resolução de dependências

Durante a execução, a CLI deverá resolver automaticamente os Blueprints referenciados em `children`.

Todos os Blueprints deverão existir e ser válidos antes do início da geração.

Caso algum Blueprint não seja encontrado, a geração deverá ser interrompida.

---

# Dependências circulares

Dependências circulares são proibidas.

Exemplo inválido:

```text id="zqkpv9"
resource
 └── module
      └── resource
```

A CLI deverá detectar esse cenário durante a validação e interromper a execução.

---

# Ordem de execução

A ordem declarada em `children` será preservada.

Exemplo:

```json id="s6z4qm"
{
  "children": ["module", "service", "controller", "repository"]
}
```

A execução seguirá exatamente essa sequência.

---

# Reutilização

Um Blueprint poderá ser reutilizado por diferentes Blueprints compostos.

Exemplo:

```text id="v0v07m"
resource
 ├── module
 ├── service
 └── controller

crud
 ├── module
 ├── service
 ├── controller
 ├── repository
 └── dto
```

Isso evita duplicação e incentiva a modularização.

---

# Extensibilidade

O modelo de composição permitirá futuras evoluções, como:

- Blueprints condicionais;
- parâmetros específicos para filhos;
- execução paralela;
- composição recursiva;
- plugins;
- presets;
- geração baseada em perfis.

---

# Benefícios

A composição de Blueprints proporciona:

- reutilização de artefatos;
- redução de duplicação;
- geração de estruturas completas;
- maior modularidade;
- facilidade para evolução da CLI;
- padronização da geração.

---

# Consequências

## Positivas

- Blueprints menores e mais reutilizáveis.
- Maior flexibilidade para criação de novos artefatos.
- Arquitetura extensível.
- Separação clara entre geração e orquestração.

## Negativas

- Maior complexidade na implementação da CLI.
- Necessidade de validação adicional.
- Controle mais rigoroso de dependências.

---

# Alternativas consideradas

## Duplicar templates

Não adotado.

Duplicar arquivos entre Blueprints aumenta o custo de manutenção e dificulta a evolução da plataforma.

---

## Executar comandos encadeados manualmente

Não adotado.

Essa abordagem transfere para o usuário a responsabilidade pela composição dos artefatos, reduzindo a produtividade e aumentando a chance de erros.

---

# Impacto

Esta decisão transforma a CCPF CLI em uma plataforma de automação baseada em composição, permitindo a criação de Blueprints reutilizáveis, escaláveis e capazes de gerar estruturas complexas de forma consistente.

---

# ADRs Relacionadas

- ADR-007 — Arquitetura da CLI da CCPF Platform
- ADR-008 — Organização dos Blueprints por Plataforma
- ADR-009 — Convenção Oficial para Blueprints da CCPF CLI
