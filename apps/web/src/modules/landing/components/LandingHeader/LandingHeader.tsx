import Link from "next/link";

import styles from "./LandingHeader.module.scss";

/**
 * Cabeçalho público da Landing Page.
 *
 * Responsabilidades:
 * - apresentar a identidade do CCPF;
 * - permitir navegação pelas principais seções;
 * - direcionar usuários existentes para login;
 * - direcionar novos usuários para cadastro.
 */
export function LandingHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>C</span>
          <span>CCPF</span>
        </Link>

        <nav className={styles.navigation} aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#espacos">Espaços</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
        </nav>

        <div className={styles.actions}>
          <Link href="/login" className={styles.login}>
            Entrar
          </Link>

          <Link href="/register" className={styles.register}>
            Começar agora
          </Link>
        </div>
      </div>
    </header>
  );
}
