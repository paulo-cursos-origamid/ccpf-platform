import styles from "./FeatureList.module.scss";

const features = [
  {
    title: "Visão completa",
    description:
      "Acompanhe indicadores financeiros em tempo real.",
  },
  {
    title: "Segurança total",
    description:
      "Seus dados protegidos utilizando autenticação segura.",
  },
  {
    title: "Controle de acessos",
    description:
      "Permissões inteligentes para cada perfil de usuário.",
  },
];

export function FeatureList() {
  return (
    <ul className={styles.features}>
      {features.map((feature) => (
        <li
          key={feature.title}
          className={styles.feature}
        >
          <h3>{feature.title}</h3>

          <p>{feature.description}</p>
        </li>
      ))}
    </ul>
  );
}

// import styles from "./FeatureList.module.scss";

// export function FeatureList() {
//   return (
//     <ul className={styles.list}>
//       <li>Dashboard</li>
//       <li>Receitas</li>
//       <li>Despesas</li>
//     </ul>
//   );
// }
