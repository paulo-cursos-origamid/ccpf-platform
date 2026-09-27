import styles from "./Spaces.module.scss";

/**
 * Explica o conceito central de Espaço do CCPF.
 */
export function Spaces() {
  return (
    <section id="espacos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.visual}>
          <div className={styles.spaceCard}>
            <div className={styles.spaceHeader}>
              <div className={styles.spaceIcon}>E</div>

              <div>
                <small>Espaço atual</small>
                <strong>Minha Família</strong>
              </div>
            </div>

            <div className={styles.members}>
              <span>Você</span>
              <span>+2 membros</span>
            </div>

            <div className={styles.permission}>
              <span>Permissões</span>
              <strong>Administrador</strong>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <span>Espaços</span>

          <h2>
            Um ambiente para cada
            <strong> realidade.</strong>
          </h2>

          <p>
            Um Espaço reúne as informações financeiras de um determinado
            contexto. Pode ser sua vida pessoal, sua família, um projeto ou
            qualquer outra realidade que você queira organizar.
          </p>

          <ul>
            <li>Contas e transações ficam no contexto correto.</li>
            <li>Você pode compartilhar o Espaço com outras pessoas.</li>
            <li>Cada membro possui seu próprio nível de acesso.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
