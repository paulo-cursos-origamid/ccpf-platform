import styles from "./Container.module.scss";

interface ContainerProps {
  children: React.ReactNode;
}

export function Container({ children }: ContainerProps) {
  return (
    <main className={styles.container}>
      {children}
    </main>
  );
}