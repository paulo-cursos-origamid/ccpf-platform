"use client";

import { X } from "@/components/icons";

import styles from "./ComingSoonFeedback.module.scss";

interface ComingSoonFeedbackProps {
  moduleName: string | null;
  onClose: () => void;
}

/**
 * Feedback visual utilizado quando o usuário acessa pelo menu
 * uma funcionalidade que ainda está em desenvolvimento.
 *
 * O componente é controlado pelo componente pai e não possui
 * regra de negócio sobre disponibilidade do módulo.
 */
export function ComingSoonFeedback({
  moduleName,
  onClose,
}: ComingSoonFeedbackProps) {
  if (!moduleName) {
    return null;
  }

  return (
    <div
      className={styles.feedback}
      role="status"
      aria-live="polite"
    >
      <div className={styles.indicator} aria-hidden="true" />

      <div className={styles.content}>
        <strong className={styles.title}>
          Funcionalidade em desenvolvimento
        </strong>

        <span className={styles.message}>
          {moduleName} estará disponível em uma próxima versão.
        </span>
      </div>

      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Fechar aviso"
        title="Fechar aviso"
      >
        <X size={18} />
      </button>
    </div>
  );
}
