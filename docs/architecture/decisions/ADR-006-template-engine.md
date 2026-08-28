# ADR-006 — Utilização de Templates para Geração de Código

## Status

**Aceito**

---

# Contexto

A CLI será responsável por gerar grande quantidade de arquivos.

Escrever código utilizando concatenação de strings dificulta manutenção, leitura e evolução.

---

# Decisão

Todo código gerado pela CLI deverá ser produzido através de templates.

Os templates ficarão centralizados na pasta:

```text
templates/
```

A renderização será realizada por uma Template Engine.

Fluxo:

```text
Template

↓

Variáveis

↓

Template Engine

↓

Arquivo Final
```

---

# Consequências

## Positivas

* Facilidade para alterar padrões.
* Reutilização de código.
* Melhor organização.
* Separação entre lógica e estrutura.

## Negativas

* Necessidade de manter os templates sincronizados.

---

# Alternativas Consideradas

Gerar arquivos utilizando concatenação de strings.

Essa abordagem foi descartada por dificultar manutenção e testes.

---

# Revisão

Todo novo gerador deverá utilizar templates oficiais da CLI.
