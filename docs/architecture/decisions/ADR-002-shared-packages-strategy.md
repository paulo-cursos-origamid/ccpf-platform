# ADR-002 — Estratégia de Compartilhamento entre Apps e Packages

* **Status:** Proposto
* **Data:** 2026-07-09
* **Decisão:** Organização e compartilhamento de código dentro da CCPF Platform

---

# Contexto

A CCPF Platform foi definida como um Monorepo contendo múltiplas aplicações dentro do diretório `apps` e bibliotecas compartilhadas dentro de `packages`.

Com o crescimento da plataforma, diferentes aplicações precisarão reutilizar:

* tipos;
* contratos;
* configurações;
* componentes;
* utilitários;
* padrões de desenvolvimento.

É necessário definir uma estratégia para evitar duplicação de código e manter uma arquitetura organizada.

---

# Decisão

A plataforma utilizará o princípio:

> Código compartilhado pertence a `packages`.
> Código específico pertence ao seu respectivo `app`.

A comunicação entre aplicações e bibliotecas seguirá uma arquitetura baseada em pacotes internos.

---

# Estrutura definida

```text
ccpf-platform/

apps/

├── cli/
│
├── backend/
│
└── frontend/


packages/

├── shared-types/
│
├── config/
│
├── utilities/
│
└── ui/
```

---

# Responsabilidade dos Apps

Aplicações possuem regras específicas do produto.

Exemplo:

```text
apps/backend

Responsável por:

- API REST
- regras de negócio
- autenticação
- persistência
- módulos financeiros
```

```text
apps/frontend

Responsável por:

- páginas
- componentes específicos
- experiência do usuário
- integração com API
```

```text
apps/cli

Responsável por:

- comandos
- geração de arquivos
- automações
- templates
```

---

# Responsabilidade dos Packages

Packages armazenam recursos reutilizáveis.

---

## shared-types

Responsável por contratos compartilhados.

Exemplo:

```text
packages/shared-types

User
Account
Transaction
Category
ApiResponse
Pagination
```

Uso:

```typescript
import { User } from "@ccpf/shared-types";
```

---

## config

Responsável por configurações comuns.

Exemplo:

```text
packages/config

eslint
typescript
prettier
environment
```

Objetivo:

Garantir que todos os projetos utilizem os mesmos padrões.

---

## utilities

Responsável por funções auxiliares.

Exemplo:

```text
packages/utilities

formatCurrency()
formatDate()
validateDocument()
```

---

## ui

Responsável por componentes visuais compartilhados.

Exemplo:

```text
packages/ui

Button
Modal
Input
Table
Charts
```

---

# Regras arquiteturais

## Regra 1

Apps podem importar packages.

Permitido:

```text
apps
 |
 v
packages
```

---

## Regra 2

Packages não podem depender de Apps.

Não permitido:

```text
packages
 |
 v
apps
```

---

## Regra 3

Packages devem ser independentes.

Um package não deve conhecer detalhes de negócio de uma aplicação específica.

---

# Dependência permitida

Exemplo correto:

```text
frontend
    |
    |
    v

shared-types
```

---

Exemplo incorreto:

```text
shared-types

    |
    |
    v

backend/modules/transactions
```

---

# Justificativa

Esta estratégia permite:

* reutilização de código;
* menor acoplamento;
* evolução independente;
* manutenção simplificada;
* crescimento da plataforma.

---

# Consequências positivas

* Código compartilhado centralizado.
* Menor duplicação.
* Padronização entre aplicações.
* Facilidade para criação de novos produtos.

---

# Consequências negativas

* Necessidade de controle de dependências.
* Maior organização inicial.
* Mudanças em packages podem impactar múltiplas aplicações.

---

# Alternativas consideradas

## Compartilhar código diretamente entre apps

Não adotado.

Motivos:

* cria acoplamento;
* dificulta manutenção;
* mistura responsabilidades.

---

## Duplicar código em cada aplicação

Não adotado.

Motivos:

* aumenta custo de manutenção;
* gera divergência entre implementações.

---

# Estado atual

A plataforma inicia com:

```text
packages/

shared-types/
config/
utilities/
ui/
```

Os packages serão criados conforme surgir necessidade real de compartilhamento.

---

# Próximas decisões relacionadas

* ADR-003 — Estratégia de versionamento e releases.
* ADR-004 — Pipeline CI/CD.
* ADR-005 — Infraestrutura e deploy.

