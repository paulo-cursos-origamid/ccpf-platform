"use client";

import {
  CalendarDays,
  CreditCard,
  Users,
} from "@/components/icons";

import { Button } from "@/components/ui/forms/Button/Button";

import { useTenantSubscription } from "../../hooks";

import styles from "./SubscriptionSummary.module.scss";

interface SubscriptionSummaryProps {
  collapsed?: boolean;
}

/**
 * Formata uma data ISO para o padrão utilizado pela interface
 * comercial do CCPF.
 */
function formatDate(date: string | null): string | null {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

/**
 * Exibe um resumo compacto da assinatura comercial do Tenant.
 *
 * Responsabilidades:
 * - apresentar o plano atual;
 * - informar o estado da assinatura;
 * - apresentar o limite de usuários;
 * - apresentar informações de trial ou renovação;
 * - oferecer uma ação comercial futura.
 *
 * As regras de assinatura permanecem no domínio Billing/backend.
 * Este componente apenas apresenta o estado consolidado pelo hook.
 */
export function SubscriptionSummary({
  collapsed = false,
}: SubscriptionSummaryProps) {
  const {
    subscription,
    plan,
    currentUsers,
    maxUsers,
    hasUnlimitedUsers,
    status,
    isTrial,
    isActive,
    trialDaysRemaining,
    currentPeriodEnd,
    loading,
  } = useTenantSubscription();

  if (collapsed) {
    return (
      <div
        className={`${styles.collapsedSummary} ${
          isTrial ? styles.trial : ""
        } ${isActive ? styles.active : ""}`}
        title={
          loading
            ? "Carregando assinatura"
            : plan?.name ?? "Assinatura"
        }
        aria-label={
          loading
            ? "Carregando assinatura"
            : `Plano ${plan?.name ?? "não definido"}`
        }
      >
        <CreditCard size={20} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.summary}>
        <div className={styles.loading}>
          <div className={styles.loadingHeader}>
            <div className={styles.loadingIcon} />

            <div className={styles.loadingContent}>
              <span className={styles.loadingLine} />
              <span className={styles.loadingLineShort} />
            </div>
          </div>

          <span className={styles.loadingDetail} />
          <span className={styles.loadingDetailShort} />
        </div>
      </div>
    );
  }

  /**
   * Quando não existe assinatura vigente, o backend representa
   * o estado como ausência de Subscription atual.
   *
   * Isso ocorre, por exemplo, após o encerramento do Trial.
   */
  if (!subscription) {
    return (
      <div className={`${styles.summary} ${styles.expired}`}>
        <div className={styles.header}>
          <div className={styles.planIcon}>
            <CreditCard size={16} />
          </div>

          <div className={styles.planInfo}>
            <span className={styles.planCode}>TRIAL</span>

            <span className={styles.status}>
              Período encerrado
            </span>
          </div>
        </div>

        <div className={styles.action}>
          <Button
            type="button"
            variant="outline"
            fullWidth
          >
            Escolher plano
          </Button>
        </div>
      </div>
    );
  }

  const planCode = plan?.code ?? "PLANO";

  let statusLabel = "Indisponível";

  switch (status) {
    case "TRIALING":
      statusLabel = "Em período de teste";
      break;

    case "PENDING":
      statusLabel = "Aguardando pagamento";
      break;

    case "ACTIVE":
      statusLabel = "Ativo";
      break;

    case "PAST_DUE":
      statusLabel = "Pagamento pendente";
      break;

    case "SUSPENDED":
      statusLabel = "Suspenso";
      break;

    case "CANCELLED":
      statusLabel = "Cancelado";
      break;

    case "EXPIRED":
      statusLabel = "Período encerrado";
      break;
  }

  const usersLabel = hasUnlimitedUsers
    ? `${currentUsers} usuários`
    : `${currentUsers} / ${maxUsers ?? 0} usuários`;

  const renewalDate = formatDate(currentPeriodEnd);

  const actionLabel =
    isTrial || status === "EXPIRED"
      ? "Escolher plano"
      : status === "PENDING"
        ? "Ver pagamento"
        : "Gerenciar plano";

  return (
    <div
      className={`${styles.summary} ${
        isTrial ? styles.trial : ""
      } ${isActive ? styles.active : ""}`}
    >
      <div className={styles.header}>
        <div className={styles.planIcon}>
          <CreditCard size={16} />
        </div>

        <div className={styles.planInfo}>
          <div className={styles.planTitle}>
            <span className={styles.planCode}>
              {planCode}
            </span>

            <span className={styles.status}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <Users size={14} />

          <span>{usersLabel}</span>
        </div>

        {isTrial && trialDaysRemaining !== null ? (
          <div className={styles.detail}>
            <CalendarDays size={14} />

            <span>
              {trialDaysRemaining === 1
                ? "1 dia restante"
                : `${trialDaysRemaining} dias restantes`}
            </span>
          </div>
        ) : renewalDate ? (
          <div className={styles.detail}>
            <CalendarDays size={14} />

            <span>
              Renovação: {renewalDate}
            </span>
          </div>
        ) : null}
      </div>

      <div className={styles.action}>
        <Button
          type="button"
          variant="ghost"
          fullWidth
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}