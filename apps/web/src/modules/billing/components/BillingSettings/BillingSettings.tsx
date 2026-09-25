"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  CheckCircle,
  CreditCard,
  Users,
} from "@/components/icons";

import { useSubscribeToPlan, useTenantSubscription } from "../../hooks";
import { billingService } from "../../services";
import type { PublicPlan, SubscriptionStatus } from "../../types";

import styles from "./BillingSettings.module.scss";

/**
 * Converte o código de status da assinatura para um texto
 * adequado para apresentação na interface.
 */
function getStatusLabel(status: SubscriptionStatus | null): string {
  switch (status) {
    case "PENDING":
      return "Aguardando pagamento";

    case "TRIALING":
      return "Período de teste";

    case "ACTIVE":
      return "Ativo";

    case "PAST_DUE":
      return "Pagamento pendente";

    case "SUSPENDED":
      return "Suspenso";

    case "CANCELLED":
      return "Cancelado";

    case "EXPIRED":
      return "Expirado";

    default:
      return "Sem assinatura";
  }
}

/**
 * Retorna uma classe visual compatível com o status da assinatura.
 */
function getStatusClass(status: SubscriptionStatus | null): string {
  switch (status) {
    case "ACTIVE":
      return styles.statusActive;

    case "TRIALING":
      return styles.statusTrial;

    case "PENDING":
    case "PAST_DUE":
      return styles.statusWarning;

    case "SUSPENDED":
    case "CANCELLED":
    case "EXPIRED":
      return styles.statusDanger;

    default:
      return styles.statusNeutral;
  }
}

/**
 * Formata o preço do plano utilizando a moeda informada pela API.
 */
function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

/**
 * Formata uma data recebida da API.
 */
function formatDate(date: string | null): string {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR").format(parsedDate);
}

/**
 * Retorna a descrição textual do intervalo de cobrança.
 */
function getBillingIntervalLabel(
  interval: PublicPlan["billingInterval"],
): string {
  return interval === "YEARLY" ? "por ano" : "por mês";
}

/**
 * Componente responsável pela tela de gerenciamento
 * do plano comercial e da assinatura do Tenant ativo.
 *
 * A comunicação com a API e as regras de assinatura
 * permanecem encapsuladas nos hooks/services do módulo Billing.
 */
export function BillingSettings() {
  const {
    subscription,
    plan: currentPlan,
    currentUsers,
    maxUsers,
    hasUnlimitedUsers,
    status,
    isTrial,
    trialDaysRemaining,
    currentPeriodEnd,
    loading,
    error,
    reload,
  } = useTenantSubscription();

  const { subscribeToPlan, loading: subscribing } =
    useSubscribeToPlan();

  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<unknown>(null);

  /**
   * Carrega os planos públicos quando a tela é montada.
   *
   * O carregamento é realizado em useEffect porque envolve
   * comunicação assíncrona e atualização de estado.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setPlansLoading(true);
      setPlansError(null);

      try {
        const result = await billingService.listPublicPlans();

        if (cancelled) {
          return;
        }

        setPlans(result);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setPlansError(loadError);
      } finally {
        if (!cancelled) {
          setPlansLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  const orderedPlans = useMemo(() => {
    return [...plans].sort((a, b) => a.price - b.price);
  }, [plans]);

  const hasCurrentSubscription = subscription !== null;

  /**
   * Cria uma assinatura somente quando o Tenant não possui
   * uma assinatura comercial vigente.
   *
   * O backend determina se a assinatura iniciará como
   * TRIALING ou PENDING.
   */
  async function handleSubscribe(plan: PublicPlan) {
    if (hasCurrentSubscription || subscribing) {
      return;
    }

    setSelectedPlanCode(plan.code);
    setActionError(null);

    try {
      await subscribeToPlan({
        planCode: plan.code,
      });

      await reload();
    } catch {
      setActionError(
        "Não foi possível contratar este plano. Verifique a disponibilidade e tente novamente.",
      );
    } finally {
      setSelectedPlanCode(null);
    }
  }

  if (loading && !subscription && !currentPlan) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <CreditCard size={24} />
          </div>

          <div>
            <h1>Plano e assinatura</h1>

            <p>
              Gerencie o plano comercial e a assinatura deste Espaço.
            </p>
          </div>
        </header>

        <div className={styles.loadingCard}>
          <div className={styles.loadingLine} />
          <div className={styles.loadingLineShort} />
          <div className={styles.loadingGrid}>
            <div className={styles.loadingBox} />
            <div className={styles.loadingBox} />
            <div className={styles.loadingBox} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <CreditCard size={24} />
        </div>

        <div>
          <h1>Plano e assinatura</h1>

          <p>
            Gerencie o plano comercial e a assinatura deste Espaço.
          </p>
        </div>
      </header>

      {error ? (
        <section className={styles.feedbackError}>
          <strong>Não foi possível carregar a assinatura.</strong>

          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Assinatura atual</h2>

            <p>
              Consulte o plano utilizado atualmente por este Espaço.
            </p>
          </div>
        </div>

        <div className={styles.currentCard}>
          <div className={styles.currentMain}>
            <div>
              <span className={styles.eyebrow}>Plano atual</span>

              <h3>{currentPlan?.name ?? "Nenhum plano ativo"}</h3>

              <p>
                {currentPlan?.description ??
                  "Este Espaço não possui uma assinatura comercial vigente."}
              </p>
            </div>

            <span
              className={`${styles.status} ${getStatusClass(status)}`}
            >
              {getStatusLabel(status)}
            </span>
          </div>

          {subscription ? (
            <div className={styles.currentDetails}>
              <div className={styles.detail}>
                <Users size={18} />

                <div>
                  <span>Usuários</span>

                  <strong>
                    {hasUnlimitedUsers
                      ? `${currentUsers} usuários`
                      : `${currentUsers} / ${maxUsers ?? "—"} usuários`}
                  </strong>
                </div>
              </div>

              <div className={styles.detail}>
                <CalendarDays size={18} />

                <div>
                  <span>
                    {isTrial ? "Fim do período de teste" : "Próximo período"}
                  </span>

                  <strong>
                    {formatDate(
                      isTrial
                        ? subscription.trialEndsAt
                        : currentPeriodEnd,
                    )}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}

          {isTrial && trialDaysRemaining !== null ? (
            <div className={styles.trialNotice}>
              <strong>
                {trialDaysRemaining === 0
                  ? "Seu período de teste terminou."
                  : `${trialDaysRemaining} ${
                      trialDaysRemaining === 1 ? "dia" : "dias"
                    } restantes no período de teste.`}
              </strong>

              <span>
                Ao final do período, será necessário contratar um
                plano comercial para continuar utilizando os recursos
                pagos.
              </span>
            </div>
          ) : null}

          {status === "PENDING" ? (
            <div className={styles.pendingNotice}>
              <strong>Pagamento pendente</strong>

              <span>
                A assinatura foi criada e aguarda a conclusão do
                pagamento.
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Planos disponíveis</h2>

            <p>
              Consulte os planos comerciais disponibilizados pelo
              CCPF.
            </p>
          </div>
        </div>

        {actionError ? (
          <div className={styles.feedbackError}>
            {actionError}
          </div>
        ) : null}

        {plansLoading ? (
          <div className={styles.plansLoading}>
            <div className={styles.loadingBox} />
            <div className={styles.loadingBox} />
            <div className={styles.loadingBox} />
          </div>
        ) : plansError ? (
          <div className={styles.feedbackError}>
            <strong>Não foi possível carregar os planos.</strong>

            <button
              type="button"
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        ) : orderedPlans.length === 0 ? (
          <div className={styles.emptyState}>
            <CreditCard size={28} />

            <strong>Nenhum plano disponível</strong>

            <span>
              Não existem planos comerciais públicos disponíveis no
              momento.
            </span>
          </div>
        ) : (
          <div className={styles.plansGrid}>
            {orderedPlans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isSelected = selectedPlanCode === plan.code;

              return (
                <article
                  key={plan.id}
                  className={`${styles.planCard} ${
                    isCurrentPlan ? styles.planCardCurrent : ""
                  }`}
                >
                  {isCurrentPlan ? (
                    <span className={styles.currentBadge}>
                      Plano atual
                    </span>
                  ) : null}

                  <div className={styles.planHeader}>
                    <div>
                      <span className={styles.eyebrow}>
                        {plan.code}
                      </span>

                      <h3>{plan.name}</h3>
                    </div>
                  </div>

                  {plan.description ? (
                    <p className={styles.planDescription}>
                      {plan.description}
                    </p>
                  ) : null}

                  <div className={styles.price}>
                    <strong>
                      {formatPrice(plan.price, plan.currency)}
                    </strong>

                    <span>
                      {getBillingIntervalLabel(plan.billingInterval)}
                    </span>
                  </div>

                  <div className={styles.planUsers}>
                    <Users size={17} />

                    <span>
                      {plan.maxUsers === -1
                        ? "Usuários ilimitados"
                        : `Até ${plan.maxUsers} ${
                            plan.maxUsers === 1 ? "usuário" : "usuários"
                          }`}
                    </span>
                  </div>

                  {plan.features.length > 0 ? (
                    <ul className={styles.features}>
                      {plan.features.map((feature) => (
                        <li key={feature}>
                          <CheckCircle size={16} />

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <button
                    type="button"
                    className={styles.planButton}
                    disabled={hasCurrentSubscription || isSelected}
                    onClick={() => void handleSubscribe(plan)}
                  >
                    {isCurrentPlan
                      ? "Plano atual"
                      : isSelected
                        ? "Processando..."
                        : hasCurrentSubscription
                          ? "Indisponível no momento"
                          : "Escolher plano"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
