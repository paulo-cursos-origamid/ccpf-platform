import styles from "./Domains.module.scss";

const domains = [
  {
    number: "01",
    title: "Finanças",
    description: "Contas, transações e visão financeira.",
  },
  {
    number: "02",
    title: "Veículos",
    description: "Custos, abastecimentos e manutenção.",
  },
  {
    number: "03",
    title: "Saúde",
    description: "Organização de despesas e informações.",
  },
  {
    number: "04",
    title: "Transportes",
    description: "Custos relacionados à mobilidade.",
  },
  {
    number: "05",
    title: "Outros",
    description: "Crie novas possibilidades de organização.",
  },
];

/**
 * Apresenta os domínios que podem ser organizados pelo CCPF.
 */
export function Domains() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>Domínios</span>
          <h2>
            Sua organização financeira pode ir
            <strong> além das contas.</strong>
          </h2>
          <p>
            O CCPF foi projetado para evoluir com diferentes áreas da sua
            vida, mantendo cada informação organizada no seu contexto.
          </p>
        </div>

        <div className={styles.grid}>
          {domains.map((domain) => (
            <article key={domain.number} className={styles.card}>
              <span>{domain.number}</span>
              <h3>{domain.title}</h3>
              <p>{domain.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
