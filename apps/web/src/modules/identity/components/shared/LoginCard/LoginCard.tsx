import styles from "./LoginCard.module.scss";

interface LoginCardProps {
  children: React.ReactNode;
}

export function LoginCard({ children }: LoginCardProps) {
  return <div className={styles.card}>{children}</div>;
}
