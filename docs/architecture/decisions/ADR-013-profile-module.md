# ADR-013 — Profile Module

- **Status:** Proposto
- **Data:** 2026-08-28
- **Decisão:** Separar o contexto de Profile do contexto de Identity, mantendo os dados básicos de perfil no `User` durante o MVP.

---

# Contexto

O módulo **Identity** da CCPF Platform é responsável atualmente pelo ciclo de identidade e autenticação dos usuários.

O módulo já possui:

- Register;
- Login;
- Logout;
- Refresh Token;
- Current User (`/identity/me`);
- CRUD administrativo de usuários;
- Soft Delete;
- JWT Authentication;
- Authorization baseada em Roles;
- Cookies `httpOnly` para access token e refresh token.

A autenticação encontra-se funcional e o backend e frontend estão validando sem erros de TypeScript.

Com o fechamento do módulo Identity, surge a necessidade de disponibilizar funcionalidades relacionadas aos dados pessoais do usuário autenticado.

Essas responsabilidades não devem ser incorporadas ao módulo Identity, pois representam um contexto de negócio diferente.

---

# Problema

Identity e Profile possuem responsabilidades distintas.

**Identity** responde:

> Quem é o usuário e ele pode acessar o sistema?

Enquanto **Profile** responde:

> Quais são os dados pessoais e preferências do usuário autenticado?

Misturar essas responsabilidades faria com que o módulo Identity acumulasse regras que não pertencem diretamente ao contexto de autenticação e autorização.

Isso aumentaria o acoplamento e dificultaria a evolução futura do sistema.

---

# Decisão Arquitetural

Será criado um novo **Bounded Context denominado Profile**.

O módulo Profile será responsável pelo gerenciamento dos dados pessoais e, futuramente, das preferências do usuário autenticado.

Identity continuará sendo responsável pela identidade, autenticação e autorização.

A separação será mantida mesmo quando os dados utilizados pelo Profile estiverem armazenados na entidade `User` pertencente ao contexto Identity.

---

# Responsabilidades do Identity

O módulo Identity será responsável por:

- criação da identidade do usuário;
- autenticação;
- emissão de tokens;
- refresh de tokens;
- logout;
- validação da identidade;
- autorização;
- roles;
- estado de ativação da conta;
- verificação de e-mail;
- gerenciamento administrativo de usuários.

Exemplos:

```text
Register
Login
Logout
Refresh
Current User
User Administration
Roles
Authentication
Authorization
```

---

# Responsabilidades do Profile

O módulo Profile será responsável por:

- consulta dos dados pessoais do usuário autenticado;
- atualização dos dados pessoais;
- alteração do e-mail;
- alteração da senha;
- futuras preferências pessoais;
- futuras informações específicas de perfil.

Exemplos:

```text
Get My Profile
Update My Profile
Change Email
Change Password
```

---

# Diferença entre Identity e Profile

A separação conceitual será:

```text
Identity
    │
    ├── Quem é o usuário?
    ├── Como ele autentica?
    ├── Ele pode acessar?
    └── Quais permissões possui?
```

```text
Profile
    │
    ├── Quais são seus dados pessoais?
    ├── Qual nome deseja utilizar?
    ├── Qual e-mail deseja utilizar?
    └── Quais informações pessoais possui?
```

A regra arquitetural será:

> Identity representa a identidade e o acesso do usuário.
> Profile representa os dados e informações pessoais do usuário.

---

# Estrutura Modular

A estrutura seguirá o padrão definido pela ADR-010.

```text
modules/

├── identity/
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   └── presentation/
│
└── profile/
    ├── application/
    ├── domain/
    ├── infrastructure/
    └── presentation/
```

O Profile será tratado como um módulo de domínio independente.

---

# Estrutura Interna do Profile

A estrutura inicial deverá seguir:

```text
profile/

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

A estrutura poderá evoluir conforme novas responsabilidades forem adicionadas ao contexto.

---

# Bounded Context

Profile será considerado um **Bounded Context independente** dentro da CCPF Platform.

```text
┌─────────────────────────┐
│       Identity          │
│                         │
│ Authentication          │
│ Authorization           │
│ User Identity           │
└────────────┬────────────┘
             │
             │ authenticated user
             ▼
┌─────────────────────────┐
│        Profile          │
│                         │
│ Personal Data           │
│ Profile Management      │
│ Password Change         │
│ Preferences (future)    │
└─────────────────────────┘
```

A existência de uma relação entre os contextos não significa que eles devam compartilhar suas responsabilidades.

---

# Relação entre Profile e User

Durante o MVP, o módulo Profile utilizará o `User` existente no contexto Identity.

O modelo atual permanece conceitualmente:

```text
User
├── id
├── name
├── email
├── passwordHash
├── role
├── isActive
├── emailVerified
└── ...
```

O Profile não criará uma nova entidade de persistência neste primeiro momento.

O `User.id` será utilizado como identidade do usuário autenticado.

---

# Decisão sobre a tabela Profile

Durante o MVP, **não será criada uma tabela `Profile` separada**.

A decisão foi tomada porque os dados necessários inicialmente já pertencem ao `User`.

Isso evita:

- duplicação de dados;
- relacionamento desnecessário;
- complexidade adicional;
- migrações prematuras;
- sincronização entre `User` e `Profile`.

O módulo Profile funcionará como uma camada de negócio sobre os dados relevantes do usuário.

---

# Evolução futura

Caso o contexto Profile passe a possuir dados específicos que não pertençam conceitualmente à identidade, poderá ser criada uma entidade própria.

A estrutura futura poderá evoluir para:

```text
User
   │
   └── Profile
       ├── avatar
       ├── phone
       ├── birthDate
       ├── preferences
       └── ...
```

Essa evolução deverá ocorrer somente quando houver uma necessidade real de domínio.

A criação da entidade `Profile` deverá ser registrada em uma nova decisão arquitetural ou atualização desta ADR.

---

# MVP

O MVP do Profile disponibilizará os seguintes endpoints:

```text
GET   /api/v1/profile
PATCH /api/v1/profile
PATCH /api/v1/profile/password
```

---

# GET /api/v1/profile

Responsável por retornar os dados do perfil do usuário autenticado.

O endpoint não deverá receber o `userId` como parâmetro.

A identidade será obtida a partir do contexto de autenticação.

Exemplo conceitual:

```text
GET /api/v1/profile

Authenticated User
        │
        ▼
     Profile
        │
        ▼
   User data
```

---

# PATCH /api/v1/profile

Responsável pela atualização dos dados pessoais permitidos pelo Profile.

No MVP:

- nome;
- e-mail.

A alteração deverá respeitar as regras de negócio definidas pelo Identity quando envolver dados relacionados à identidade ou autenticação.

---

# PATCH /api/v1/profile/password

Responsável pela alteração da senha do usuário autenticado.

O processo deverá exigir:

```text
Senha atual
Nova senha
Confirmação da nova senha
```

A senha nunca deverá ser armazenada em texto puro.

A persistência continuará utilizando o mecanismo de hash definido pelo contexto Identity.

---

# Autenticação

Todos os endpoints do Profile serão protegidos por autenticação.

O usuário deverá possuir uma sessão válida para acessar o próprio Profile.

O mecanismo de autenticação continuará sendo o atualmente utilizado pela plataforma:

```text
JWT
   │
   ▼
httpOnly Cookie
   │
   ▼
Authentication Guard
   │
   ▼
Profile
```

O Profile não será responsável pela emissão ou renovação de tokens.

---

# Autorização

O Profile opera sobre o próprio usuário autenticado.

A regra principal será:

> Um usuário autenticado pode consultar e alterar somente os próprios dados de Profile.

Não será permitido utilizar o endpoint para manipular o perfil de outro usuário através de um `userId` arbitrário.

Operações administrativas sobre usuários continuarão pertencendo ao Identity.

---

# Relação com Identity

O Profile poderá depender de contratos públicos do Identity quando necessário, mas não deverá assumir responsabilidades internas de autenticação.

Exemplo conceitual:

```text
Profile
   │
   └── User Identity
```

Não será permitido que o Profile:

- gere JWT;
- valide diretamente regras internas de autenticação;
- gerencie refresh tokens;
- gerencie roles;
- implemente login;
- implemente logout.

Essas responsabilidades continuam pertencendo ao Identity.

---

# Regras de dependência

O Profile deverá respeitar as regras definidas pela arquitetura modular da plataforma.

Permitido:

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
```

O Profile não deverá acessar diretamente repositories ou detalhes de infraestrutura internos do Identity.

Quando uma dependência entre contextos for necessária, deverá existir um contrato explícito.

---

# Frontend

O frontend deverá disponibilizar uma área dedicada ao Profile:

```text
/dashboard/profile
```

A página será responsável pelo gerenciamento das informações pessoais e de segurança do usuário autenticado.

---

# Estrutura da interface

O MVP será dividido em duas áreas principais.

## Informações pessoais

```text
Informações pessoais

Nome
E-mail

[ Salvar alterações ]
```

Responsabilidades:

- visualizar nome;
- visualizar e-mail;
- editar nome;
- editar e-mail.

---

## Segurança

```text
Segurança

Senha atual
Nova senha
Confirmação da nova senha

[ Alterar senha ]
```

Responsabilidades:

- alterar senha;
- validar senha atual;
- confirmar nova senha.

---

# Funcionalidades futuras

Não fazem parte do MVP:

- avatar;
- sessões ativas;
- logout de todas as sessões;
- preferências;
- telefone;
- data de nascimento;
- timezone;
- idioma;
- preferências de interface;
- notificações.

Essas funcionalidades poderão ser incorporadas posteriormente ao contexto Profile.

---

# Convenções de Diretórios

O módulo deverá seguir a convenção estabelecida pela ADR-010.

```text
profile/

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

Os diretórios deverão utilizar `kebab-case`.

Classes deverão utilizar `PascalCase`.

Métodos e variáveis deverão utilizar `camelCase`.

---

# Geração via CLI

Quando a capacidade correspondente estiver disponível na CCPF CLI, o módulo Profile deverá ser gerado seguindo as convenções de:

- ADR-008 — Organização dos Blueprints;
- ADR-009 — Convenção Oficial para Blueprints;
- ADR-010 — Blueprint Composition;
- ADR-012 — Domain Module Structure.

A geração deverá produzir a estrutura modular definida nesta ADR.

Exemplo futuro:

```bash
ccpf generate module profile
```

ou, caso seja adotado o conceito de Resource Generator:

```bash
ccpf create resource profile
```

A implementação do comando não faz parte desta ADR.

---

# Benefícios

A separação entre Identity e Profile proporciona:

- responsabilidades claramente definidas;
- menor acoplamento;
- melhor aderência ao DDD;
- evolução independente dos contextos;
- maior facilidade de manutenção;
- estrutura compatível com a CLI;
- possibilidade de evolução futura para uma entidade `Profile`.

---

# Consequências Positivas

- Identity permanece focado em autenticação e autorização.
- Profile concentra regras relacionadas aos dados pessoais.
- O MVP evita complexidade desnecessária no banco.
- A arquitetura fica preparada para futuras informações específicas de perfil.
- Os endpoints ficam semanticamente organizados.
- A evolução futura pode ocorrer sem redefinir o contexto Identity.

---

# Consequências Negativas

- Existe uma separação lógica entre módulos que inicialmente utilizam a mesma entidade `User`.
- Algumas operações do Profile poderão depender de contratos fornecidos pelo Identity.
- A evolução para uma entidade `Profile` poderá exigir migração de dados no futuro.
- A equipe deverá respeitar cuidadosamente os limites entre os Bounded Contexts.

---

# Alternativas Consideradas

## Adicionar as funcionalidades diretamente ao Identity

Não adotado.

Essa abordagem faria o Identity acumular responsabilidades relacionadas a dados pessoais e preferências, aumentando o tamanho e o acoplamento do contexto.

---

## Criar uma tabela Profile imediatamente

Não adotado para o MVP.

Os dados necessários inicialmente já pertencem ao `User`, portanto a criação de uma nova tabela neste momento adicionaria complexidade sem benefício proporcional.

---

## Criar Profile como parte do User

Não adotado como estrutura arquitetural.

Embora `Profile` utilize dados do `User`, ele representa um contexto de negócio diferente e deve possuir limites claros.

---

# Impacto

Esta decisão estabelece oficialmente o **Profile** como um Bounded Context independente da CCPF Platform.

Durante o MVP, o contexto utilizará os dados básicos existentes no `User`, sem criar uma tabela `Profile` separada.

A arquitetura fica preparada para uma futura evolução quando surgirem dados e regras específicas de perfil que justifiquem uma entidade própria.

---

# ADRs Relacionadas

- ADR-001 — Estrutura da CCPF Platform como Monorepo
- ADR-007 — Arquitetura da CLI da CCPF Platform
- ADR-008 — Organização dos Blueprints por Plataforma
- ADR-009 — Convenção Oficial para Blueprints
- ADR-010 — Blueprint Composition
- ADR-011 — Backend Bootstrap Generator
- ADR-012 — Domain Module Structure
