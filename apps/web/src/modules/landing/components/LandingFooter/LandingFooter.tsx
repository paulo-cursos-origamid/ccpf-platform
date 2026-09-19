import Link from "next/link";

import styles from "./LandingFooter.module.scss";

/**
 * Rodapé público da Landing Page.
 */
export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span>CCPF</span>
          </Link>

          <p>
            Centro de Controle Pessoal Financeiro.
            Organização para uma vida financeira mais clara.
          </p>
        </div>

        <div className={styles.links}>
          <div>
            <strong>Produto</strong>
            <a href="#recursos">Recursos</a>
            <a href="#espacos">Espaços</a>
            <a href="#como-funciona">Como funciona</a>
          </div>

          <div>
            <strong>Acesso</strong>
            <Link href="/login">Entrar</Link>
            <Link href="/register">Criar conta</Link>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div>
          © {new Date().getFullYear()} CCPF. Todos os direitos reservados.
        </div>

        <div>Centro de Controle Pessoal Financeiro</div>
      </div>
    </footer>
  );
}
