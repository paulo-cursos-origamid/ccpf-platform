"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  Button,
  EmailInput,
  Field,
  PasswordInput,
  TextInput,
} from "@/components/ui/forms";

import { billingService } from "@/modules/billing/services/billing.service";
import type {
  BillingInterval,
  PublicPlan,
  PublicPlanPrice,
} from "@/modules/billing/types";

import { useRegister } from "../../../hooks/client";
import {
  getRegistrationPlanLabel,
  normalizeRegistrationPlan,
} from "../../../utils/registration-plan";

import styles from "./RegisterForm.module.scss";

import { Select } from "@/components/ui/forms/Select";
const INTERVAL_PRIORITY: BillingInterval[] = [
  "YEARLY",
  "SEMESTERLY",
  "LIFETIME",
];

const INTERVAL_LABELS: Record<BillingInterval, string> = {
  YEARLY: "Anual",
  SEMESTERLY: "Semestral",
  LIFETIME: "Vitalício",
};

function formatPrice(price: PublicPlanPrice): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}

function sortPrices(prices: PublicPlanPrice[]): PublicPlanPrice[] {
  return [...prices].sort(
    (first, second) =>
      INTERVAL_PRIORITY.indexOf(first.interval) -
      INTERVAL_PRIORITY.indexOf(second.interval),
  );
}

export function RegisterForm() {
  const { register, loading, error } = useRegister();

  const searchParams = useSearchParams();

  const registrationPlan = normalizeRegistrationPlan(
    searchParams.get("plan"),
  );

  const requestedPriceId = searchParams.get("price");

  const [publicPlan, setPublicPlan] = useState<PublicPlan | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(
    requestedPriceId,
  );
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planLoadError, setPlanLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Define o dia de cobrança padrão para modalidades recorrentes.
  const [billingDay, setBillingDay] = useState("8");

  // Define a quantidade de parcelas da Invoice inicial.
  const [installmentCount, setInstallmentCount] = useState("1");

  const [validationError, setValidationError] = useState<string | null>(null);

  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  /**
   * Carrega o catálogo público para resolver o plano e suas
   * modalidades comerciais diretamente da API.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadPublicPlan() {
      setLoadingPlan(true);
      setPlanLoadError(null);

      try {
        const plans = await billingService.listPublicPlans();

        if (cancelled) {
          return;
        }

        const plan = plans.find(
          (item) => item.code.toLowerCase() === registrationPlan,
        );

        if (!plan) {
          setPlanLoadError(
            "O plano selecionado não está disponível para contratação.",
          );
          setPublicPlan(null);
          return;
        }

        setPublicPlan(plan);

        if (plan.code === "TRIAL") {
          setSelectedPriceId(null);
          return;
        }

        const prices = sortPrices(plan.prices);

        const requestedPrice = requestedPriceId
          ? prices.find((price) => price.id === requestedPriceId)
          : undefined;

        setSelectedPriceId(
          requestedPrice?.id ?? prices[0]?.id ?? null,
        );
      } catch {
        if (!cancelled) {
          setPublicPlan(null);
          setPlanLoadError(
            "Não foi possível carregar as modalidades comerciais do plano.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPlan(false);
        }
      }
    }

    void loadPublicPlan();

    return () => {
      cancelled = true;
    };
  }, [registrationPlan, requestedPriceId]);

  const availablePrices = useMemo(
    () => sortPrices(publicPlan?.prices ?? []),
    [publicPlan],
  );

  const selectedPrice = useMemo(
    () =>
      availablePrices.find((price) => price.id === selectedPriceId) ?? null,
    [availablePrices, selectedPriceId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Informe seu nome.");
      return;
    }

    if (!email.trim()) {
      setValidationError("Informe seu e-mail.");
      return;
    }

    if (!password) {
      setValidationError("Informe sua senha.");
      return;
    }

    if (password.length < 8) {
      setValidationError("A senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("As senhas não coincidem.");
      return;
    }

    if (!publicPlan) {
      setValidationError(
        "Não foi possível validar o plano selecionado.",
      );
      return;
    }

    if (publicPlan.code !== "TRIAL" && !selectedPriceId) {
      setValidationError(
        "Selecione uma modalidade comercial para continuar.",
      );
      return;
    }

    const isRecurringPrice =
      selectedPrice?.interval === "YEARLY" ||
      selectedPrice?.interval === "SEMESTERLY";

    if (isRecurringPrice) {
      const parsedBillingDay = Number(billingDay);

      if (
        !Number.isInteger(parsedBillingDay) ||
        parsedBillingDay < 1 ||
        parsedBillingDay > 28
      ) {
        setValidationError(
          "Selecione um dia de cobrança entre 1 e 28.",
        );
        return;
      }
    }

    if (publicPlan.code !== "TRIAL") {
      const parsedInstallmentCount = Number(installmentCount);
      const allowedInstallmentCounts = [1, 2, 3, 6, 12];

      if (
        !Number.isInteger(parsedInstallmentCount) ||
        !allowedInstallmentCounts.includes(parsedInstallmentCount)
      ) {
        setValidationError(
          "Selecione uma quantidade de parcelas válida.",
        );
        return;
      }
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        planCode: publicPlan.code,
        ...(selectedPriceId
          ? {
              planPriceId: selectedPriceId,
            }
          : {}),
        ...(isRecurringPrice
          ? {
              billingDay: Number(billingDay),
            }
          : {}),
        ...(publicPlan.code !== "TRIAL"
          ? {
              installmentCount: Number(installmentCount) as
                | 1
                | 2
                | 3
                | 6
                | 12,
            }
          : {}),
      });

      setRegistrationCompleted(true);
    } catch {
      // O erro é disponibilizado pelo hook.
    }
  }

  const errorMessage =
    validationError ??
    planLoadError ??
    (error instanceof Error ? error.message : null);

  if (registrationCompleted) {
    return (
      <div className={styles.container}>
        <header className={styles.successHeader}>
          <div className={styles.successIcon}>✓</div>

          <h1 className={styles.title}>Cadastro realizado com sucesso!</h1>

          <p className={styles.subtitle}>
            Enviamos um e-mail de confirmação para:
          </p>

          <strong className={styles.email}>{email.trim()}</strong>
        </header>

        <div className={styles.successContent}>
          <p>
            Acesse seu e-mail e clique no link de confirmação para ativar sua
            conta.
          </p>

          <p>
            Plano selecionado:{" "}
            <strong>{getRegistrationPlanLabel(registrationPlan)}</strong>
          </p>

          {selectedPrice && (
            <p>
              Modalidade:{" "}
              <strong>
                {INTERVAL_LABELS[selectedPrice.interval]} —{" "}
                {formatPrice(selectedPrice)}
              </strong>
            </p>
          )}

          <Link href="/check-email" className={styles.verifyButton}>
            Ir para verificar meu e-mail
          </Link>
        </div>

        <footer className={styles.footer}>
          <span>© 2026 CCPF Platform</span>

          <span>Todos os direitos reservados.</span>
        </footer>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>CCPF</div>

        <h1 className={styles.title}>Crie sua conta</h1>

        <p className={styles.subtitle}>
          Cadastre-se para começar a organizar suas finanças
        </p>

        <p className={styles.subtitle}>
          Plano selecionado:{" "}
          <strong>{getRegistrationPlanLabel(registrationPlan)}</strong>
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Nome" htmlFor="name">
          <TextInput
            id="name"
            placeholder="Digite seu nome"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field label="E-mail" htmlFor="email">
          <EmailInput
            id="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field label="Senha" htmlFor="password">
          <PasswordInput
            id="password"
            placeholder="Crie uma senha segura"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <Field label="Confirmar senha" htmlFor="confirmPassword">
          <PasswordInput
            id="confirmPassword"
            placeholder="Digite sua senha novamente"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>

        {!loadingPlan &&
          publicPlan?.code !== "TRIAL" &&
          availablePrices.length > 0 && (
            <fieldset className={styles.pricingFieldset}>
              <legend className={styles.pricingLegend}>
                Modalidade comercial
              </legend>

              <div className={styles.priceOptions}>
                {availablePrices.map((price) => (
                  <label
                    key={price.id}
                    className={`${styles.priceOption} ${
                      selectedPriceId === price.id
                        ? styles.priceOptionSelected
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="planPrice"
                      value={price.id}
                      checked={selectedPriceId === price.id}
                      onChange={() => setSelectedPriceId(price.id)}
                    />

                    <span className={styles.radioIndicator} />

                    <span className={styles.priceContent}>
                      <span className={styles.priceInterval}>
                        {INTERVAL_LABELS[price.interval]}
                      </span>

                      <span className={styles.priceValue}>
                        {formatPrice(price)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {(selectedPrice?.interval === "YEARLY" ||
                selectedPrice?.interval === "SEMESTERLY") && (
                <div className={styles.billingDayField}>
                  <label
                    className={styles.billingDayLabel}
                    htmlFor="billing-day"
                  >
                    Dia de cobrança
                  </label>

                  <Select
                    id="billing-day"
                    name="billingDay"
                    className={styles.billingDaySelect}
                    value={billingDay}
                    onChange={(event) => setBillingDay(event.target.value)}
                  >
                    {Array.from({ length: 28 }, (_, index) => {
                      const day = index + 1;

                      return (
                        <option key={day} value={day}>
                          Dia {day}
                        </option>
                      );
                    })}
                  </Select>

                  <p className={styles.billingDayHint}>
                    A cobrança recorrente será programada para o dia escolhido
                    de cada período.
                  </p>
                </div>
              )}

              {publicPlan?.code !== "TRIAL" && (
                <div className={styles.installmentField}>
                  <label
                    className={styles.installmentLabel}
                    htmlFor="installment-count"
                  >
                    Número de parcelas
                  </label>

                  <Select
                    id="installment-count"
                    name="installmentCount"
                    className={styles.installmentSelect}
                    value={installmentCount}
                    onChange={(event) =>
                      setInstallmentCount(event.target.value)
                    }
                  >
                    <option value="1">1x — à vista</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="6">6x</option>
                    <option value="12">12x</option>
                  </Select>

                  <p className={styles.installmentHint}>
                    O valor e o vencimento de cada parcela serão calculados
                    automaticamente pelo sistema.
                  </p>
                </div>
              )}
            </fieldset>
          )}

        {!loadingPlan &&
          publicPlan?.code !== "TRIAL" &&
          availablePrices.length === 0 && (
            <div className={styles.error} role="alert">
              Este plano não possui nenhuma modalidade comercial disponível.
            </div>
          )}

        {publicPlan?.code === "TRIAL" && (
          <div className={styles.trialNotice}>
            <strong>14 dias grátis</strong>
            <span>
              Comece gratuitamente e organize suas finanças sem compromisso.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          loading={loading || loadingPlan}
          disabled={
            loadingPlan ||
            !publicPlan ||
            (publicPlan.code !== "TRIAL" && !selectedPriceId)
          }
        >
          Criar minha conta
        </Button>

        <div className={styles.loginPrompt}>
          <span>Já possui uma conta?</span>

          <a href="/login" className={styles.loginLink}>
            Entrar
          </a>
        </div>
      </form>

      <footer className={styles.footer}>
        <span>© 2026 CCPF Platform</span>

        <span>Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}
