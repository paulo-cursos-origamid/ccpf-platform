import type { InvoiceStatus } from "../../types";

import styles from "./InvoiceStatusBadge.module.scss";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

/**
 * Apresenta visualmente o status de uma fatura.
 *
 * A tradução e a classe visual ficam encapsuladas neste componente
 * para evitar repetição nas listas e futuros detalhes da fatura.
 */
export function InvoiceStatusBadge({
  status,
}: InvoiceStatusBadgeProps) {
  const statusMap: Record<
    InvoiceStatus,
    {
      label: string;
      className: string;
    }
  > = {
    PENDING: {
      label: "Pendente",
      className: styles.warning,
    },
    PAID: {
      label: "Pago",
      className: styles.success,
    },
    OVERDUE: {
      label: "Vencida",
      className: styles.danger,
    },
    CANCELLED: {
      label: "Cancelada",
      className: styles.neutral,
    },
  };

  const current = statusMap[status];

  return (
    <span className={`${styles.badge} ${current.className}`}>
      {current.label}
    </span>
  );
}
