import styles from "./AuthHeader.module.scss";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>CCPF</div>

      <h1 className={styles.title}>{title}</h1>

      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
