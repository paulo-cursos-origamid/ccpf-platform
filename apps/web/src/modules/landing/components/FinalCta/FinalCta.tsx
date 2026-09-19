import Link from "next/link";

import styles from "./FinalCta.module.scss";

/**
 * Chamada final para cadastro.
 */
export function FinalCta() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.mark}>C</div>

        <span>Comece agora</span>

        <h2>
          Sua organização financeira
          <strong> começa aqui.</strong>
        </h2>

        <p>
          Crie seu primeiro Espaço e comece a transformar suas informações
          financeiras em uma visão mais organizada.
        </p>

        <Link href="/register" className={styles.button}>
          Criar meu Espaço
        </Link>
      </div>
    </section>
  );
}
