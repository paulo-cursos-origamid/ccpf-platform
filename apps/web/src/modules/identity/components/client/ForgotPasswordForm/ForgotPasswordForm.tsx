"use client";

import { useState } from "react";

import { Button, EmailInput, Field } from "@/components/ui/forms";

import { useForgotPassword } from "../../../hooks/client";

import styles from "./ForgotPasswordForm.module.scss";
import { AuthHeader } from "../../shared";

interface ForgotPasswordFormProps {
  onSuccess: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const { forgotPassword, loading } = useForgotPassword();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    try {
      await forgotPassword({ email });
      onSuccess();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar as instruções. Tente novamente.",
      );
    }
  }

  return (
    <div className={styles.container}>
      <AuthHeader
        title="Esqueceu sua senha?"
        subtitle="Informe seu e-mail e enviaremos as instruções para redefinir sua senha."
      />
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="E-mail" htmlFor="email">
          <EmailInput
            id="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        {error && <p className={styles.error}>{error}</p>}

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={!email.trim()}
        >
          Enviar instruções
        </Button>
      </form>
    </div>
  );
}
