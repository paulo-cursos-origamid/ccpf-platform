import styles from "./Logo.module.scss";

export function Logo() {
  return (
    <div className={styles.logo}>
      <div>
        <h1 className={styles.title}>CCPF</h1>

        <p className={styles.subtitle}>Centro de Controle Pessoal Financeiro</p>
      </div>
    </div>
  );
}
