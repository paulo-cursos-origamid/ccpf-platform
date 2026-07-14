# CCPF CLI

> **Developer Toolkit oficial do projeto CCPF (Centro de Controle Pessoal Financeiro).**

A CCPF CLI é uma ferramenta de linha de comando desenvolvida para automatizar a criação, manutenção e padronização de projetos que utilizam a arquitetura do ecossistema CCPF.

Seu principal objetivo é reduzir tarefas repetitivas, garantir consistência entre os módulos e acelerar o desenvolvimento utilizando uma abordagem baseada em **DDD Leve**, **templates** e **blueprints**.

---

# Objetivos

- Automatizar a criação de módulos do Backend.
- Automatizar a criação de módulos do Frontend.
- Gerar estruturas seguindo o padrão oficial do projeto.
- Reduzir código repetitivo.
- Padronizar nomenclatura e organização.
- Facilitar a manutenção do sistema.
- Servir como ferramenta oficial de desenvolvimento do CCPF.

---

# Filosofia

A CLI não possui regras de negócio.

Sua responsabilidade é automatizar a geração de código e estruturas seguindo padrões previamente definidos.

Toda regra de negócio permanece na aplicação principal (Backend).

---

# Princípios

- DDD Leve
- SOLID
- Single Responsibility
- Command Pattern
- Template Based Generation
- Blueprint Driven Development
- Clean Code
- Convention over Configuration

---

# Arquitetura

A CLI é organizada em camadas para facilitar manutenção e evolução.

```text
Command
    │
    ▼
Generator
    │
    ▼
Blueprint
    │
    ▼
Template Engine
    │
    ▼
Filesystem
```

Cada camada possui uma única responsabilidade.

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

# Tecnologias

- Node.js
- TypeScript
- Commander.js
- Handlebars (Template Engine)

---

# Roadmap

Versão 0.1

- Fundação da CLI

Versão 0.2

- Core

Versão 0.3

- Sistema de Templates

Versão 0.4

- Backend Generator

Versão 0.5

- Frontend Generator

Versão 1.0

- CLI Oficial do CCPF

---

# Exemplo de Uso

Criar um módulo:

```bash
ccpf make module expenses
```

Criar uma entidade:

```bash
ccpf make entity Vehicle
```

Inicializar um projeto:

```bash
ccpf init
```

Validar a estrutura do projeto:

```bash
ccpf doctor
```

---

# Estrutura Gerada

Exemplo:

```text
backend/src/modules/accounts/

application/
domain/
infrastructure/
presentation/
```

---

# Documentação

A documentação oficial está organizada em:

- Architecture
- Conventions
- ADRs
- Reference
- Roadmap

---

# Licença

MIT License.
