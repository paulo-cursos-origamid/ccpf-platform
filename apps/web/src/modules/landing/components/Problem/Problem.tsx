import styles from "./Problem.module.scss";

const problems = [
  {
    number: "01",
    title: "Informações espalhadas",
    description:
      "Contas, gastos e compromissos acabam distribuídos entre planilhas, aplicativos e anotações.",
  },
  {
    number: "02",
    title: "Falta de visão",
    description:
      "Sem uma visão centralizada, fica mais difícil entender para onde seu dinheiro está indo.",
  },
  {
    number: "03",
    title: "Controle complicado",
    description:
      "Compartilhar informações financeiras ou organizar diferentes áreas pode se tornar trabalhoso.",
  },
];

/**
 * Seção que apresenta os problemas que o CCPF pretende resolver.
 */
export function Problem() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>O problema</span>
          <h2>
            Sua vida financeira não precisa ser
            <strong> complicada.</strong>
          </h2>
          <p>
            O CCPF foi pensado para reunir informações que normalmente ficam
            espalhadas e transformá-las em uma visão organizada.
          </p>
        </div>

        <div className={styles.grid}>
          {problems.map((problem) => (
            <article key={problem.number} className={styles.card}>
              <span className={styles.number}>{problem.number}</span>
              <h3>{problem.title}</h3>
              <p>{problem.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
