# Arquitetura da CCPF CLI

## Visão Geral

A **CCPF CLI** é a ferramenta oficial de automação do ecossistema **CCPF (Centro de Controle Pessoal Financeiro)**.

Seu objetivo é automatizar tarefas repetitivas, padronizar a estrutura do projeto e garantir que todos os módulos sejam criados seguindo a arquitetura oficial do CCPF.

A CLI foi projetada para ser extensível, modular e de fácil manutenção, utilizando os princípios de **DDD Leve**, **SOLID** e **Command Pattern**.

---

# Objetivos da Arquitetura

A arquitetura da CLI foi projetada para atender aos seguintes objetivos:

* Separação clara de responsabilidades.
* Baixo acoplamento entre os componentes.
* Facilidade para adicionar novos comandos.
* Facilidade para criar novos geradores.
* Código altamente reutilizável.
* Padronização da estrutura dos projetos gerados.
* Evolução contínua sem necessidade de grandes refatorações.

---

# Princípios Arquiteturais

A CLI adota os seguintes princípios:

* DDD Leve
* SOLID
* Clean Code
* Command Pattern
* Template Based Generation
* Blueprint Driven Development
* Convention over Configuration

---

# DDD Leve

A CLI segue uma abordagem de **DDD Leve**.

Isso significa que utilizamos os conceitos de organização por domínio e responsabilidade sem adicionar complexidade desnecessária.

Não utilizaremos, por padrão:

* Domain Events
* Factories complexas
* Specifications
* Aggregates complexos
* Camadas excessivas

Cada módulo deve possuir apenas as responsabilidades necessárias para sua função.

---

# Estrutura do Projeto

```text
ccpf-cli/

docs/

src/

application/
domain/
infrastructure/

templates/

tests/
```

---

# Estrutura da Pasta `src`

```text
src/

application/
│
├── commands/
│
├── services/
│
└── use-cases/

domain/
│
├── contracts/
├── models/
└── value-objects/

infrastructure/
│
├── filesystem/
├── logger/
├── templates/
└── configuration/

generators/
│
├── backend/
├── frontend/
├── prisma/
└── documentation/

shared/
│
├── constants/
├── types/
└── utils/

index.ts
```

---

# Responsabilidades

## Application

Responsável por coordenar os comandos da CLI.

Não contém código de geração.

Exemplos:

* MakeCommand
* InitCommand
* DoctorCommand

---

## Domain

Representa os conceitos utilizados pela CLI.

Exemplos:

* Blueprint
* Generator
* Template
* ModuleDefinition

O domínio não conhece Node.js, Commander ou FileSystem.

---

## Infrastructure

Implementa detalhes técnicos.

Exemplos:

* leitura de arquivos
* escrita de arquivos
* criação de diretórios
* logs
* carregamento de templates

Toda dependência externa deve permanecer nesta camada.

---

## Generators

São responsáveis por gerar código.

Cada gerador possui apenas uma responsabilidade.

Exemplo:

```text
ModuleGenerator

↓

BackendGenerator

↓

FrontendGenerator

↓

DocumentationGenerator
```

Nenhum comando escreve arquivos diretamente.

---

## Templates

Todo código produzido pela CLI deve ser baseado em templates.

Exemplo:

```text
templates/

backend/

controller.hbs

service.hbs

entity.hbs
```

Nunca escreveremos código diretamente utilizando strings.

---

## Shared

Contém elementos compartilhados entre toda a aplicação.

Exemplos:

* tipos
* constantes
* funções utilitárias

Não deve conter regras de negócio.

---

# Fluxo da CLI

Todo comando seguirá exatamente o mesmo fluxo.

```text
Usuário

↓

Command

↓

Use Case

↓

Generator

↓

Template Engine

↓

Filesystem

↓

Projeto Gerado
```

---

# Fluxo do comando "make module"

```text
ccpf make module accounts

↓

MakeModuleCommand

↓

CreateModuleUseCase

↓

ModuleGenerator

↓

Blueprint

↓

Template Engine

↓

Filesystem

↓

backend/

frontend/

docs/
```

---

# Blueprints

Um Blueprint representa a estrutura completa que será criada.

Exemplo:

```text
Module Blueprint

Backend

Frontend

Documentação

Testes
```

O Blueprint apenas descreve o que deve existir.

Quem cria os arquivos é o Generator.

---

# Geradores

Cada gerador possui responsabilidade única.

Exemplo:

```text
ModuleGenerator

├── BackendGenerator

├── FrontendGenerator

├── DocumentationGenerator
```

Cada gerador conhece apenas sua parte da estrutura.

---

# Template Engine

A Template Engine é responsável por transformar templates em arquivos reais.

Fluxo:

```text
Template

↓

Variáveis

↓

Renderização

↓

Arquivo
```

Exemplo:

Template:

```text
{{moduleName}}Service
```

Resultado:

```text
AccountService
```

---

# FileSystem

O FileSystem encapsula todas as operações de disco.

Responsabilidades:

* criar diretórios
* copiar arquivos
* escrever arquivos
* verificar existência
* remover arquivos

Nenhum outro componente poderá acessar diretamente o módulo `fs` do Node.js.

---

# Arquivo de Configuração

A CLI utilizará um arquivo de configuração localizado na raiz do projeto.

Exemplo:

```text
ccpf.config.json
```

Esse arquivo define:

* localização do backend
* localização do frontend
* localização da documentação
* opções da CLI

Isso permite que a estrutura do projeto evolua sem alterar o código da ferramenta.

---

# Convenções

A CLI segue o princípio **Convention over Configuration**.

Sempre que possível, utilizará valores padrão definidos pela arquitetura oficial do CCPF.

A configuração será necessária apenas para personalizações.

---

# Escalabilidade

A arquitetura foi projetada para suportar novos recursos sem necessidade de grandes refatorações.

Exemplos futuros:

* plugins
* novos blueprints
* novos templates
* novos geradores
* novos comandos

---

# Benefícios da Arquitetura

* Alta organização.
* Baixo acoplamento.
* Alta coesão.
* Fácil manutenção.
* Fácil evolução.
* Reutilização de componentes.
* Padronização do ecossistema CCPF.
* Facilidade para novos colaboradores.

---

# Próximos Passos

Após a definição da arquitetura, os próximos documentos serão:

1. Convenções de desenvolvimento.
2. Roadmap oficial.
3. ADRs (Architecture Decision Records).
4. Documentação de referência.
5. Implementação incremental da CLI seguindo esta arquitetura.
