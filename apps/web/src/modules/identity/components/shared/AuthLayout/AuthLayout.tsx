import styles from "./AuthLayout.module.scss";

interface AuthLayoutProps {
  children: React.ReactNode;
}
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className={styles.container}>
      <div className={styles.background} />
      <div className={styles.glow} />

      {children}
    </main>
  );
}
