"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  billingService,
  type PlanFeatureCode,
  type PublicPlan,
} from "@/modules/billing";

import type { BillingInterval, PublicPlanPrice } from "@/modules/billing/types";

import styles from "./Pricing.module.scss";

const featureLabels: Record<PlanFeatureCode, string> = {
  DOMESTIC: "Gastos domésticos",
  HEALTH: "Saúde",
  TRANSPORT: "Transportes",
  VEHICLES: "Veículos",
  INVESTMENTS: "Investimentos",
  OTHER: "Outros",
  BASIC_REPORTS: "Relatórios básicos",
  ADVANCED_REPORTS: "Relatórios avançados",
  BILLING: "Gestão de cobrança",
};

/**
 * Formata um valor comercial usando a moeda informada pelo backend.
 *
 * A Landing não mantém preço ou moeda hardcoded.
 */
function formatPrice(price: number, currency: string): string {
  const normalizedCurrency = currency?.trim().toUpperCase();

  if (!normalizedCurrency || !Number.isFinite(price)) {
    return "Preço indisponível";
  }

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
    }).format(price);
  } catch {
    return "Preço indisponível";
  }
}

/**
 * Resolve o preço comercial padrão do plano.
 *
 * Ordem comercial adotada:
 * YEARLY → SEMESTERLY → LIFETIME.
 *
 * O plano TRIAL não possui PlanPrice e, portanto, retorna null.
 */
function getDefaultPrice(plan: PublicPlan): PublicPlanPrice | null {
  const prices = Array.isArray(plan.prices) ? plan.prices : [];

  return (
    prices.find((price) => price.interval === "YEARLY") ??
    prices.find((price) => price.interval === "SEMESTERLY") ??
    prices.find((price) => price.interval === "LIFETIME") ??
    null
  );
}

/**
 * Retorna a descrição comercial da modalidade.
 */
function getBillingIntervalLabel(interval: BillingInterval): string {
  switch (interval) {
    case "SEMESTERLY":
      return "por semestre";

    case "YEARLY":
      return "por ano";

    case "LIFETIME":
      return "pagamento único";

    default:
      return "modalidade de cobrança";
  }
}

/**
 * Retorna a quantidade de usuários permitida pelo plano.
 */
function getUsersLabel(maxUsers: number): string {
  if (maxUsers === -1) {
    return "Usuários ilimitados";
  }

  if (maxUsers === 1) {
    return "1 usuário";
  }

  return `Até ${maxUsers} usuários`;
}

/**
 * Mantém a apresentação comercial do plano TRIAL.
 *
 * O TRIAL não possui PlanPrice porque não é uma modalidade paga.
 */
function getTrialPriceLabel(plan: PublicPlan): string | null {
  if (plan.code !== "TRIAL") {
    return null;
  }

  return "14 dias grátis";
}

/**
 * Resolve a classe visual do plano pelo código comercial.
 *
 * O estilo não depende mais da posição do card no grid.
 */
function getPlanClassName(plan: PublicPlan): string {
  switch (plan.code) {
    case "TRIAL":
      return styles.trial;

    case "BASIC":
      return styles.basic;

    case "PRO":
      return styles.pro;

    case "PREMIUM":
      return styles.premium;

    default:
      return "";
  }
}

export function Pricing() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const publicPlans = await billingService.listPublicPlans();
      setPlans(publicPlans);
    } catch {
      setPlans([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    billingService
      .listPublicPlans()
      .then((publicPlans) => {
        if (!isMounted) {
          return;
        }

        setPlans(publicPlans);
        setHasError(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setPlans([]);
        setHasError(true);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const orderedPlans = [...plans].sort((first, second) => {
    const firstPrice = getDefaultPrice(first);
    const secondPrice = getDefaultPrice(second);

    if (first.code === "TRIAL") {
      return -1;
    }

    if (second.code === "TRIAL") {
      return 1;
    }

    return (
      (firstPrice?.amount ?? Number.MAX_SAFE_INTEGER) -
      (secondPrice?.amount ?? Number.MAX_SAFE_INTEGER)
    );
  });

  return (
    <section id="planos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>PLANOS</span>

          <h2>
            Escolha o plano ideal
            <span> para sua vida financeira</span>
          </h2>

          <p>
            Comece gratuitamente e evolua conforme suas necessidades. Todos os
            planos são carregados diretamente da plataforma.
          </p>
        </div>

        {isLoading && (
          <div className={styles.grid} aria-label="Carregando planos">
            {[1, 2, 3, 4].map((item) => (
              <article key={item} className={styles.skeletonCard}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonPrice} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLine} />
              </article>
            ))}
          </div>
        )}

        {!isLoading && hasError && (
          <div className={styles.feedback}>
            <strong>Não foi possível carregar os planos.</strong>

            <p>Tente novamente em alguns instantes.</p>

            <button
              type="button"
              className={styles.retry}
              onClick={() => void loadPlans()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !hasError && orderedPlans.length === 0 && (
          <div className={styles.feedback}>
            <strong>Nenhum plano disponível no momento.</strong>

            <p>Tente novamente mais tarde.</p>

            <button
              type="button"
              className={styles.retry}
              onClick={() => void loadPlans()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !hasError && orderedPlans.length > 0 && (
          <div className={styles.grid}>
            {orderedPlans.map((plan) => {
              const isFeatured = plan.code === "PRO";
              const price = getDefaultPrice(plan);
              const trialPriceLabel = getTrialPriceLabel(plan);
              const hasCommercialPrice = price !== null;

              const planClassName = getPlanClassName(plan);

              const registrationHref = hasCommercialPrice
                ? `/register?plan=${encodeURIComponent(
                    plan.code.toLowerCase(),
                  )}&price=${encodeURIComponent(price.id)}`
                : `/register?plan=${encodeURIComponent(
                    plan.code.toLowerCase(),
                  )}`;

              return (
                <article
                  key={plan.id}
                  className={`${styles.planCard} ${planClassName} ${
                    isFeatured ? styles.featured : ""
                  }`}
                >
                  {isFeatured && (
                    <span className={styles.featuredBadge}>Mais escolhido</span>
                  )}

                  <div className={styles.planCardHeader}>
                    <span className={styles.planName}>{plan.name}</span>

                    {plan.description && (
                      <p className={styles.planDescription}>{plan.description}</p>
                    )}
                  </div>

                  <div className={styles.price}>
                    {trialPriceLabel ? (
                      <>
                        <strong>{trialPriceLabel}</strong>
                        <span>sem compromisso</span>
                      </>
                    ) : price ? (
                      <>
                        <strong>
                          {formatPrice(price.amount, price.currency)}
                        </strong>

                        <span>{getBillingIntervalLabel(price.interval)}</span>
                      </>
                    ) : (
                      <>
                        <strong>Indisponível</strong>
                        <span>consulte disponibilidade</span>
                      </>
                    )}
                  </div>

                  <div className={styles.userLimit}>
                    {getUsersLabel(plan.maxUsers)}
                  </div>

                  <ul className={styles.features}>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span aria-hidden="true">✓</span>
                        <span>{featureLabels[feature] ?? feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={registrationHref} className={styles.cta}>
                    {plan.code === "TRIAL" ? "Começar grátis" : "Começar agora"}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
