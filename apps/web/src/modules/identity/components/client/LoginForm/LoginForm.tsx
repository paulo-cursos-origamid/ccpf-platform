"use client";

import { useState } from "react";

import {
  Button,
  EmailInput,
  Field,
  PasswordInput,
} from "@/components/ui/forms";

import { useLogin } from "../../../hooks/client";

import styles from "./LoginForm.module.scss";

export function LoginForm() {
  const { login, loading } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await login({
      email,
      password,
    });
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          CCPF
        </div>

        <h1 className={styles.title}>
          Bem-vindo de volta!
        </h1>

        <p className={styles.subtitle}>
          Faça login para acessar sua conta
        </p>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        <Field
          label="E-mail"
          htmlFor="email"
        >
          <EmailInput
            id="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field
          label="Senha"
          htmlFor="password"
        >
          <PasswordInput
            id="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.forgotPassword}
          >
            Esqueceu sua senha?
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
        >
          Entrar
        </Button>

        <div className={styles.divider}>
          <span />
          <span className={styles.dividerText}>
            ou
          </span>
          <span />
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
        >
          Acessar com SSO
        </Button>
      </form>

      <footer className={styles.footer}>
        <span>© 2026 CCPF Platform</span>

        <span>Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}