"use client";

import styles from "./AnimatedBackground.module.scss";

/**
 * Background animado da Landing Page.
 *
 * Cria uma ambientação visual tecnológica e financeira para o CCPF
 * utilizando somente elementos HTML, SVG e CSS.
 *
 * Os elementos visuais são independentes das regras de negócio
 * e existem exclusivamente para reforçar a identidade visual
 * da Landing Page.
 */
export function AnimatedBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      {/* Grid financeiro em perspectiva */}
      <div className={styles.grid} />

      {/* Glows principais do ambiente */}
      <div className={`${styles.glow} ${styles.glowPrimary}`} />
      <div className={`${styles.glow} ${styles.glowSecondary}`} />
      <div className={`${styles.glow} ${styles.glowTertiary}`} />

      {/* Moedas financeiras animadas */}
      <div className={`${styles.coin} ${styles.coinOne}`}>
        <svg viewBox="0 0 120 120" role="presentation" focusable="false">
          <defs>
            <linearGradient
              id="coinGoldGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
              <stop offset="45%" stopColor="currentColor" stopOpacity="0.7" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          <circle cx="60" cy="60" r="49" fill="url(#coinGoldGradient)" />

          <circle
            cx="60"
            cy="60"
            r="43"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.65"
          />

          <circle
            cx="60"
            cy="60"
            r="35"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.4"
          />

          <text
            x="60"
            y="76"
            textAnchor="middle"
            fontSize="48"
            fontWeight="800"
            fill="currentColor"
            fontFamily="Arial, sans-serif"
          >
            $
          </text>
        </svg>
      </div>

      <div className={`${styles.coin} ${styles.coinTwo}`}>
        <svg viewBox="0 0 120 120" role="presentation" focusable="false">
          <defs>
            <linearGradient
              id="coinGreenGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.6" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          <circle cx="60" cy="60" r="49" fill="url(#coinGreenGradient)" />

          <circle
            cx="60"
            cy="60"
            r="43"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.65"
          />

          <circle
            cx="60"
            cy="60"
            r="35"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.4"
          />

          <text
            x="60"
            y="76"
            textAnchor="middle"
            fontSize="42"
            fontWeight="800"
            fill="currentColor"
            fontFamily="Arial, sans-serif"
          >
            R$
          </text>
        </svg>
      </div>

      <div className={`${styles.coin} ${styles.coinThree}`}>
        <svg viewBox="0 0 120 120" role="presentation" focusable="false">
          <defs>
            <linearGradient
              id="coinBlueGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          <circle cx="60" cy="60" r="49" fill="url(#coinBlueGradient)" />

          <circle
            cx="60"
            cy="60"
            r="43"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.65"
          />

          <circle
            cx="60"
            cy="60"
            r="35"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.4"
          />

          <text
            x="60"
            y="76"
            textAnchor="middle"
            fontSize="48"
            fontWeight="800"
            fill="currentColor"
            fontFamily="Arial, sans-serif"
          >
            $
          </text>
        </svg>
      </div>

      {/* Linhas financeiras */}
      <div className={styles.financialLines}>
        <span className={styles.lineOne} />
        <span className={styles.lineTwo} />
        <span className={styles.lineThree} />
      </div>

      {/* Cifrões flutuantes */}
      <div className={styles.particles}>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
        <span>$</span>
      </div>

      {/* Rede visual de conexões financeiras */}
      <div className={styles.connectionNetwork}>
        <span className={styles.nodeOne} />
        <span className={styles.nodeTwo} />
        <span className={styles.nodeThree} />
        <span className={styles.nodeFour} />
        <span className={styles.nodeFive} />
      </div>

      {/* Vignette para concentrar atenção no conteúdo */}
      <div className={styles.vignette} />
    </div>
  );
}
