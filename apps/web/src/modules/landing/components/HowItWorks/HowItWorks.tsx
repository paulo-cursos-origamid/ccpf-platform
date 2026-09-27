import styles from "./HowItWorks.module.scss";

const steps = [
  {
    number: "01",
    title: "Crie seu Espaço",
    description:
      "Defina o ambiente que representa a realidade financeira que você quer organizar.",
  },
  {
    number: "02",
    title: "Organize",
    description:
      "Cadastre contas, transações e os demais elementos que fazem parte desse Espaço.",
  },
  {
    number: "03",
    title: "Compartilhe",
    description:
      "Adicione pessoas ao Espaço e controle o acesso de cada membro.",
  },
  {
    number: "04",
    title: "Acompanhe",
    description:
      "Use a visão consolidada para entender melhor sua organização financeira.",
  },
];

/**
 * Explica o fluxo básico de utilização do CCPF.
 */
export function HowItWorks() {
  return (
    <section id="como-funciona" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>Como funciona</span>
          <h2>
            Simples para começar.
            <strong> Completo para evoluir.</strong>
          </h2>
        </div>

        <div className={styles.steps}>
          {steps.map((step) => (
            <article key={step.number} className={styles.step}>
              <span className={styles.number}>{step.number}</span>

              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
