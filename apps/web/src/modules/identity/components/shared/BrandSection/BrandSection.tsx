import { ChartBackground } from "../ChartBackground";
import { Logo } from "../Logo";

import styles from "./BrandSection.module.scss";

export function BrandSection() {
  return (
    <section className={styles.container}>
      <Logo />

      <div className={styles.content}>
        <h1 className={styles.title}>
          Gestão <span className={styles.highlight}>inteligente</span>
          <br />
          para resultados reais
        </h1>

        <div className={styles.line} />

        <p className={styles.subtitle}>
          O CCPF centraliza, organiza e analisa suas finanças para apoiar
          decisões com segurança, organização e eficiência.
        </p>
      </div>

      <ul className={styles.features}>
        <li className={styles.feature}>
          <h3>Visão completa</h3>
          <p>Acompanhe indicadores financeiros em tempo real.</p>
        </li>

        <li className={styles.feature}>
          <h3>Segurança total</h3>
          <p>Seus dados protegidos utilizando autenticação segura.</p>
        </li>

        <li className={styles.feature}>
          <h3>Controle de acessos</h3>
          <p>Permissões inteligentes para cada perfil de usuário.</p>
        </li>
      </ul>

      <ChartBackground />
    </section>
  );
}