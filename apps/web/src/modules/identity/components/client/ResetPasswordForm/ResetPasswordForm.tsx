"use client";

import { useState } from "react";

import { Button, Field, PasswordInput } from "@/components/ui/forms";

import { useResetPassword } from "../../../hooks/client";

import { AuthHeader } from "../..";

import styles from "./ResetPasswordForm.module.scss";

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export function ResetPasswordForm({
  token,
  onSuccess,
}: ResetPasswordFormProps) {
  const { resetPassword, loading } = useResetPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!newPassword.trim()) {
      setError("Digite sua nova senha.");
      return;
    }

    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("O link de recuperação é inválido ou expirou.");
      return;
    }

    try {
      await resetPassword({
        token,
        newPassword,
      });

      onSuccess();
    } catch {
      setError(
        "O link de recuperação é inválido ou expirou. Solicite um novo link para redefinir sua senha.",
      );
    }
  }

  return (
    <div className={styles.container}>
      <AuthHeader
        title="Redefinir senha"
        subtitle="Digite sua nova senha para recuperar o acesso à sua conta."
      />

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Nova senha" htmlFor="new-password">
          <PasswordInput
            id="new-password"
            placeholder="Digite sua nova senha"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>

        <Field label="Confirmar senha" htmlFor="confirm-password">
          <PasswordInput
            id="confirm-password"
            placeholder="Digite sua senha novamente"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>

        {error && <p className={styles.error}>{error}</p>}

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={!newPassword.trim() || !confirmPassword.trim() || !token}
        >
          Redefinir senha
        </Button>
      </form>
    </div>
  );
}
