"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  billingService,
  type PlanFeatureCode,
  type PublicPlan,
} from "@/modules/billing";

import styles from "./Pricing.module.scss";

/**
 * Textos de apresentação das features comerciais.
 *
 * Os códigos pertencem ao domínio Billing do backend.
 * Estes textos pertencem exclusivamente à camada de apresentação.
 */
const featureLabels: Record<PlanFeatureCode, string> = {
  DOMESTIC: "Gastos domésticos",
  HEALTH: "Saúde",
  TRANSPORT: "Transportes",
  VEHICLES: "Veículos",
  INVESTMENTS: "Investimentos",
  OTHER: "Outros",
  BASIC_REPORTS: "Relatórios básicos",
  ADVANCED_REPORTS: "Relatórios avançados",
};

/**
 * Formata o preço recebido do backend conforme a moeda do plano.
 */
function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Retorna o texto correspondente ao intervalo de cobrança.
 */
function getBillingIntervalLabel(
  interval: PublicPlan["billingInterval"],
): string {
  return interval === "YEARLY" ? "por ano" : "por mês";
}

/**
 * Retorna a descrição apresentada para o limite de usuários.
 */
function getUsersLabel(maxUsers: number): string {
  return maxUsers === 1 ? "1 usuário" : `Até ${maxUsers} usuários`;
}

/**
 * Seção pública de planos comerciais do CCPF.
 *
 * Responsabilidades:
 * - carregar os planos públicos disponibilizados pelo Billing;
 * - apresentar os dados comerciais retornados pela API;
 * - encaminhar o visitante para o cadastro com o plano selecionado;
 * - tratar estados de carregamento e erro.
 *
 * O componente não possui preços ou limites comerciais hardcoded.
 * O backend permanece como fonte oficial dessas informações.
 */
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

  return (
    <section id="planos" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <span>Planos</span>

          <h2>
            Um produto preparado para
            <strong> crescer com você.</strong>
          </h2>

          <p>
            Escolha o plano que acompanha a forma como você organiza,
            compartilha e acompanha sua vida financeira.
          </p>
        </div>

        {isLoading && (
          <div className={styles.grid} aria-label="Carregando planos">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={styles.skeletonCard}
                aria-hidden="true"
              >
                <div className={styles.skeletonBadge} />
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonDescription} />
                <div className={styles.skeletonPrice} />

                <div className={styles.skeletonFeature} />
                <div className={styles.skeletonFeature} />
                <div className={styles.skeletonFeature} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && hasError && (
          <div className={styles.feedback}>
            <h3>Não foi possível carregar os planos.</h3>

            <p>Verifique sua conexão e tente novamente.</p>

            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void loadPlans()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !hasError && plans.length === 0 && (
          <div className={styles.feedback}>
            <h3>Planos indisponíveis no momento.</h3>

            <p>Estamos preparando as opções comerciais do CCPF.</p>
          </div>
        )}

        {!isLoading && !hasError && plans.length > 0 && (
          <div className={styles.grid}>
            {plans.map((plan) => {
              const isFeatured = plan.code === "PRO";

              return (
                <article
                  key={plan.id}
                  className={`${styles.planCard} ${
                    isFeatured ? styles.featured : ""
                  }`}
                >
                  {isFeatured && (
                    <span className={styles.featuredBadge}>Mais completo</span>
                  )}

                  <div className={styles.planHeader}>
                    <span className={styles.planName}>{plan.name}</span>

                    {plan.description && (
                      <p className={styles.planDescription}>
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className={styles.price}>
                    <strong>{formatPrice(plan.price, plan.currency)}</strong>

                    <span>{getBillingIntervalLabel(plan.billingInterval)}</span>
                  </div>

                  <div className={styles.userLimit}>
                    {getUsersLabel(plan.maxUsers)}
                  </div>

                  <ul className={styles.features}>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <span className={styles.featureMark}>✓</span>

                        <span>{featureLabels[feature]}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/register?plan=${encodeURIComponent(plan.code.toLowerCase())}`}
                    className={`${styles.cta} ${
                      isFeatured ? styles.ctaFeatured : ""
                    }`}
                  >
                    Começar agora
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
