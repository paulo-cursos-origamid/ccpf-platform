import styles from "./Benefits.module.scss";

const benefits = [
  "Tenha uma visão centralizada das suas finanças.",
  "Separe diferentes contextos usando Espaços.",
  "Compartilhe informações com pessoas de confiança.",
  "Controle permissões de cada membro.",
  "Expanda a organização para diferentes domínios.",
  "Construa seu histórico financeiro ao longo do tempo.",
];

/**
 * Apresenta os benefícios práticos do CCPF.
 */
export function Benefits() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>Por que CCPF?</span>
          <h2>
            Mais organização.
            <strong> Menos complicação.</strong>
          </h2>
        </div>

        <div className={styles.content}>
          <div className={styles.statement}>
            <div className={styles.mark}>C</div>
            <p>
              O CCPF transforma diferentes informações financeiras em uma
              estrutura que você consegue entender, acompanhar e compartilhar.
            </p>
          </div>

          <div className={styles.list}>
            {benefits.map((benefit, index) => (
              <div key={benefit} className={styles.item}>
                <span>0{index + 1}</span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
