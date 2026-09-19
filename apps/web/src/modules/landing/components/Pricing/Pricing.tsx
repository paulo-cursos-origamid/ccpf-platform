import styles from "./Pricing.module.scss";

const features = [
  "Contas e transações",
  "Espaços compartilhados",
  "Membros e permissões",
  "Domínios financeiros",
  "Relatórios e acompanhamento",
];

/**
 * Seção de planos.
 *
 * Os valores ainda não são apresentados porque o modelo comercial
 * de Plan/Subscription/Invoice/Billing será definido posteriormente.
 */
export function Pricing() {
  return (
    <section id="planos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>Planos</span>
          <h2>
            Um produto preparado para
            <strong> crescer com você.</strong>
          </h2>
          <p>
            Os planos comerciais do CCPF serão definidos conforme a estrutura
            de assinatura e cobrança da plataforma evoluir.
          </p>
        </div>

        <div className={styles.card}>
          <div>
            <span className={styles.badge}>Em breve</span>
            <h3>Planos CCPF</h3>
            <p>
              Estamos preparando diferentes possibilidades para atender
              diferentes necessidades de organização financeira.
            </p>
          </div>

          <ul>
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          <div className={styles.footer}>
            <span>Novidades em breve</span>
          </div>
        </div>
      </div>
    </section>
  );
}
