import styles from "./Features.module.scss";

const features = [
  {
    icon: "01",
    title: "Contas",
    description:
      "Organize suas contas e acompanhe saldos e movimentações em um único lugar.",
  },
  {
    icon: "02",
    title: "Transações",
    description:
      "Registre entradas, despesas e ajustes mantendo seu histórico financeiro organizado.",
  },
  {
    icon: "03",
    title: "Relatórios",
    description:
      "Transforme seus registros em uma visão clara da evolução das suas finanças.",
  },
  {
    icon: "04",
    title: "Membros",
    description:
      "Compartilhe um espaço com outras pessoas e defina o nível de acesso de cada membro.",
  },
  {
    icon: "05",
    title: "Domínios",
    description:
      "Organize diferentes áreas como veículos, saúde, transporte e outras necessidades.",
  },
  {
    icon: "06",
    title: "Segurança",
    description:
      "Acesso baseado em usuários, espaços e permissões para manter cada informação no contexto correto.",
  },
];

/**
 * Apresenta os principais recursos disponíveis no CCPF.
 */
export function Features() {
  return (
    <section id="recursos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>Recursos</span>
          <h2>
            Tudo o que você precisa para
            <strong> organizar suas finanças.</strong>
          </h2>
        </div>

        <div className={styles.grid}>
          {features.map((feature) => (
            <article key={feature.icon} className={styles.card}>
              <span className={styles.icon}>{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
