"use client";

import { useState } from "react";

import styles from "./FAQ.module.scss";

const questions = [
  {
    question: "O que é um Espaço?",
    answer:
      "Espaço é o ambiente onde você organiza uma determinada realidade financeira. Ele pode representar sua vida pessoal, sua família, um projeto ou outro contexto.",
  },
  {
    question: "Posso compartilhar um Espaço?",
    answer:
      "Sim. O CCPF permite adicionar membros a um Espaço e controlar o nível de acesso de cada pessoa.",
  },
  {
    question: "O CCPF serve apenas para contas pessoais?",
    answer:
      "Não. A arquitetura foi pensada para diferentes domínios, como veículos, saúde, transportes e outras áreas que envolvam organização financeira.",
  },
  {
    question: "Quais serão os planos?",
    answer:
      "A estrutura comercial ainda está sendo construída. Os planos serão apresentados quando o sistema de assinaturas e cobrança estiver definido.",
  },
];

/**
 * Seção de perguntas frequentes da Landing Page.
 */
export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>FAQ</span>
          <h2>
            Perguntas
            <strong> frequentes.</strong>
          </h2>
        </div>

        <div className={styles.list}>
          {questions.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question} className={styles.item}>
                <button
                  type="button"
                  className={styles.question}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                >
                  <span>{item.question}</span>
                  <span className={styles.icon}>{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className={styles.answer}>
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
