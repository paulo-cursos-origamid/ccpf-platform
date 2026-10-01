"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  Button,
  EmailInput,
  Field,
  PasswordInput,
  TextInput,
} from "@/components/ui/forms";

import { useRegister } from "../../../hooks/client";
import {
  getRegistrationPlanLabel,
  normalizeRegistrationPlan,
} from "../../../utils/registration-plan";

import styles from "./RegisterForm.module.scss";

export function RegisterForm() {
  const { register, loading, error } = useRegister();

  const searchParams = useSearchParams();

  const registrationPlan = normalizeRegistrationPlan(
    searchParams.get("plan"),
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);

  const [registrationCompleted, setRegistrationCompleted] = useState(false);

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

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        planCode: registrationPlan.toUpperCase(),
      });

      setRegistrationCompleted(true);
    } catch {
      // O erro é disponibilizado pelo hook.
    }
  }

  const errorMessage =
    validationError ?? (error instanceof Error ? error.message : null);

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

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading}>
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
