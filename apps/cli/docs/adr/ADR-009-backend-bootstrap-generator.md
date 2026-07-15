# ADR-009 — Backend Bootstrap Generator

* **Status:** Aceito
* **Data:** 2026-07-10
* **Decisão:** Introduzir o conceito de **Project Generator** na CCPF CLI, iniciando pela geração automatizada de projetos Backend baseados em NestJS.

---

# Contexto

Até o momento, a CCPF CLI é responsável pela geração de artefatos pertencentes a um projeto existente.

Exemplos:

* Modules
* Controllers
* Services
* DTOs
* Entities
* Repositories
* Use Cases
* Resources (Blueprints Compostos)

Com o início do desenvolvimento do backend da CCPF Platform, surgiu a necessidade de automatizar também a criação de um projeto NestJS completamente configurado, eliminando tarefas repetitivas executadas manualmente em todos os novos projetos.

Essa funcionalidade representa um novo nível de geração dentro da CLI.

Enquanto os Blueprints atuais geram arquivos pertencentes a um projeto existente, o novo gerador será responsável por criar um projeto completo.

---

# Problema

A criação manual de um novo backend exige diversas etapas repetitivas:

* criação do projeto NestJS;
* instalação de dependências;
* configuração do Prisma;
* configuração do Swagger;
* configuração do ConfigModule;
* configuração do ValidationPipe;
* configuração do Logger;
* configuração do Helmet;
* configuração do Compression;
* configuração do Cookie Parser;
* criação da estrutura arquitetural DDD;
* limpeza dos arquivos padrão do NestJS;
* criação dos arquivos iniciais do projeto.

Esse processo é demorado, sujeito a erros e dificulta a padronização entre projetos.

---

# Decisão

A CCPF CLI passará a suportar um novo tipo de gerador denominado **Project Generator**.

O primeiro Project Generator será o **BackendGenerator**, responsável por automatizar completamente a criação de um backend NestJS seguindo os padrões arquiteturais da plataforma.

O comando oficial será:

```bash id="w5a1uo"
ccpf create backend
```

ou

```bash id="gnjmjz"
ccpf create backend <project-name>
```

---

# Responsabilidades do BackendGenerator

O `BackendGenerator` deverá executar automaticamente todas as etapas necessárias para disponibilizar um backend pronto para desenvolvimento.

---

## 1. Criar a aplicação NestJS

Executar internamente:

```bash id="l1pnur"
nest new apps/backend
```

---

## 2. Instalar dependências

Instalar automaticamente todas as dependências oficiais da plataforma.

### Produção

* @nestjs/config
* @nestjs/swagger
* swagger-ui-express
* class-validator
* class-transformer
* cookie-parser
* helmet
* compression
* nestjs-pino
* pino
* pino-pretty
* prisma
* @prisma/client

### Desenvolvimento

* @types/cookie-parser
* @types/compression

---

## 3. Inicializar o Prisma

Executar automaticamente:

```bash id="4g9ml2"
npx prisma init
```

---

## 4. Limpar o projeto padrão

Remover arquivos gerados automaticamente pelo NestJS que não fazem parte da arquitetura da plataforma.

Exemplos:

```text id="5u2h8u"
app.controller.ts
app.service.ts
app.controller.spec.ts
```

---

## 5. Criar a estrutura arquitetural

Gerar automaticamente a estrutura base do projeto.

```text id="sx8jjd"
src/

├── application/
├── domain/
├── infrastructure/
├── presentation/
├── shared/
├── common/
├── config/
├── database/
└── modules/
```

---

## 6. Configurar o projeto

Preparar automaticamente:

* ConfigModule
* ValidationPipe
* Swagger
* Helmet
* Compression
* Cookie Parser
* Logger (Pino)

Gerando um `main.ts` padronizado conforme as convenções da plataforma.

---

## 7. Preparar o ambiente

Criar automaticamente:

```text id="cmw9h0"
.env.example
README.md
prisma/
```

Também deverão ser realizados os ajustes necessários no `.gitignore`.

---

# Nova Arquitetura da CLI

A introdução do `BackendGenerator` estabelece dois níveis distintos de geração dentro da CCPF CLI.

---

## Artifact Generators

Responsáveis pela geração de componentes pertencentes a um projeto existente.

Exemplos:

* Module Generator
* Controller Generator
* Service Generator
* DTO Generator
* Entity Generator
* Repository Generator
* Resource Generator

---

## Project Generators

Responsáveis pela criação de projetos completos.

Primeira implementação:

* Backend Generator

Futuras implementações poderão incluir:

* Frontend Generator
* Worker Generator
* Microservice Generator
* Library Generator
* Package Generator

---

# Fluxo de execução

```text id="mpim9u"
ccpf create backend

        │
        ▼

BackendGenerator

        │
        ▼

Nest CLI Adapter

        │
        ▼

Package Manager Adapter

        │
        ▼

Prisma Initializer

        │
        ▼

Project Cleaner

        │
        ▼

Backend Blueprint

        │
        ▼

Project Configurator

        │
        ▼

Backend pronto
```

---

# Objetivos

* eliminar tarefas repetitivas;
* padronizar todos os backends da plataforma;
* reduzir erros de configuração;
* acelerar o início de novos projetos;
* centralizar a configuração arquitetural na CLI;
* tornar a CLI a ferramenta oficial para criação de novos projetos.

---

# Benefícios

A adoção do `BackendGenerator` proporciona:

* bootstrap completo em poucos minutos;
* padronização da arquitetura;
* redução da curva de onboarding;
* centralização das decisões arquiteturais;
* reutilização da infraestrutura existente de Blueprints e Generators;
* maior produtividade para toda a equipe.

---

# Consequências

## Positivas

* Todos os backends passam a seguir a mesma arquitetura.
* Redução significativa de configurações manuais.
* Menor probabilidade de erros.
* Evolução centralizada da arquitetura da plataforma.
* Maior consistência entre projetos.

## Negativas

* A CLI passa a assumir responsabilidades adicionais.
* Evoluções da arquitetura exigirão atualização do `BackendGenerator`.
* A manutenção do bootstrap torna-se parte essencial da evolução da plataforma.

---

# Alternativas consideradas

## Manter a criação manual dos projetos

Não adotada.

Essa abordagem aumenta o tempo de configuração, favorece inconsistências entre projetos e dificulta a manutenção dos padrões arquiteturais.

---

## Utilizar apenas a Nest CLI

Não adotada.

Embora a Nest CLI seja responsável pela criação inicial do projeto, ela não contempla as convenções, dependências e configurações específicas da CCPF Platform.

---

# Impacto

Esta decisão introduz um novo conceito arquitetural na CCPF CLI: o **Project Generator**.

Enquanto os **Artifact Generators** continuam responsáveis pela geração de componentes internos de um projeto, os **Project Generators** passam a ser responsáveis pela criação de aplicações completas.

Essa separação estabelece uma arquitetura mais modular, escalável e preparada para futuras expansões da plataforma, consolidando a CCPF CLI como a ferramenta oficial de bootstrap, padronização e manutenção dos projetos da CCPF Platform.

---

# ADRs Relacionadas

* ADR-001 — Estrutura da CCPF Platform como Monorepo
* ADR-005 — Arquitetura da CLI da CCPF Platform
* ADR-006 — Organização dos Blueprints por Plataforma
* ADR-007 — Convenção Oficial para Blueprints da CCPF CLI
* ADR-008 — Blueprint Composition

