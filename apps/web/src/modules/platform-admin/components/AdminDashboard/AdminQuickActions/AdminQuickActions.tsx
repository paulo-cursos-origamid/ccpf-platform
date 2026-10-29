import {
  ArrowRight,
  FileText,
  Receipt,
  Users,
} from "@/components/icons";
import Link from "next/link";

import styles from "./AdminQuickActions.module.scss";

const actions = [
  {
    label: "Gerenciar usuários",
    description: "Administrar os usuários da plataforma.",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    label: "Faturamento",
    description: "Acompanhar a operação de billing.",
    href: "/admin/billing/invoices",
    icon: Receipt,
  },
  {
    label: "Faturas",
    description: "Consultar faturas e pagamentos.",
    href: "/admin/billing/invoices",
    icon: FileText,
  },
];

export function AdminQuickActions() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Operação</span>
          <h2 className={styles.title}>Ações rápidas</h2>
          <p className={styles.description}>
            Acesse rapidamente as principais áreas administrativas.
          </p>
        </div>
      </div>

      <div className={styles.list}>
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={styles.action}
            >
              <span className={styles.iconWrapper}>
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>

              <span className={styles.content}>
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </span>

              <ArrowRight
                className={styles.arrow}
                size={18}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
