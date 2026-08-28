# ADR-005 — Geração Baseada em Blueprints

## Status

**Aceito**

---

# Contexto

A CLI deverá criar módulos completos contendo Backend, Frontend, documentação e demais artefatos.

Escrever toda essa lógica diretamente nos comandos geraria forte acoplamento e dificultaria futuras alterações.

---

# Decisão

Toda geração será baseada em **Blueprints**.

Um Blueprint descreve a estrutura desejada, enquanto os Generators executam sua criação.

Fluxo:

```text
Blueprint

↓

Generator

↓

Filesystem
```

Os comandos não conhecerão detalhes da estrutura dos projetos.

---

# Consequências

## Positivas

* Estrutura altamente reutilizável.
* Facilidade para evoluir a arquitetura.
* Menor duplicação de código.

## Negativas

* Necessidade de uma camada adicional.

---

# Alternativas Consideradas

Gerar estruturas diretamente dentro dos comandos.

Descartado por aumentar o acoplamento.

---

# Revisão

Novos tipos de projetos deverão utilizar Blueprints.
