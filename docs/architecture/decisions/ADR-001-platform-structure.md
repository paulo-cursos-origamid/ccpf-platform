# ADR-001 — Estrutura da CCPF Platform como Monorepo

- **Status:** Aceito
- **Data:** 2026-07-09
- **Decisão:** Arquitetura Monorepo para a CCPF Platform

---

## Contexto

A CCPF Platform está sendo desenvolvida como uma plataforma de software com capacidade de suportar múltiplas aplicações, ferramentas e produtos.

Inicialmente, o projeto possui como primeira aplicação o sistema financeiro **CCPF (Centro de Controle Pessoal Financeiro)**, porém a arquitetura deve permitir a evolução futura para novos produtos e módulos.

Com o crescimento esperado do ecossistema, tornou-se necessário definir uma estrutura organizada para:

- aplicações independentes;
- bibliotecas compartilhadas;
- ferramentas internas;
- documentação;
- infraestrutura;
- automações.

---

# Decisão

Foi decidido utilizar uma arquitetura baseada em **Monorepo**, onde todos os projetos relacionados à CCPF Platform serão mantidos em um único repositório.

A estrutura seguirá a separação:

- `apps` → aplicações executáveis;
- `packages` → códigos compartilhados;
- `docs` → documentação global da plataforma;
- `infrastructure` → recursos de infraestrutura;
- `scripts` → automações internas.

---

# Estrutura oficial

```text
ccpf-platform/

├── apps/
│   │
│   ├── cli/
│   │   ├── src/
│   │   ├── docs/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── backend/
│   │
│   ├── frontend/
│   │
│   └── future-applications/
│
├── packages/
│   │
│   ├── shared-types/
│   ├── config/
│   ├── ui/
│   └── utilities/
│
├── docs/
│   │
│   ├── architecture/
│   │   ├── decisions/
│   │   ├── diagrams/
│   │   └── overview.md
│   │
│   ├── development/
│   ├── roadmap/
│   └── README.md
│
├── infrastructure/
│
├── scripts/
│
├── package.json
└── README.md
```

---

# Justificativa

## 1. Monorepo

A escolha por Monorepo permite:

- versionamento centralizado;
- compartilhamento simples de código;
- padronização entre aplicações;
- melhor controle de dependências;
- evolução organizada da plataforma.

---

# 2. Apps separados

Cada aplicação possui seu próprio ciclo de desenvolvimento.

Exemplo:

```text
apps/

cli
 └── ferramenta de geração e automação

backend
 └── API NestJS

frontend
 └── aplicação web Next.js
```

Cada aplicação pode possuir:

- código próprio;
- dependências próprias;
- documentação específica;
- pipeline próprio.

---

# 3. CLI como plataforma

A CLI será considerada uma peça estratégica da CCPF Platform.

Responsabilidades:

- criação de novos módulos;
- geração de estruturas;
- padronização de projetos;
- criação de templates;
- automação de tarefas repetitivas.

A CLI funcionará como ferramenta oficial para manter consistência entre aplicações.

---

# 4. Packages compartilhados

Código reutilizável deve ser extraído para pacotes independentes.

Exemplos futuros:

```text
packages/

shared-types
 └── interfaces e contratos compartilhados

config
 └── configurações comuns

ui
 └── componentes compartilhados

utilities
 └── funções auxiliares
```

---

# 5. Produto financeiro como primeira aplicação

A primeira aplicação desenvolvida dentro da plataforma será:

## CCPF — Centro de Controle Pessoal Financeiro

Responsável por:

- controle financeiro pessoal;
- contas;
- receitas;
- despesas;
- categorias;
- dashboard financeiro;
- relatórios.

A aplicação financeira será construída utilizando a infraestrutura e padrões definidos pela plataforma.

---

# Consequências positivas

## Benefícios

- Arquitetura preparada para crescimento.
- Padronização entre projetos.
- Reutilização de código.
- Menor duplicação.
- Melhor manutenção.
- Base para criação de novos produtos.

---

# Consequências negativas

## Custos

- Maior complexidade inicial.
- Necessidade de disciplina organizacional.
- Gerenciamento de dependências mais cuidadoso.
- Necessidade de ferramentas adequadas para CI/CD.

---

# Alternativas consideradas

## Repositórios separados

Não adotado.

Motivos:

- duplicação de configurações;
- dificuldade de compartilhamento;
- menor controle da plataforma.

---

## Projeto único sem separação

Não adotado.

Motivos:

- baixa escalabilidade;
- mistura entre aplicações;
- dificuldade de evolução futura.

---

# Estado atual

A estrutura inicial da plataforma já segue esta decisão:

```text
ccpf-platform

apps/
 └── cli/

packages/

docs/

infrastructure/

scripts/
```

---

# Próximas decisões relacionadas

- ADR-002 — Estratégia de compartilhamento entre packages e aplicações.
- ADR-003 — Padrão de versionamento e releases.
- ADR-004 — Pipeline CI/CD da plataforma.
- ADR-005 — Estratégia de deploy e infraestrutura.
