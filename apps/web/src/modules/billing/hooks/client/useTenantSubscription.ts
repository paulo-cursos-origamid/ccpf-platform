"use client";

import { useCallback, useEffect, useState } from "react";

import { useTenantStore } from "@/modules/tenant/stores";
import { tenantService } from "@/modules/tenant/services";

import { billingService } from "../../services";
import type { PublicPlan, Subscription, SubscriptionStatus } from "../../types";

export interface TenantSubscriptionState {
  subscription: Subscription | null;
  plan: PublicPlan | null;

  currentUsers: number;
  maxUsers: number | null;
  hasUnlimitedUsers: boolean;

  status: SubscriptionStatus | null;

  isTrial: boolean;
  isActive: boolean;
  hasCommercialAccess: boolean;

  trialDaysRemaining: number | null;
  currentPeriodEnd: string | null;

  loading: boolean;
  error: unknown;

  reload: () => Promise<void>;
}

/**
 * Calcula a quantidade de dias restantes até uma determinada data.
 *
 * Retorna:
 * - null quando não existe uma data válida;
 * - 0 quando a data já expirou;
 * - a quantidade de dias restantes quando ainda está vigente.
 */
function calculateRemainingDays(
  targetDate: string | null,
  referenceDate: Date = new Date(),
): number | null {
  if (!targetDate) {
    return null;
  }

  const target = new Date(targetDate);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const difference = target.getTime() - referenceDate.getTime();

  if (difference <= 0) {
    return 0;
  }

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

/**
 * Hook responsável por carregar as informações comerciais
 * da assinatura do Tenant.
 *
 * Também calcula a utilização atual do limite de usuários
 * definido pelo plano contratado.
 */
export function useTenantSubscription(): TenantSubscriptionState {
  const activeTenantId = useTenantStore((state) => state.activeTenantId);

  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [plan, setPlan] = useState<PublicPlan | null>(null);

  const [currentUsers, setCurrentUsers] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadSubscription = useCallback(
    async (isCancelled?: () => boolean) => {
      /**
       * Sem Tenant ativo, não existe assinatura nem limite
       * de usuários para carregar.
       */
      if (!activeTenantId) {
        setSubscription(null);
        setPlan(null);
        setCurrentUsers(0);
        setError(null);
        setLoading(false);

        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [currentSubscription, publicPlans, members] = await Promise.all([
          billingService.getCurrentSubscription(),
          billingService.listPublicPlans(),
          tenantService.listMembers(),
        ]);

        if (isCancelled?.()) {
          return;
        }

        setSubscription(currentSubscription);

        /**
         * Localiza o plano correspondente à assinatura atual.
         */
        const currentPlan =
          currentSubscription === null
            ? null
            : (publicPlans.find(
                (item) => item.id === currentSubscription.planId,
              ) ?? null);

        setPlan(currentPlan);

        /**
         * O backend considera qualquer vínculo diferente de
         * REMOVED como ocupante de uma vaga do plano.
         *
         * Portanto:
         * - ACTIVE ocupa uma vaga;
         * - BLOCKED ocupa uma vaga;
         * - INVITED ocupa uma vaga;
         * - REMOVED não ocupa uma vaga.
         *
         * Somente REMOVED libera uma vaga.
         */
        const billableMembers = members.filter(
          (member) => member.status !== "REMOVED",
        );

        setCurrentUsers(billableMembers.length);
      } catch (error) {
        if (isCancelled?.()) {
          return;
        }

        setSubscription(null);
        setPlan(null);
        setCurrentUsers(0);
        setError(error);
      } finally {
        if (!isCancelled?.()) {
          setLoading(false);
        }
      }
    },
    [activeTenantId],
  );

  useEffect(() => {
    let cancelled = false;

    /**
     * A carga é iniciada no próximo microtask.
     *
     * Isso evita chamadas síncronas de setState durante
     * a execução direta do effect, atendendo à regra
     * react-hooks/set-state-in-effect.
     */
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      void loadSubscription(() => cancelled);
    });

    return () => {
      cancelled = true;
    };
  }, [loadSubscription]);

  const status = subscription?.status ?? null;

  const isTrial = status === "TRIALING";
  const isActive = status === "ACTIVE";

  const trialDaysRemaining = isTrial
    ? calculateRemainingDays(subscription?.trialEndsAt ?? null)
    : null;

  /**
   * O acesso comercial é válido quando:
   * - a assinatura está ACTIVE; ou
   * - está em TRIALING e o período ainda não terminou.
   */
  const hasCommercialAccess =
    isActive || (isTrial && (trialDaysRemaining ?? 0) > 0);

  /**
   * maxUsers = -1 representa plano sem limite de usuários.
   */
  const hasUnlimitedUsers = plan?.maxUsers === -1;

  /**
   * Para planos ilimitados retornamos null para representar
   * ausência de limite numérico.
   */
  const maxUsers = plan ? (hasUnlimitedUsers ? null : plan.maxUsers) : null;

  /**
   * Recarrega assinatura, plano e utilização de usuários.
   */
  const reload = useCallback(async () => {
    await loadSubscription();
  }, [loadSubscription]);

  return {
    subscription,
    plan,

    currentUsers,
    maxUsers,
    hasUnlimitedUsers,

    status,

    isTrial,
    isActive,
    hasCommercialAccess,

    trialDaysRemaining,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,

    loading,
    error,

    reload,
  };
}
