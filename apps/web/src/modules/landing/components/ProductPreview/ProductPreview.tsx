import styles from "./ProductPreview.module.scss";

/**
 * Mostra uma representação visual do produto real.
 *
 * Esta seção evita o uso de imagens genéricas e reforça
 * a conexão entre a Landing Page e o sistema CCPF.
 */
export function ProductPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>Dentro do CCPF</span>

          <h2>
            Uma visão clara do que está
            <strong> acontecendo.</strong>
          </h2>

          <p>
            O objetivo é transformar dados financeiros em uma experiência
            simples de acompanhar no dia a dia.
          </p>
        </div>

        <div className={styles.dashboard}>
          <aside className={styles.sidebar}>
            <strong>CCPF</strong>

            <div className={styles.sidebarGroup}>
              <span>Principal</span>
              <b>Dashboard</b>
            </div>

            <div className={styles.sidebarGroup}>
              <span>Financeiro</span>
              <b>Contas</b>
              <b>Transações</b>
              <b>Relatórios</b>
            </div>

            <div className={styles.sidebarGroup}>
              <span>Domínios</span>
              <b>Veículos</b>
            </div>
          </aside>

          <div className={styles.dashboardContent}>
            <div className={styles.dashboardHeader}>
              <div>
                <small>Visão geral</small>
                <h3>Dashboard</h3>
              </div>

              <span>Minha Família</span>
            </div>

            <div className={styles.summary}>
              <div>
                <small>Saldo disponível</small>
                <strong>R$ 12.450,00</strong>
              </div>

              <div>
                <small>Entradas</small>
                <strong>R$ 8.320,00</strong>
              </div>

              <div>
                <small>Despesas</small>
                <strong>R$ 4.180,00</strong>
              </div>
            </div>

            <div className={styles.dashboardGrid}>
              <div className={styles.largePanel}>
                <small>Movimentação financeira</small>

                <div className={styles.fakeChart}>
                  <span style={{ height: "32%" }} />
                  <span style={{ height: "48%" }} />
                  <span style={{ height: "42%" }} />
                  <span style={{ height: "64%" }} />
                  <span style={{ height: "54%" }} />
                  <span style={{ height: "78%" }} />
                  <span style={{ height: "70%" }} />
                </div>
              </div>

              <div className={styles.sidePanel}>
                <small>Últimas transações</small>

                <div>
                  <span>Supermercado</span>
                  <b>- R$ 245,00</b>
                </div>

                <div>
                  <span>Salário</span>
                  <b>+ R$ 4.200,00</b>
                </div>

                <div>
                  <span>Combustível</span>
                  <b>- R$ 180,00</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
