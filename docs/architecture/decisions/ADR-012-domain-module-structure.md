# ADR-012 — Domain Module Structure

- **Status:** Aceito
- **Data:** 2026-08-28
- **Decisão:** Adotar uma estrutura modular baseada em Bounded Contexts, utilizando DDD Leve e separação entre Application, Domain, Infrastructure e Presentation.

---

# Contexto

A CCPF Platform é uma plataforma de software composta por múltiplos domínios de negócio que tendem a crescer de forma independente.

O sistema possui atualmente diferentes contextos, como:

- Identity;
- Profile;
- Accounts;
- Categories;
- Transactions;
- Transfers;
- Vehicles;
- Credit Cards;
- outros contextos que poderão surgir futuramente.

À medida que a plataforma cresce, manter todas essas responsabilidades em uma estrutura centralizada aumenta o acoplamento e dificulta a evolução do sistema.

A arquitetura precisa estabelecer uma forma consistente de organizar os módulos e seus respectivos limites de responsabilidade.

A ADR-003 — DDD Lightweight estabelece a adoção de DDD Leve como abordagem arquitetural da plataforma.

Esta ADR complementa essa decisão definindo a estrutura oficial dos módulos de domínio.

---

# Problema

Sem uma convenção formal para a organização dos módulos, diferentes partes da plataforma poderiam adotar estruturas diferentes.

Isso poderia resultar em:

- responsabilidades misturadas;
- dependências circulares;
- alto acoplamento;
- dificuldade de localização do código;
- regras de negócio espalhadas;
- dificuldade de testes;
- dificuldade de geração através da CCPF CLI;
- crescimento desorganizado da arquitetura.

É necessário estabelecer uma estrutura modular previsível e consistente.

---

# Decisão

A CCPF Platform adotará uma arquitetura modular baseada em **Bounded Contexts**.

Cada contexto de negócio deverá ser representado por um módulo independente dentro de:

```text
src/modules/
```

Cada módulo deverá seguir, inicialmente, quatro camadas principais:

```text
application/
domain/
infrastructure/
presentation/
```

A estrutura oficial será:

```text
src/

└── modules/
    ├── identity/
    ├── profile/
    ├── accounts/
    ├── categories/
    ├── transactions/
    ├── transfers/
    └── ...
```

Cada módulo será responsável pelo seu próprio domínio e deverá manter suas responsabilidades encapsuladas.

---

# Estrutura de um Módulo

A estrutura mínima será:

```text
module-name/

├── application/
├── domain/
├── infrastructure/
├── presentation/
└── module-name.module.ts
```

Exemplo:

```text
identity/

├── application/
├── domain/
├── infrastructure/
├── presentation/
└── identity.module.ts
```

---

# Application

A camada `application` contém os casos de uso da aplicação.

Responsabilidades:

- orquestrar operações;
- executar casos de uso;
- coordenar dependências;
- receber dados de entrada;
- retornar resultados;
- aplicar regras de aplicação.

Exemplo:

```text
application/

├── use-cases/
│   ├── login/
│   ├── register/
│   └── refresh-token/
│
└── dto/
```

A camada Application não deverá conter detalhes específicos de infraestrutura.

---

# Domain

A camada `domain` contém as regras e conceitos centrais do domínio.

Responsabilidades:

- entidades;
- value objects, quando necessários;
- contratos de repositories;
- regras de negócio;
- exceções de domínio.

Exemplo:

```text
domain/

├── entities/
├── repositories/
├── value-objects/
└── exceptions/
```

A camada Domain deverá permanecer independente de frameworks e detalhes de infraestrutura sempre que possível.

---

# Infrastructure

A camada `infrastructure` contém implementações técnicas necessárias para executar o domínio.

Responsabilidades:

- persistência;
- implementação de repositories;
- integração com banco de dados;
- serviços externos;
- adapters;
- mecanismos técnicos.

Exemplo:

```text
infrastructure/

├── repositories/
├── persistence/
└── adapters/
```

Infrastructure poderá depender de Domain e Application conforme a necessidade da implementação, mas o Domain não deverá depender de Infrastructure.

---

# Presentation

A camada `presentation` representa a interface de entrada do módulo.

No backend HTTP, normalmente será composta por:

- Controllers;
- Requests;
- Responses;
- decorators específicos de apresentação;
- validações relacionadas à entrada HTTP.

Exemplo:

```text
presentation/

├── controllers/
├── requests/
└── responses/
```

A Presentation deverá delegar a execução para a camada Application.

Controllers não deverão concentrar regras de negócio.

---

# Fluxo Arquitetural

O fluxo padrão de uma operação será:

```text
HTTP Request

     ↓

Presentation

     ↓

Application

     ↓

Domain

     ↓

Infrastructure

     ↓

Database / External Service
```

Exemplo:

```text
PATCH /profile

      ↓

ProfileController

      ↓

UpdateProfileUseCase

      ↓

Profile / User domain rules

      ↓

UserRepository

      ↓

Prisma

      ↓

PostgreSQL
```

---

# Bounded Contexts

Cada módulo representa um limite de negócio.

Exemplo:

```text
modules/

├── identity/
├── profile/
├── accounts/
├── categories/
├── transactions/
├── transfers/
├── vehicles/
└── credit-cards/
```

Cada contexto deverá possuir:

- linguagem própria;
- responsabilidades próprias;
- regras próprias;
- casos de uso próprios;
- contratos próprios.

Um módulo não deverá acessar indiscriminadamente a implementação interna de outro módulo.

---

# Limites entre Módulos

Os módulos deverão se comunicar através de contratos explícitos.

Exemplo conceitual:

```text
Profile
   │
   ▼
Identity Contract
```

Evitar:

```text
Profile
   │
   ▼
Identity Infrastructure
   │
   ▼
Prisma Repository
```

O acesso direto à infraestrutura de outro módulo aumenta o acoplamento e viola os limites do Bounded Context.

---

# Dependências

As dependências deverão seguir uma direção previsível.

Dentro do módulo:

```text
Presentation
      ↓
Application
      ↓
Domain
      ↑
Infrastructure
```

De forma conceitual:

```text
Presentation → Application → Domain
Infrastructure → Domain
```

O Domain não deverá conhecer:

- Controllers;
- HTTP;
- Prisma;
- NestJS;
- banco de dados;
- detalhes de infraestrutura.

---

# DDD Leve

A arquitetura não adotará todas as abstrações existentes no DDD completo.

Não será obrigatório utilizar:

- Aggregates complexos;
- Factories;
- Specifications;
- Domain Events;
- Domain Services;
- Value Objects para todos os atributos.

Esses mecanismos poderão ser utilizados quando houver necessidade real de domínio.

A regra será:

> Utilizar DDD onde ele agrega valor, evitando abstrações artificiais.

Essa decisão está alinhada com a ADR-003 — DDD Lightweight.

---

# Convenções de Diretórios

Os diretórios deverão utilizar `kebab-case`.

Exemplos:

```text
use-cases/
value-objects/
repositories/
controllers/
```

Nomes de arquivos deverão seguir o padrão estabelecido pelo projeto.

Exemplos:

```text
profile.module.ts
profile.controller.ts
update-profile.use-case.ts
user.repository.ts
```

Classes deverão utilizar `PascalCase`.

Exemplo:

```text
ProfileController
UpdateProfileUseCase
UserRepository
```

Métodos e variáveis deverão utilizar `camelCase`.

---

# NestJS Module

Cada Bounded Context deverá possuir seu próprio módulo NestJS.

Exemplo:

```text
profile/
└── profile.module.ts
```

O módulo será responsável por registrar:

- controllers;
- providers;
- use cases;
- repositories;
- adapters;
- dependências necessárias ao contexto.

---

# Relação com a CCPF CLI

A estrutura modular deverá ser compatível com a geração automatizada através da CCPF CLI.

A CLI deverá ser capaz de gerar a estrutura inicial de um módulo respeitando esta ADR.

Exemplo conceitual:

```text
ccpf generate module profile

        ↓

modules/profile/

├── application/
├── domain/
├── infrastructure/
├── presentation/
└── profile.module.ts
```

A geração poderá utilizar:

- Artifact Generators;
- Blueprints;
- Blueprint Composition;

conforme definido nas ADRs da CCPF CLI.

---

# Blueprints

A estrutura de módulos deverá ser representada através dos Blueprints oficiais da plataforma quando houver geração automatizada.

A organização dos Blueprints deverá seguir:

- ADR-005 — Blueprint-Based Generation;
- ADR-006 — Template Engine;
- ADR-008 — Blueprints Organization;
- ADR-009 — Blueprint Convention;
- ADR-010 — Blueprint Composition.

A CLI não deverá possuir estruturas de módulos codificadas diretamente dentro dos comandos.

---

# Relação com o Monorepo

A estrutura modular ocorre dentro das aplicações da plataforma.

Conceitualmente:

```text
CCPF Platform

├── apps/
│   ├── api/
│   │   └── src/
│   │       └── modules/
│   │
│   ├── web/
│   │
│   └── cli/
│
├── packages/
│
└── docs/
```

O módulo de domínio pertence à aplicação que implementa aquele contexto.

Packages compartilhados deverão conter apenas funcionalidades realmente compartilháveis e não deverão ser utilizados para esconder dependências entre Bounded Contexts.

---

# Exemplo — Identity

```text
modules/
└── identity/

    ├── application/
    │   ├── use-cases/
    │   └── dto/
    │
    ├── domain/
    │   ├── entities/
    │   ├── repositories/
    │   └── exceptions/
    │
    ├── infrastructure/
    │   ├── repositories/
    │   └── auth/
    │
    ├── presentation/
    │   ├── controllers/
    │   ├── requests/
    │   └── responses/
    │
    └── identity.module.ts
```

---

# Exemplo — Profile

```text
modules/
└── profile/

    ├── application/
    │   ├── use-cases/
    │   └── dto/
    │
    ├── domain/
    │   ├── entities/
    │   ├── repositories/
    │   └── exceptions/
    │
    ├── infrastructure/
    │   └── repositories/
    │
    ├── presentation/
    │   ├── controllers/
    │   ├── requests/
    │   └── responses/
    │
    └── profile.module.ts
```

O Profile poderá utilizar informações fornecidas pelo Identity através de contratos, sem assumir suas responsabilidades internas.

---

# Regras Arquiteturais

As seguintes regras são estabelecidas:

1. Cada Bounded Context deverá possuir seu próprio módulo.
2. Cada módulo deverá manter suas responsabilidades encapsuladas.
3. Controllers não deverão conter regras de negócio.
4. Regras de negócio deverão permanecer no Domain.
5. Casos de uso deverão permanecer na Application.
6. Implementações técnicas deverão permanecer na Infrastructure.
7. O Domain não deverá depender de Infrastructure.
8. Um módulo não deverá acessar diretamente a infraestrutura interna de outro módulo.
9. Dependências entre contextos deverão utilizar contratos explícitos.
10. A estrutura deverá ser compatível com geração através da CCPF CLI.
11. DDD deverá ser aplicado de forma pragmática.
12. Novas abstrações deverão ser introduzidas somente quando justificadas pelo domínio.

---

# Consequências Positivas

- Organização previsível do código.
- Limites claros entre contextos.
- Menor acoplamento.
- Maior coesão.
- Facilidade de manutenção.
- Facilidade de testes.
- Evolução independente dos módulos.
- Compatibilidade com geração automatizada.
- Facilita onboarding de novos desenvolvedores.
- Preparação para crescimento da plataforma.

---

# Consequências Negativas

- Maior quantidade de diretórios e arquivos.
- Necessidade de disciplina arquitetural.
- Algumas funcionalidades simples podem parecer mais complexas inicialmente.
- Comunicação entre contextos exige contratos explícitos.
- Mudanças arquiteturais podem exigir alterações em mais de um módulo.

---

# Alternativas Consideradas

## Estrutura por tipo técnico

Exemplo:

```text
controllers/
services/
repositories/
entities/
```

Não adotada.

Essa estrutura agrupa componentes técnicos em vez de agrupar responsabilidades de negócio, aumentando o acoplamento entre contextos.

---

## Arquitetura totalmente flat

Exemplo:

```text
src/
├── controllers/
├── services/
├── repositories/
└── entities/
```

Não adotada.

Essa abordagem não oferece limites adequados para uma plataforma com múltiplos domínios.

---

## DDD Completo

Não adotado como padrão obrigatório.

A CCPF Platform utiliza DDD Leve conforme estabelecido pela ADR-003.

Padrões avançados poderão ser introduzidos quando o domínio justificar.

---

# Evolução Futura

A estrutura poderá evoluir conforme a complexidade da plataforma aumente.

Possíveis evoluções:

```text
domain/
├── aggregates/
├── domain-events/
├── specifications/
├── services/
└── value-objects/
```

Essas estruturas não são obrigatórias no MVP.

A introdução de novas abstrações deverá ser motivada por necessidades reais do domínio.

---

# Impacto

Esta ADR estabelece a estrutura oficial dos módulos de domínio da CCPF Platform.

A partir desta decisão:

```text
Bounded Context
      ↓
Module
      ↓
Application
Domain
Infrastructure
Presentation
```

passa a ser o padrão arquitetural para novos módulos da plataforma.

A estrutura também fornece a base necessária para que a CCPF CLI possa gerar módulos de forma consistente e automatizada.

---

# ADRs Relacionadas

- ADR-001 — Estrutura da CCPF Platform como Monorepo
- ADR-002 — Estratégia de Compartilhamento entre Apps e Packages
- ADR-003 — Adoção de DDD Leve
- ADR-005 — Geração Baseada em Blueprints
- ADR-006 — Utilização de Templates para Geração de Código
- ADR-007 — Arquitetura da CLI da CCPF Platform
- ADR-008 — Organização dos Blueprints por Plataforma
- ADR-009 — Convenção Oficial para Blueprints da CCPF CLI
- ADR-010 — Blueprint Composition
- ADR-011 — Backend Bootstrap Generator
- ADR-013 — Profile Module
