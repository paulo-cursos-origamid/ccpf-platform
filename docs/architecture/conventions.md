# Convenções de Desenvolvimento

## Objetivo

Este documento define os padrões oficiais de desenvolvimento da **CCPF CLI**.

Todas as implementações devem seguir estas convenções para garantir consistência, legibilidade e facilidade de manutenção.

---

# Filosofia

A CLI segue alguns princípios fundamentais:

* Simplicidade
* Clareza
* Baixo acoplamento
* Alta coesão
* Responsabilidade única
* Reutilização
* Padronização

Sempre que houver dúvida entre duas soluções, deve-se escolher a mais simples que mantenha a arquitetura consistente.

---

# Idioma

## Código

Todo o código deve ser escrito em inglês.

Exemplos:

```text
Account
Vehicle
Expense
ModuleGenerator
CreateModuleCommand
```

Nunca utilizar nomes em português.

---

## Documentação

Toda a documentação oficial será escrita em português.

Exemplos:

* README
* Architecture
* ADRs
* Guias

---

## Commits

Todos os commits seguem o padrão Conventional Commits.

Exemplos:

```text
feat(cli): add module generator

fix(filesystem): create missing directory

docs(architecture): update blueprint flow

refactor(generator): simplify template rendering
```

---

# Estrutura de Pastas

A organização oficial da CLI é:

```text
src/

application/
domain/
infrastructure/
generators/
templates/
shared/
```

Nenhuma pasta nova deve ser criada sem necessidade.

---

# Convenção de Arquivos

## Commands

```text
make.command.ts

doctor.command.ts

init.command.ts
```

Sempre:

```text
nome.command.ts
```

---

## Generators

```text
module.generator.ts

backend.generator.ts

frontend.generator.ts
```

Sempre:

```text
nome.generator.ts
```

---

## Services

```text
template.service.ts

filesystem.service.ts
```

Sempre:

```text
nome.service.ts
```

---

## Interfaces

```text
generator.interface.ts

filesystem.interface.ts
```

Sempre:

```text
nome.interface.ts
```

---

## Types

```text
module-options.type.ts

template.type.ts
```

Sempre:

```text
nome.type.ts
```

---

## Constantes

```text
paths.constants.ts

templates.constants.ts
```

Sempre:

```text
nome.constants.ts
```

---

# Convenção de Classes

Todas as classes utilizam PascalCase.

Exemplo:

```text
ModuleGenerator

TemplateEngine

FilesystemService

CreateModuleCommand
```

---

# Convenção de Interfaces

Sempre iniciar com "I".

Exemplo:

```text
IGenerator

ITemplate

ICommand

IFileSystem
```

---

# Convenção de Métodos

Métodos devem iniciar com verbo.

Exemplo:

```text
create()

generate()

copy()

write()

render()

remove()

validate()
```

Evitar nomes genéricos.

Errado:

```text
process()

executeSomething()

handleStuff()
```

---

# Convenção de Variáveis

camelCase

```text
moduleName

templatePath

destinationPath
```

---

# Convenção de Constantes

UPPER_SNAKE_CASE

```text
DEFAULT_TEMPLATE_PATH

DEFAULT_ENCODING

CLI_VERSION
```

---

# Organização dos Commands

Cada comando possui apenas uma responsabilidade.

Exemplo:

```text
make

↓

module

↓

generator
```

Um comando nunca deve escrever arquivos diretamente.

---

# Organização dos Generators

Cada Generator possui uma única responsabilidade.

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

Nenhum Generator deve depender diretamente de outro Generator.

A coordenação deve ocorrer através dos casos de uso.

---

# Templates

Todo código gerado deve utilizar templates.

Nunca escrever código utilizando concatenação de strings.

Errado:

```ts
fs.writeFileSync(
  file,
  "export class UserService {}"
);
```

Correto:

```text
service.hbs

↓

Template Engine

↓

UserService
```

---

# Estrutura dos Templates

```text
templates/

backend/

frontend/

docs/

tests/
```

Cada template representa um único arquivo.

---

# Logging

Toda saída para o terminal deve passar pelo serviço de Logger.

Nunca utilizar diretamente:

```ts
console.log()
```

Exceção:

Durante prototipação inicial ou testes temporários.

---

# Filesystem

Nenhum componente poderá acessar diretamente o módulo `fs` do Node.js.

Todo acesso ao sistema de arquivos deverá ocorrer através do serviço de Filesystem.

Isso facilita testes e futuras alterações.

---

# Tratamento de Erros

Nunca lançar erros genéricos.

Errado:

```ts
throw new Error();
```

Preferir erros específicos e mensagens claras.

Exemplo:

```text
TemplateNotFoundError

InvalidConfigurationError

ModuleAlreadyExistsError
```

---

# Testes

Todo Generator deverá possuir testes.

Prioridade:

* Unitários
* Integração

Sempre que possível, utilizar diretórios temporários para validar a geração de arquivos.

---

# Dependências

Antes de adicionar uma nova dependência ao projeto, verificar:

* Existe alternativa nativa?
* A biblioteca está ativa?
* É amplamente utilizada?
* Resolve um problema real?

Evitar dependências desnecessárias.

---

# Organização do Código

Métodos longos devem ser divididos.

Classes grandes devem ser refatoradas.

Funções privadas devem representar passos internos da implementação.

---

# Arquitetura

Toda implementação deve respeitar a arquitetura oficial definida em:

```text
docs/architecture.md
```

Nenhuma implementação deve violar a separação entre:

* Application
* Domain
* Infrastructure

---

# Pull Requests

Antes de abrir um Pull Request, verificar:

* Código compilando.
* Testes executados.
* Lint sem erros.
* Documentação atualizada.
* ADR criada (quando aplicável).

---

# Objetivo Final

A CCPF CLI deve permanecer:

* Simples.
* Modular.
* Consistente.
* Escalável.
* Fácil de evoluir.
* Fácil de testar.
* Fácil de manter.

Toda contribuição deve respeitar essas convenções.
