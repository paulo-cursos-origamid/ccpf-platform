import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "@/components/icons";
import styles from "../TenantDashboard/TenantDashboard.module.scss";

interface MetricTrend {
  current: number;
  previous: number;
  increaseIsPositive: boolean;
}

interface DashboardMetricCardProps {
  icon: ReactNode;
  iconClassName: string;
  label: string;
  value: string;
  description: string;
  trend?: MetricTrend;
  trendUnavailableText?: string;
  valueTone?: "positive" | "negative";
}

function formatPercent(value: number): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(Math.abs(value));

  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatted}%`;
}

export function DashboardMetricCard({
  icon,
  iconClassName,
  label,
  value,
  description,
  trend,
  trendUnavailableText,
  valueTone,
}: DashboardMetricCardProps) {
  const change = trend ? trend.current - trend.previous : 0;
  const isIncrease = change > 0;
  const isDecrease = change < 0;
  const isFavorable = trend
    ? (isIncrease && trend.increaseIsPositive) ||
      (isDecrease && !trend.increaseIsPositive)
    : false;
  const trendClass = isFavorable
    ? styles.metricTrendPositive
    : isIncrease || isDecrease
      ? styles.metricTrendNegative
      : styles.metricTrendNeutral;
  const TrendIcon = isIncrease
    ? ArrowUpRight
    : isDecrease
      ? ArrowDownRight
      : Minus;
  const trendLabel = trend
    ? trend.previous === 0 && trend.current !== 0
      ? "Sem base de comparação"
      : `${formatPercent(
          trend.previous === 0 ? 0 : (change / Math.abs(trend.previous)) * 100,
        )} vs. mês anterior`
    : trendUnavailableText;

  return (
    <article className={styles.dashboardMetric}>
      <div
        className={`${styles.metricIcon} ${iconClassName}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <span className={styles.metricLabel}>{label}</span>
      <strong className={valueTone ? styles[valueTone] : undefined}>
        {value}
      </strong>
      <small>{description}</small>
      {trendLabel ? (
        <div className={`${styles.metricTrend} ${trendClass}`}>
          {trend ? <TrendIcon size={15} aria-hidden="true" /> : null}
          <span>{trendLabel}</span>
        </div>
      ) : null}
    </article>
  );
}
