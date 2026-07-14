# ADR-002 — Utilização do Command Pattern

## Status

**Aceito**

---

# Contexto

A CLI executará diversas operações, como criação de módulos, geração de código, inicialização de projetos e validações.

Centralizar toda essa lógica em um único arquivo dificultaria a manutenção e a evolução da ferramenta.

---

# Decisão

Cada comando será implementado de forma independente seguindo o **Command Pattern**.

Cada comando será responsável apenas por interpretar a entrada do usuário e delegar a execução para um caso de uso ou gerador.

Exemplo:

```text
ccpf make module accounts

↓

MakeModuleCommand

↓

CreateModuleUseCase

↓

ModuleGenerator
```

---

# Consequências

## Positivas

* Fácil manutenção.
* Baixo acoplamento.
* Facilidade para adicionar novos comandos.
* Código organizado.

## Negativas

* Maior quantidade de arquivos.

---

# Alternativas Consideradas

Implementar toda a CLI em um único arquivo utilizando condicionais.

Essa abordagem foi descartada devido à baixa escalabilidade.

---

# Revisão

Novos comandos deverão seguir este padrão.
