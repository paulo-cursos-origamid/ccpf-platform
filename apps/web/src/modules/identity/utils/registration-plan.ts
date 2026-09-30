/**
 * Plano comercial selecionado pelo usuário durante o cadastro.
 *
 * Essa informação representa apenas a intenção de contratação.
 * A assinatura real continua sendo criada e controlada pelo backend.
 */
export type RegistrationPlan =
  | "trial"
  | "basic"
  | "pro"
  | "premium";

const STORAGE_KEY = "ccpf.registration.plan";

const VALID_PLANS: RegistrationPlan[] = [
  "trial",
  "basic",
  "pro",
  "premium",
];

/**
 * Normaliza o código recebido da Landing Page.
 *
 * A Landing envia o código do plano em lowercase:
 * trial, basic, pro ou premium.
 */
export function normalizeRegistrationPlan(
  value: string | null | undefined,
): RegistrationPlan {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized &&
    VALID_PLANS.includes(normalized as RegistrationPlan)
  ) {
    return normalized as RegistrationPlan;
  }

  return "trial";
}

/**
 * Persiste a intenção de contratação para ser recuperada
 * posteriormente durante o fluxo de autenticação.
 */
export function saveRegistrationPlan(
  plan: RegistrationPlan,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, plan);
}

/**
 * Recupera o plano selecionado durante o cadastro.
 *
 * Quando não existe seleção, o fluxo assume TRIAL.
 */
export function getRegistrationPlan(): RegistrationPlan {
  if (typeof window === "undefined") {
    return "trial";
  }

  return normalizeRegistrationPlan(
    window.localStorage.getItem(STORAGE_KEY),
  );
}

/**
 * Remove a intenção de contratação depois que ela tiver sido
 * consumida pelo fluxo pós-login.
 */
export function clearRegistrationPlan(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Retorna o nome comercial apresentado ao usuário.
 */
export function getRegistrationPlanLabel(
  plan: RegistrationPlan,
): string {
  const labels: Record<RegistrationPlan, string> = {
    trial: "Plano Trial",
    basic: "Plano Básico",
    pro: "Plano Pro",
    premium: "Plano Premium",
  };

  return labels[plan];
}
