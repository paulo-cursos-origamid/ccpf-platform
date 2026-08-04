import styles from "./LoginCard.module.scss";

interface LoginCardProps {
  children: React.ReactNode;
}

export function LoginCard({ children }: LoginCardProps) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.card}>{children}</div>
    </section>
  );
}
