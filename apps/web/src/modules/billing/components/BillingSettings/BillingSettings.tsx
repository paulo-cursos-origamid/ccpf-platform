"use client";

import {
  CalendarDays,
  CheckCircle,
  CreditCard,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  useChangeSubscriptionPlan,
  useSubscribeToPlan,
  useTenantSubscription,
} from "../../hooks/client";
import { billingService } from "../../services";
import type {
  PublicPlan,
  PublicPlanPrice,
  SubscriptionStatus,
} from "../../types";
import { InvoiceList } from "../InvoiceList/InvoiceList";
import styles from "./BillingSettings.module.scss";

import { Select } from "@/components/ui/forms/Select";
import { useHasPermission } from "@/modules/identity/hooks/useHasPermission";
import { tenantService } from "@/modules/tenant/services";
import { useTenantStore } from "@/modules/tenant/stores";
function formatCurrency(
  value: number,
  currency: string,
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function getStatusLabel(status: SubscriptionStatus | null): string {
  switch (status) {
    case "ACTIVE":
      return "Ativa";
    case "TRIALING":
      return "Em período de teste";
    case "PENDING":
      return "Aguardando pagamento";
    case "PAST_DUE":
      return "Pagamento em atraso";
    case "SUSPENDED":
      return "Suspensa";
    case "CANCELLED":
      return "Cancelada";
    case "EXPIRED":
      return "Expirada";
    default:
      return "Sem assinatura";
  }
}

function getStatusClass(
  status: SubscriptionStatus | null,
): string {
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
 * Tela principal de gerenciamento da assinatura e dos
 * planos comerciais do Tenant.
 *
 * Responsabilidades:
 * - carregar os planos públicos;
 * - apresentar a assinatura atual;
 * - iniciar contratação quando não existe assinatura;
 * - iniciar alteração quando já existe assinatura;
 * - refletir o estado retornado pelo backend;
 * - manter o histórico de cobranças.
 *
 * As regras comerciais permanecem na API.
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
    loading: subscriptionLoading,
    error: subscriptionError,
    reload,
  } = useTenantSubscription();

  const {
    subscribeToPlan,
    loading: subscribing,
  } = useSubscribeToPlan();

  const {
    changeSubscriptionPlan,
    loading: changingPlan,
  } = useChangeSubscriptionPlan();

  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<unknown>(null);

  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(
    null,
  );
  const [selectedPriceIds, setSelectedPriceIds] = useState<
    Record<string, string>
  >({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [assigningSystemOwner, setAssigningSystemOwner] = useState(false);
  const canManageBilling = useHasPermission("BILLING_MANAGE");

  const [pendingPlan, setPendingPlan] = useState<PublicPlan | null>(null);

  /**
   * Define a modalidade comercial padrão apresentada ao usuário.
   *
   * A preferência visual é:
   * Anual -> Semestral -> Vitalício.
   *
   * A regra de disponibilidade permanece no backend:
   * somente modalidades retornadas em prices[] podem ser contratadas.
   */
  function getDefaultPrice(plan: PublicPlan) {
    return (
      plan.prices.find((price) => price.interval === "YEARLY") ??
      plan.prices.find((price) => price.interval === "SEMESTERLY") ??
      plan.prices.find((price) => price.interval === "LIFETIME") ??
      null
    );
  }

  /**
   * Retorna a modalidade atualmente escolhida para um plano.
   *
   * Quando o usuário ainda não escolheu uma modalidade,
   * utiliza a modalidade comercial padrão.
   */
  function getSelectedPrice(plan: PublicPlan) {
    return (
      plan.prices.find(
        (price) => price.id === selectedPriceIds[plan.code],
      ) ?? getDefaultPrice(plan)
    );
  }

  function getIntervalLabel(interval: PublicPlan["prices"][number]["interval"]) {
    switch (interval) {
      case "SEMESTERLY":
        return "Semestral";

      case "YEARLY":
        return "Anual";

      case "LIFETIME":
        return "Vitalício";
    }
  }

  function getIntervalSuffix(
    interval: PublicPlan["prices"][number]["interval"],
  ) {
    switch (interval) {
      case "SEMESTERLY":
        return "/ semestre";

      case "YEARLY":
        return "/ ano";

      case "LIFETIME":
        return "pagamento único";
    }
  }

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

        setPlans(
          [...result].sort((first, second) => {
            const firstPrice = getDefaultPrice(first)?.amount ?? Number.MAX_SAFE_INTEGER;
            const secondPrice =
              getDefaultPrice(second)?.amount ?? Number.MAX_SAFE_INTEGER;

            return firstPrice - secondPrice;
          }),
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPlans([]);
        setPlansError(error);
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

  const hasCurrentSubscription = subscription !== null;
  const operationInProgress = subscribing || changingPlan;

  const currentPlanCode = useMemo(
    () => currentPlan?.code ?? null,
    [currentPlan],
  );

  function requestPlanAction(plan: PublicPlan) {
    if (operationInProgress || plan.code === currentPlanCode) {
      return;
    }

    setActionError(null);

    if (hasCurrentSubscription) {
      setPendingPlan(plan);
      return;
    }

    void handleSubscribe(plan);
  }

  async function handleSubscribe(plan: PublicPlan) {
    if (operationInProgress) {
      return;
    }

    const price = getSelectedPrice(plan);

    if (!price) {
      setActionError(
        "Este plano não possui uma modalidade comercial disponível.",
      );
      return;
    }

    setSelectedPlanCode(plan.code);
    setActionError(null);

    try {
      await subscribeToPlan({
        planCode: plan.code,
        planPriceId: price.id,
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

  async function handleChangePlan() {
    if (!pendingPlan || operationInProgress) {
      return;
    }

    const plan = pendingPlan;
    const price = getSelectedPrice(plan);

    if (!price) {
      setActionError(
        "Este plano não possui uma modalidade comercial disponível.",
      );
      return;
    }

    setSelectedPlanCode(plan.code);
    setActionError(null);

    try {
      await changeSubscriptionPlan({
        planCode: plan.code,
        planPriceId: price.id,
        billingDay:
          price.interval === "LIFETIME"
            ? undefined
            : (subscription?.billingDay ?? 8),
      });

      setPendingPlan(null);

      /**
       * O backend pode retornar:
       * - ACTIVE para alterações imediatas;
       * - PENDING para conversão Trial → plano pago.
       *
       * O estado visual é derivado novamente da assinatura
       * retornada pela API, sem assumir nenhum desses estados.
       */
      await reload();
    } catch {
      setActionError(
        "Não foi possível alterar o plano. Verifique as condições da assinatura e tente novamente.",
      );
    } finally {
      setSelectedPlanCode(null);
    }
  }

  function cancelPlanChange() {
    if (operationInProgress) {
      return;
    }

    setPendingPlan(null);
    setActionError(null);
  }

  const selectedPlanIsCurrent =
    pendingPlan?.code === currentPlanCode;

  /**
   * Resolve a modalidade comercial vinculada à assinatura atual.
   *
   * Os preços pertencem ao catálogo público, não aos detalhes
   * do plano retornado junto à assinatura. Planos internos que
   * não aparecem no catálogo permanecem válidos, sem preço público.
   */
  const currentPrice =
    currentPlan && subscription?.planPriceId
      ? (plans.find((plan) => plan.code === currentPlan.code)?.prices.find(
          (price: PublicPlanPrice) =>
            price.id === subscription.planPriceId,
        ) ?? null)
      : null;

  /**
   * Atribui o plano interno ao Tenant ativo após confirmação.
   */
  async function handleAssignSystemOwnerPlan() {
    const confirmed = window.confirm(
      "Atribuir o plano interno SYSTEM_OWNER ao espaço selecionado? A assinatura atual será substituída."
    );
    if (!confirmed) return;

    setAssigningSystemOwner(true);
    setActionError(null);

    try {
      /**
       * Garante que o Tenant ativo esteja carregado antes da chamada.
       * O ApiClient utiliza esse contexto para enviar X-Tenant-Id.
       */
      const tenantStore = useTenantStore.getState();

      if (!tenantStore.getActiveTenant()) {
        const tenants = await tenantService.listMine();
        useTenantStore.getState().setTenants(tenants);
      }

      if (!useTenantStore.getState().getActiveTenant()) {
        setActionError(
          "Nenhum espaço disponível para atribuir o plano interno. " +
          "Verifique seu acesso aos espaços e tente novamente."
        );
        return;
      }

      const tenantId = useTenantStore.getState().activeTenantId;
      if (!tenantId) {
        throw new Error("Selecione um Tenant antes de atribuir SYSTEM_OWNER.");
      }
      await billingService.assignSystemOwnerPlan(tenantId);
      await reload();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível atribuir o plano interno."
      );
    } finally {
      setAssigningSystemOwner(false);
    }
  }

  return (
    <div className={styles.container}>
      {canManageBilling && currentPlanCode !== "SYSTEM_OWNER" && (
        <section style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={handleAssignSystemOwnerPlan}
            disabled={assigningSystemOwner || subscriptionLoading}
          >
            {assigningSystemOwner
              ? "Atribuindo plano interno..."
              : "Atribuir plano interno SYSTEM_OWNER"}
          </button>
        </section>
      )}


      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <CreditCard size={22} />
        </div>

        <div>
          <span className={styles.eyebrow}>Billing</span>
          <h1>Plano e assinatura</h1>
          <p>
            Gerencie o plano comercial e acompanhe a assinatura
            deste Espaço.
          </p>
        </div>
      </header>

      {subscriptionError ? (
        <div className={styles.feedbackError}>
          <strong>Não foi possível carregar a assinatura.</strong>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {actionError ? (
        <div className={styles.feedbackError}>
          <strong>{actionError}</strong>
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => setActionError(null)}
          >
            Fechar
          </button>
        </div>
      ) : null}

      {hasCurrentSubscription && currentPlan ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Assinatura atual</h2>
              <p>
                Confira o plano e o estado comercial deste Espaço.
              </p>
            </div>
          </div>

          <div className={styles.currentCard}>
            <div className={styles.currentMain}>
              <div>
                <span className={styles.eyebrow}>Plano atual</span>
                <h3>{currentPlan.name}</h3>

                {currentPlan.description ? (
                  <p>{currentPlan.description}</p>
                ) : null}
              </div>

              <span
                className={`${styles.status} ${getStatusClass(status)}`}
              >
                {getStatusLabel(status)}
              </span>
            </div>

            <div className={styles.currentDetails}>
              <div className={styles.detail}>
                <Users size={18} />
                <div>
                  <span>Usuários</span>
                  <strong>
                    {currentUsers}
                    {hasUnlimitedUsers
                      ? " / ilimitado"
                      : ` / ${maxUsers ?? currentPlan.maxUsers}`}
                  </strong>
                </div>
              </div>

              {isTrial ? (
                <div className={styles.detail}>
                  <CalendarDays size={18} />
                  <div>
                    <span>Período de teste</span>
                    <strong>
                      {trialDaysRemaining !== null
                        ? `${trialDaysRemaining} dias restantes`
                        : "Encerrado"}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className={styles.detail}>
                  <CalendarDays size={18} />
                  <div>
                    <span>Próximo período</span>
                    <strong>{formatDate(currentPeriodEnd)}</strong>
                  </div>
                </div>
              )}

              <div className={styles.detail}>
                <CreditCard size={18} />
                <div>
                  <span>Valor</span>
                  <strong>
                    {currentPrice
                      ? `${formatCurrency(
                          currentPrice.amount,
                          currentPrice.currency,
                        )} ${getIntervalSuffix(currentPrice.interval)}`
                      : isTrial
                        ? "Período de teste"
                        : "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            {isTrial ? (
              <div className={styles.trialNotice}>
                <CheckCircle size={18} />
                <div>
                  <strong>Você está no período de teste.</strong>
                  <span>
                    Ao escolher um plano pago, a assinatura ficará
                    aguardando a confirmação do pagamento.
                  </span>
                </div>
              </div>
            ) : null}

            {status === "PENDING" ? (
              <div className={styles.pendingNotice}>
                <CreditCard size={18} />
                <div>
                  <strong>Pagamento pendente.</strong>
                  <span>
                    Conclua a confirmação do pagamento antes de
                    alterar o plano desta assinatura.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>
              {hasCurrentSubscription
                ? "Alterar plano"
                : "Planos disponíveis"}
            </h2>
            <p>
              {hasCurrentSubscription
                ? status === "PENDING"
                  ? "Finalize o pagamento pendente antes de alterar o plano."
                  : "Escolha outro plano disponível para este Espaço."
                : "Escolha o plano comercial para este Espaço."}
            </p>
          </div>
        </div>

        {plansLoading || subscriptionLoading ? (
          <div className={styles.loadingGrid}>
            <div className={styles.loadingCard}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
              <div className={styles.loadingBox} />
            </div>
            <div className={styles.loadingCard}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
              <div className={styles.loadingBox} />
            </div>
            <div className={styles.loadingCard}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
              <div className={styles.loadingBox} />
            </div>
          </div>
        ) : plansError ? (
          <div className={styles.feedbackError}>
            <strong>
              Não foi possível carregar os planos disponíveis.
            </strong>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className={styles.emptyState}>
            <CreditCard size={24} />
            <strong>Nenhum plano disponível</strong>
            <span>
              Não existem planos comerciais disponíveis no momento.
            </span>
          </div>
        ) : (
          <div className={styles.plansGrid}>
            {plans
              .filter((plan) => !hasCurrentSubscription || plan.code !== "TRIAL")
              .map((plan) => {
                const isCurrentPlan = plan.code === currentPlanCode;
                const isSelected = plan.code === selectedPlanCode;
                const isPendingChange = plan.code === pendingPlan?.code;
                const planChangeBlocked = status === "PENDING";
                const selectedPrice = getSelectedPrice(plan);
                const hasPrices = plan.prices.length > 0;

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
                      <h3>{plan.name}</h3>

                      {plan.description ? (
                        <p className={styles.planDescription}>
                          {plan.description}
                        </p>
                      ) : null}
                    </div>

                    <div className={styles.price}>
                      {selectedPrice ? (
                        <>
                          <strong>
                            {formatCurrency(
                              selectedPrice.amount,
                              selectedPrice.currency,
                            )}
                          </strong>
                          <span>
                            {getIntervalSuffix(selectedPrice.interval)}
                          </span>
                        </>
                      ) : (
                        <strong>Sem preço disponível</strong>
                      )}
                    </div>
                  </div>

                  {hasPrices ? (
                    <label>
                      <span>Modalidade</span>
                      <Select
                        value={selectedPrice?.id ?? ""}
                        disabled={operationInProgress || isCurrentPlan}
                        onChange={(event) => {
                          setSelectedPriceIds((current) => ({
                            ...current,
                            [plan.code]: event.target.value,
                          }));
                        }}
                      >
                        {plan.prices.map((price) => (
                          <option key={price.id} value={price.id}>
                            {getIntervalLabel(price.interval)} —{" "}
                            {formatCurrency(price.amount, price.currency)}
                          </option>
                        ))}
                      </Select>
                    </label>
                  ) : null}

                  <div className={styles.planUsers}>
                    <Users size={18} />
                    <span>
                      {plan.maxUsers === -1
                        ? "Usuários ilimitados"
                        : `Até ${plan.maxUsers} usuários`}
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
                    disabled={
                      operationInProgress ||
                      isCurrentPlan ||
                      isPendingChange ||
                      planChangeBlocked ||
                      !hasPrices
                    }
                    onClick={() => requestPlanAction(plan)}
                  >
                    {isCurrentPlan
                      ? "Plano atual"
                      : isSelected
                        ? "Processando..."
                        : hasCurrentSubscription
                          ? planChangeBlocked
                            ? "Aguardando pagamento"
                            : "Alterar para este plano"
                          : "Escolher plano"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {pendingPlan && !selectedPlanIsCurrent && status !== "PENDING" ? (
        <div className={styles.confirmation}>
          <div className={styles.confirmationContent}>
            <div>
              <span className={styles.eyebrow}>
                Confirmar alteração
              </span>
              <h2>
                Alterar para {pendingPlan.name}?
              </h2>
              <p>
                A assinatura será alterada para{" "}
                <strong>{pendingPlan.name}</strong>. O backend
                aplicará as regras comerciais e de capacidade
                previstas para a mudança.
              </p>

              {isTrial ? (
                <p>
                  Como a assinatura está em período de teste, a
                  alteração para um plano pago ficará pendente até
                  a confirmação do pagamento.
                </p>
              ) : null}
            </div>

            <div className={styles.confirmationActions}>
              <button
                type="button"
                className={styles.cancelButton}
                disabled={operationInProgress}
                onClick={cancelPlanChange}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.planButton}
                disabled={operationInProgress}
                onClick={() => void handleChangePlan()}
              >
                {changingPlan
                  ? "Alterando..."
                  : "Confirmar alteração"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Histórico de cobranças</h2>
            <p>
              Consulte as faturas e cobranças deste Espaço.
            </p>
          </div>
        </div>

        <InvoiceList />
      </section>
    </div>
  );
}
