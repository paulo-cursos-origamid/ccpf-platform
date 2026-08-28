# ADR-009 — Convenção Oficial para Blueprints da CCPF CLI

* **Status:** Aceito
* **Data:** 2026-07-10
* **Decisão:** Definir o padrão oficial para criação, organização, versionamento e validação de Blueprints da CCPF CLI.

---

# Contexto

A CCPF CLI utiliza **Blueprints** para gerar módulos, componentes, serviços, documentação e demais artefatos da plataforma.

Com o crescimento da quantidade de blueprints e o suporte a múltiplas tecnologias, tornou-se necessário estabelecer uma convenção oficial para garantir consistência, facilidade de manutenção e evolução da ferramenta.

Este documento define o contrato arquitetural que todos os blueprints da plataforma deverão seguir.

---

# Decisão

Todo blueprint deverá seguir uma estrutura padronizada, possuir metadados obrigatórios, respeitar as convenções de nomenclatura e ser compatível com o sistema de validação da CCPF CLI.

Nenhum blueprint poderá ser adicionado ao projeto sem atender às regras definidas neste ADR.

---

# Estrutura obrigatória

Todo blueprint deverá possuir a seguinte estrutura mínima:

```text
blueprints/

<artifact>/

├── blueprint.json
├── files/
├── README.md
└── schema.json
```

Dependendo da necessidade, poderão existir diretórios adicionais:

```text
blueprints/

<artifact>/

├── blueprint.json
├── files/
├── helpers/
├── assets/
├── tests/
├── README.md
└── schema.json
```

---

# Localização

Os blueprints deverão ser organizados por plataforma.

Exemplo:

```text
src/platform/

nestjs/
nextjs/
prisma/
docker/
github/
documentation/
```

Cada plataforma conterá exclusivamente seus próprios blueprints.

---

# Estrutura do blueprint.json

Todo blueprint deverá possuir um arquivo `blueprint.json`.

Campos obrigatórios:

```json
{
  "$schema": "1.0",
  "name": "module",
  "description": "Generate a NestJS module",
  "version": "1.0.0",
  "platform": "nestjs",
  "artifact": "module"
}
```

Campos opcionais poderão ser adicionados conforme evolução da especificação.

---

# Versionamento

Todo blueprint deverá informar sua versão.

Exemplo:

```json
{
  "version": "1.0.0"
}
```

O formato seguirá o padrão **Semantic Versioning (SemVer)**.

---

# Schema

Todo blueprint deverá informar sua versão de schema.

Exemplo:

```json
{
  "$schema": "1.0"
}
```

Mudanças incompatíveis exigirão uma nova versão do schema.

A CLI deverá validar a compatibilidade antes da geração.

---

# Convenção de nomenclatura

Os arquivos de template deverão utilizar placeholders claros e padronizados.

Exemplos:

```text
__name__.module.ts.hbs

__name__.service.ts.hbs

__name__.controller.ts.hbs

__name__.repository.ts.hbs
```

Evitar nomes genéricos como:

```text
module.ts

service.ts

template.ts
```

---

# Convenção dos templates

Todos os templates deverão utilizar a extensão:

```text
.hbs
```

O mecanismo oficial de renderização será baseado em **Handlebars**.

---

# Convenção dos helpers

Os helpers oficiais deverão seguir nomenclatura consistente.

Exemplos:

```text
camelCase

pascalCase

kebabCase

snakeCase

constantCase

upperCase

lowerCase

plural

singular
```

Helpers personalizados deverão ser registrados de forma centralizada.

---

# Convenção das variáveis

As variáveis utilizadas nos templates deverão possuir nomes simples e sem ambiguidade.

Exemplos:

```handlebars
{{name}}

{{pascalCase name}}

{{camelCase name}}

{{kebabCase name}}

{{plural name}}
```

Evitar lógica complexa dentro dos templates.

Toda transformação deverá ser realizada por helpers.

---

# Estrutura dos arquivos

Os arquivos gerados deverão preservar a estrutura definida pelo blueprint.

Exemplo:

```text
files/

src/

controllers/

services/

repositories/

dto/
```

A CLI será responsável apenas pela substituição das variáveis e criação dos diretórios.

---

# Validação

Todo blueprint deverá ser validado antes da geração.

A validação verificará:

* existência do `blueprint.json`;
* versão do schema;
* consistência dos metadados;
* existência dos arquivos de template;
* integridade da estrutura;
* variáveis utilizadas;
* compatibilidade com a CLI.

Caso alguma validação falhe, a geração deverá ser interrompida.

---

# Compatibilidade

A CLI deverá manter compatibilidade entre versões sempre que possível.

Blueprints compatíveis com o mesmo `$schema` deverão continuar funcionando sem alterações.

Mudanças incompatíveis deverão resultar em uma nova versão do schema.

---

# Checklist para novos blueprints

Antes de adicionar um novo blueprint ao projeto, verificar:

* Estrutura de diretórios correta.
* `blueprint.json` presente.
* `schema.json` presente.
* `README.md` presente.
* Templates organizados em `files/`.
* Helpers registrados.
* Schema válido.
* Versionamento definido.
* Compatibilidade verificada.
* Blueprint validado pela CLI.

---

# Benefícios

A adoção desta convenção proporciona:

* padronização dos blueprints;
* facilidade de manutenção;
* menor acoplamento;
* evolução previsível;
* validação automatizada;
* documentação consistente;
* melhor experiência para desenvolvedores.

---

# Consequências

## Positivas

* Todos os blueprints seguem o mesmo padrão.
* Facilidade para localizar problemas.
* Evolução controlada da plataforma.
* Redução de erros durante a geração.

## Negativas

* Necessidade de seguir regras mais rígidas.
* Pequeno aumento no esforço inicial para criação de novos blueprints.

---

# Alternativas consideradas

## Estrutura livre

Não adotada.

Embora ofereça maior flexibilidade, aumenta significativamente a possibilidade de inconsistências e dificulta a manutenção da plataforma.

---

## Convenções implícitas

Não adotadas.

As regras devem ser documentadas explicitamente para evitar interpretações diferentes entre desenvolvedores.

---

# Impacto

Este ADR estabelece a especificação oficial dos Blueprints da CCPF CLI.

A partir desta decisão, todos os blueprints existentes e futuros deverão seguir esta convenção, garantindo consistência, escalabilidade e facilidade de evolução da plataforma.

---

# ADRs Relacionadas

* ADR-001 — Estrutura da CCPF Platform como Monorepo
* ADR-002 — Estratégia de Compartilhamento entre Apps e Packages
* ADR-007 — Arquitetura da CLI da CCPF Platform
* ADR-008 — Organização dos Blueprints por Plataforma
