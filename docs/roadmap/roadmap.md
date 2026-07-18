# Roadmap

## Visão

A **CCPF CLI** será a ferramenta oficial de automação do ecossistema **CCPF (Centro de Controle Pessoal Financeiro)**.

Seu objetivo é acelerar o desenvolvimento, garantir padronização e automatizar tarefas repetitivas utilizando uma arquitetura baseada em DDD Leve, Blueprints e Templates.

Este roadmap apresenta a evolução planejada da ferramenta.

---

# Princípios

A evolução da CLI seguirá alguns princípios:

* Construção incremental.
* Funcionalidades pequenas e testáveis.
* Documentação antes da implementação.
* Arquitetura antes do código.
* Compatibilidade entre versões.

---

# Versão 0.1 — Fundação

## Objetivo

Criar a base da CLI.

### Funcionalidades

* Estrutura inicial do projeto.
* TypeScript.
* Node.js.
* Commander.
* Configuração ESM.
* Build.
* Primeiro comando.
* Organização das pastas.
* Documentação inicial.

### Status

✅ Concluído

---

# Versão 0.2 — Core

## Objetivo

Criar a infraestrutura interna da CLI.

### Funcionalidades

* Filesystem Service.
* Logger Service.
* Configuration Loader.
* Path Resolver.
* Template Engine.
* Sistema de Blueprints.
* Registro central de comandos.

### Status

🟡 Em desenvolvimento

---

# Versão 0.3 — Gerador de Módulos

## Objetivo

Automatizar a criação de módulos completos.

### Funcionalidades

Comando:

```bash id="vexmkl"
ccpf make module accounts
```

Gerar automaticamente:

* Backend.
* Frontend.
* Documentação.
* Estrutura inicial.

### Status

🔲 Planejado

---

# Versão 0.4 — Geradores Backend

## Objetivo

Criar todos os componentes do Backend.

### Funcionalidades

Comandos:

```bash id="ybowzm"
ccpf make entity

ccpf make repository

ccpf make service

ccpf make dto

ccpf make controller

ccpf make use-case
```

### Status

🔲 Planejado

---

# Versão 0.5 — Geradores Frontend

## Objetivo

Automatizar a criação de módulos do Frontend.

### Funcionalidades

```bash id="pfcq0x"
ccpf make page

ccpf make component

ccpf make hook

ccpf make service

ccpf make store
```

### Status

🔲 Planejado

---

# Versão 0.6 — Prisma

## Objetivo

Automatizar recursos relacionados ao banco de dados.

### Funcionalidades

```bash id="pld8k0"
ccpf make prisma-model

ccpf make migration

ccpf make seed
```

### Status

🔲 Planejado

---

# Versão 0.7 — Documentação

## Objetivo

Automatizar a documentação do projeto.

### Funcionalidades

```bash id="q5t0el"
ccpf make adr

ccpf make doc

ccpf make readme
```

### Status

🔲 Planejado

---

# Versão 0.8 — Qualidade

## Objetivo

Adicionar ferramentas de validação.

### Funcionalidades

```bash id="od8xeh"
ccpf doctor

ccpf lint

ccpf validate
```

Validações previstas:

* Estrutura do projeto.
* Configuração.
* Templates.
* Dependências.
* Convenções.

### Status

🔲 Planejado

---

# Versão 0.9 — Inicialização de Projetos

## Objetivo

Criar projetos completos utilizando a CLI.

### Funcionalidades

```bash id="9r2ywd"
ccpf init
```

Gerar automaticamente:

* Backend.
* Frontend.
* Docker.
* Prisma.
* Documentação.
* Configurações.
* Estrutura inicial.

### Status

🔲 Planejado

---

# Versão 1.0 — CLI Oficial

## Objetivo

Disponibilizar a primeira versão estável.

### Funcionalidades

* Todos os comandos principais implementados.
* Documentação completa.
* Testes automatizados.
* Publicação como pacote npm.
* Compatibilidade com o ecossistema CCPF.

### Status

🔲 Planejado

---

# Evoluções Futuras

Após a versão 1.0, estão previstas funcionalidades como:

* Plugins.
* Atualização automática de projetos.
* Marketplace de templates.
* Templates personalizados.
* Integração com IA para geração assistida.
* Suporte a múltiplos idiomas.
* Integração com Git.
* Geradores para testes automatizados.
* Geradores para pipelines de CI/CD.

---

# Critérios de Qualidade

Antes de cada versão, verificar:

* Testes passando.
* Documentação atualizada.
* ADRs registradas.
* Cobertura mínima definida.
* Compatibilidade com versões anteriores.

---

# Fluxo de Desenvolvimento

Cada funcionalidade seguirá o processo:

1. Definição da arquitetura.
2. Registro da decisão (ADR quando necessário).
3. Implementação.
4. Testes.
5. Documentação.
6. Revisão.
7. Publicação.

---

# Visão de Longo Prazo

A CCPF CLI deverá evoluir para ser a principal ferramenta de desenvolvimento do ecossistema CCPF, permitindo criar, manter e evoluir projetos com rapidez, consistência e qualidade.

O objetivo final é que um novo projeto CCPF possa ser iniciado e mantido utilizando exclusivamente a CLI, reduzindo tarefas manuais e garantindo que todas as aplicações sigam a arquitetura oficial do ecossistema.
