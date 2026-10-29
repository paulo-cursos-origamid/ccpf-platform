import Link from "next/link";
import type { LucideIcon } from "@/components/icons";

import styles from "./AdminMetricCard.module.scss";

interface AdminMetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  loading?: boolean;
}

export function AdminMetricCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  loading = false,
}: AdminMetricCardProps) {
  const content = (
    <>
      <div className={styles.iconWrapper}>
        <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      </div>

      <div className={styles.content}>
        <span className={styles.label}>{label}</span>

        <strong
          className={`${styles.value} ${
            loading ? styles.loading : ""
          }`}
          aria-live="polite"
        >
          {loading ? "..." : value}
        </strong>

        <span className={styles.description}>
          {description}
        </span>
      </div>
    </>
  );

  if (!href) {
    return <div className={styles.card}>{content}</div>;
  }

  return (
    <Link href={href} className={styles.card}>
      {content}
    </Link>
  );
}
