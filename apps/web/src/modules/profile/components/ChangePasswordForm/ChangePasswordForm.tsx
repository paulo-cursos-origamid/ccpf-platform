"use client";

import { useState } from "react";

import { Button, Card, Field, PasswordInput } from "@/components/ui";

import { useChangePassword } from "@/modules/profile/hooks/client";

import styles from "./ChangePasswordForm.module.scss";

type ChangePasswordFormProps = {
  onSuccess: () => void;
};

export function ChangePasswordForm({
  onSuccess,
}: ChangePasswordFormProps) {
  const { changePassword, loading, error } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "Não foi possível alterar a senha.";
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSuccessMessage("");
    setValidationError("");

    if (newPassword !== confirmPassword) {
      setValidationError("As senhas não coincidem.");
      return;
    }

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMessage(
        response.message || "Senha alterada com sucesso.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch {
      // O erro já é tratado pelo hook.
    }
  }

  const displayError =
    validationError || (error ? getErrorMessage(error) : "");

  const isSuccess = Boolean(successMessage);
  const isDisabled = loading || isSuccess;

  return (
    <Card className={styles.card} outlined>
      <div className={styles.header}>
        <h2 className={styles.title}>Alterar senha</h2>

        <p className={styles.description}>
          Atualize sua senha de acesso à plataforma.
        </p>
      </div>

      {displayError && (
        <div className={styles.error} role="alert">
          {displayError}
        </div>
      )}

      {successMessage && (
        <div className={styles.success} role="status">
          {successMessage}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field
          label="Senha atual"
          htmlFor="current-password"
          required
        >
          <PasswordInput
            id="current-password"
            name="currentPassword"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
            disabled={isDisabled}
            autoComplete="current-password"
            required
          />
        </Field>

        <Field
          label="Nova senha"
          htmlFor="new-password"
          required
        >
          <PasswordInput
            id="new-password"
            name="newPassword"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            disabled={isDisabled}
            autoComplete="new-password"
            required
          />
        </Field>

        <Field
          label="Confirmar nova senha"
          htmlFor="confirm-password"
          required
        >
          <PasswordInput
            id="confirm-password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            disabled={isDisabled}
            autoComplete="new-password"
            required
          />
        </Field>

        <div className={styles.actions}>
          <Button
            type="submit"
            loading={loading}
            disabled={isDisabled}
          >
            Alterar senha
          </Button>
        </div>
      </form>
    </Card>
  );
}
