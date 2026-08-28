# ADR-007 — Arquitetura da CLI da CCPF Platform

* **Status:** Aceito
* **Data:** 2026-07-10
* **Decisão:** Definir a CLI como ferramenta oficial de automação e padronização da CCPF Platform.

---

# Contexto

A CCPF Platform é uma plataforma composta por múltiplas aplicações e bibliotecas compartilhadas.

Com o crescimento do ecossistema, diversas tarefas passam a ser repetitivas, como:

* criação de módulos;
* geração de componentes;
* criação de páginas;
* geração de serviços;
* criação de entidades;
* padronização da estrutura de projetos;
* configuração de arquivos;
* automação de tarefas de desenvolvimento.

Executar essas atividades manualmente aumenta o risco de inconsistências e reduz a produtividade da equipe.

Para garantir padronização, produtividade e escalabilidade, torna-se necessário adotar uma ferramenta oficial de automação.

---

# Decisão

A CCPF Platform utilizará uma **CLI própria** como ferramenta oficial para automação e padronização do desenvolvimento.

A CLI será considerada uma aplicação da plataforma e ficará localizada em:

```text
apps/cli
```

Sua principal responsabilidade será automatizar tarefas recorrentes e garantir que todos os projetos sigam os padrões arquiteturais definidos.

---

# Objetivos

A CLI deverá:

* reduzir tarefas repetitivas;
* padronizar a estrutura dos projetos;
* acelerar a criação de novas funcionalidades;
* garantir consistência entre aplicações;
* facilitar a adoção da arquitetura da plataforma.

---

# Responsabilidades

A CLI será responsável por:

* gerar módulos;
* gerar componentes;
* gerar páginas;
* gerar serviços;
* gerar casos de uso;
* gerar entidades;
* gerar contratos;
* gerar testes;
* criar estruturas padronizadas;
* executar tarefas de manutenção;
* automatizar processos internos da plataforma.

---

# Estrutura

A aplicação será organizada seguindo os princípios de Clean Architecture.

```text
apps/cli/

src/

├── application/
│
├── core/
│
├── infrastructure/
│
├── presentation/
│
└── shared/
```

Cada camada possuirá responsabilidades bem definidas, reduzindo acoplamento e facilitando manutenção e testes.

---

# Templates

Todos os arquivos gerados pela CLI deverão ser baseados em templates oficiais da plataforma.

Esses templates garantirão:

* nomenclatura consistente;
* estrutura padronizada;
* organização uniforme;
* aderência às convenções do projeto.

---

# Extensibilidade

A arquitetura deverá permitir a inclusão de novos comandos sem modificar comandos existentes.

Cada comando será implementado como uma unidade independente, facilitando manutenção e evolução da ferramenta.

---

# Documentação

A documentação específica da CLI permanecerá dentro da própria aplicação.

Estrutura prevista:

```text
apps/cli/docs/

README.md

commands/

generators/

templates/

architecture/
```

A documentação da plataforma continuará centralizada em:

```text
docs/
```

---

# Benefícios

* Padronização entre aplicações.
* Maior produtividade.
* Redução de erros humanos.
* Facilidade para onboarding de novos desenvolvedores.
* Evolução consistente da plataforma.
* Automação de processos recorrentes.

---

# Consequências

## Positivas

* Desenvolvimento mais rápido.
* Menor duplicação de código.
* Estrutura uniforme em todos os projetos.
* Facilidade para evolução da plataforma.

## Negativas

* Necessidade de manutenção contínua da CLI.
* Investimento inicial maior para implementação.
* Evolução dos templates deve acompanhar a evolução da arquitetura.

---

# Alternativas consideradas

## Utilizar apenas scripts NPM

Não adotado.

Embora simples, scripts NPM não oferecem organização, extensibilidade e reutilização suficientes para uma plataforma em crescimento.

---

## Utilizar uma CLI de terceiros

Não adotado.

Ferramentas genéricas não atendem às necessidades específicas da CCPF Platform e limitam a automação de regras próprias do projeto.

---

# Impacto

Esta decisão estabelece a CLI como parte fundamental da plataforma, responsável por garantir produtividade, padronização e escalabilidade durante todo o ciclo de desenvolvimento da CCPF Platform.

---

# ADRs Relacionadas

* ADR-001 — Estrutura da CCPF Platform como Monorepo
* ADR-002 — Estratégia de Compartilhamento entre Apps e Packages
* ADR-005 — Geração Baseada em Blueprints
* ADR-006 — Utilização de Templates para Geração de Código
* ADR-008 — Organização dos Blueprints por Plataforma
* ADR-009 — Convenção Oficial para Blueprints
* ADR-010 — Blueprint Composition
* ADR-011 — Backend Bootstrap Generator
