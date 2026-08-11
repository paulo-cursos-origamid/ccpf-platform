import { FeatureList } from "../..";
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
      O CCPF centraliza, organiza e analisa suas finanças para apoiar decisões
      com segurança, organização e eficiência.
    </p>

    <div className={styles.features}>
      <FeatureList />
    </div>
  </div>
      <ChartBackground />
</section>
  );
}