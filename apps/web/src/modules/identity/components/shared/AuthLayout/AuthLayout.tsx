import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

import styles from "./AuthLayout.module.scss";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout compartilhado das páginas públicas de autenticação.
 *
 * Mantém o conteúdo de autenticação centralizado sobre
 * o mesmo background financeiro utilizado na Landing Page.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className={styles.container}>
      <AnimatedBackground />

      <div className={styles.content}>{children}</div>
    </main>
  );
}
