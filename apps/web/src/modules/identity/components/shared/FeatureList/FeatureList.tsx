import styles from "./FeatureList.module.scss";

export function FeatureList() {
  return (
    <ul className={styles.list}>
      <li>Dashboard</li>
      <li>Receitas</li>
      <li>Despesas</li>
    </ul>
  );
}
