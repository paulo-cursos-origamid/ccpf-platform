# CCPF Platform

> Plataforma moderna para gerenciamento financeiro pessoal construída com DDD, Clean Architecture e automação via CLI.

---

## Visão Geral

A CCPF Platform é composta por múltiplas aplicações que compartilham uma arquitetura comum.

- API (NestJS)
- Web (Next.js)
- CLI própria
- Templates
- Documentação
- Infraestrutura

---

## Estrutura

```
apps/
packages/
docs/
infrastructure/
scripts/
```

---

## Aplicações

| Projeto | Descrição |
|----------|-----------|
| apps/api | Backend NestJS |
| apps/web | Frontend Next.js |
| apps/cli | CLI Oficial |

---

## Tecnologias

- TypeScript
- NestJS
- Next.js
- Prisma
- PostgreSQL
- Docker
- Handlebars
- Commander

---

## Arquitetura

A plataforma utiliza:

- DDD Leve
- SOLID
- Clean Architecture
- Modular Monolith
- Domain Driven Design

---

## Executando

```bash
docker compose up
```

---

## Documentação

Toda documentação encontra-se em:

```
docs/
```