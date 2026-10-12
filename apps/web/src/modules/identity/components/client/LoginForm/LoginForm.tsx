"use client";

import { useState } from "react";
import { ApiError } from "@/lib/http/fetcher";
import Link from "next/link";

import {
  Button,
  EmailInput,
  Field,
  PasswordInput,
} from "@/components/ui/forms";

import { useLogin } from "../../../hooks/client";

import styles from "./LoginForm.module.scss";
import { AuthHeader } from "../..";

export function LoginForm() {
  const { login, loading } = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    try {
      await login({
        email,
        password,
      });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          setErrorMessage("E-mail ou senha inválidos. Confira seus dados e tente novamente.");
          return;
        }

        if (error.statusCode === 403) {
          setErrorMessage(
            error.message && error.message !== "Forbidden"
              ? error.message
              : "Sua conta não tem permissão para acessar o sistema. Entre em contato com o suporte.",
          );
          return;
        }

        if (error.statusCode >= 500) {
          setErrorMessage("O serviço está temporariamente indisponível. Tente novamente em instantes.");
          return;
        }

        if (error.message && error.message !== "Ocorreu um erro ao processar a solicitação.") {
          setErrorMessage(error.message);
          return;
        }
      }

      if (error instanceof TypeError) {
        setErrorMessage("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
        return;
      }

      setErrorMessage("Não foi possível entrar. Tente novamente. Se o problema continuar, entre em contato com o suporte.");
    }
  }

  return (
    <div className={styles.container}>
      <AuthHeader
        title="Bem-vindo de volta!"
        subtitle="Faça login para acessar sua conta"
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="E-mail" htmlFor="email">
          <EmailInput
            id="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errorMessage) setErrorMessage("");
            }}
          />
        </Field>

        <Field label="Senha" htmlFor="password">
          <PasswordInput
            id="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errorMessage) setErrorMessage("");
            }}
          />
        </Field>

        {errorMessage && (
          <div className={styles.errorMessage} role="alert" aria-live="assertive">
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/forgot-password" className={styles.forgotPassword}>
            Esqueceu sua senha?
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          Entrar
        </Button>

        <div className={styles.divider}>
          <span />
          <span className={styles.dividerText}>ou</span>
          <span />
        </div>

        {/* <Button type="button" variant="outline" fullWidth>
          Acessar com SSO
        </Button> */}
        <Link href="/register" className={styles.createAccount}>
          Criar nova conta
        </Link>
      </form>

      <footer className={styles.footer}>
        <span>© 2026 CCPF Platform</span>

        <span>Todos os direitos reservados.</span>
      </footer>
    </div>
  );
}
