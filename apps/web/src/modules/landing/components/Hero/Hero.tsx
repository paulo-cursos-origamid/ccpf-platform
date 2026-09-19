import Link from "next/link";

import { AnimatedBackground } from "../AnimatedBackground/AnimatedBackground";
import styles from "./Hero.module.scss";

/**
 * Hero principal da Landing Page.
 *
 * Apresenta a proposta do CCPF e utiliza uma representação
 * visual do produto para aproximar a Landing da aplicação real.
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <AnimatedBackground />
      <div className={styles.backgroundGlow} />

      <div className={styles.container}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>
            Controle financeiro inteligente
          </span>

          <h1>
            Tenha o controle das suas
            <span> finanças em um só lugar.</span>
          </h1>

          <p className={styles.description}>
            Organize contas, transações e diferentes áreas da sua vida
            financeira em espaços simples, seguros e compartilháveis.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primaryAction}>
              Começar agora
            </Link>

            <a href="#como-funciona" className={styles.secondaryAction}>
              Conhecer o CCPF
            </a>
          </div>

          <div className={styles.trust}>
            <span className={styles.trustDot} />
            <span>Organização financeira em um só espaço</span>
          </div>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewWindow}>
            <div className={styles.previewTopbar}>
              <div className={styles.windowDots}>
                <span />
                <span />
                <span />
              </div>

              <span className={styles.previewBrand}>CCPF</span>

              <span className={styles.previewUser}>PD</span>
            </div>

            <div className={styles.previewContent}>
              <div className={styles.previewHeading}>
                <div>
                  <small>Espaço atual</small>
                  <strong>Minha Família</strong>
                </div>

                <span className={styles.previewBadge}>Ativo</span>
              </div>

              <div className={styles.previewCards}>
                <div className={styles.previewCard}>
                  <small>Saldo total</small>
                  <strong>R$ 12.450,00</strong>
                  <span className={styles.positive}>+8,4%</span>
                </div>

                <div className={styles.previewCard}>
                  <small>Contas</small>
                  <strong>04</strong>
                  <span>Ativas</span>
                </div>

                <div className={styles.previewCard}>
                  <small>Transações</small>
                  <strong>28</strong>
                  <span>Este mês</span>
                </div>
              </div>

              <div className={styles.chart}>
                <div className={styles.chartHeader}>
                  <strong>Movimentação</strong>
                  <span>Últimos meses</span>
                </div>

                <div className={styles.chartArea}>
                  <span style={{ height: "38%" }} />
                  <span style={{ height: "52%" }} />
                  <span style={{ height: "44%" }} />
                  <span style={{ height: "68%" }} />
                  <span style={{ height: "58%" }} />
                  <span style={{ height: "82%" }} />
                  <span style={{ height: "72%" }} />
                </div>
              </div>

              <div className={styles.previewFooter}>
                <span>Contas</span>
                <span>Transações</span>
                <span>Relatórios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
