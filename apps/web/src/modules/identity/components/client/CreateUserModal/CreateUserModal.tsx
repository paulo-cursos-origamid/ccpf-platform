"use client";

import { useState } from "react";

import {
  Button,
  EmailInput,
  Field,
  PasswordInput,
  TextInput,
} from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import { useRegister } from "../../../hooks/client";

import styles from "./CreateUserModal.module.scss";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function CreateUserModal({
  open,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { register, loading, error } = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Informe o nome do usuário.");
      return;
    }

    if (!email.trim()) {
      setValidationError("Informe o e-mail do usuário.");
      return;
    }

    if (!password) {
      setValidationError("Informe uma senha.");
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
      });

      await onSuccess();

      handleClose();
    } catch {
      // O erro já está disponível através do hook.
    }
  }

  function handleClose() {
    if (loading) {
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setValidationError(null);

    onClose();
  }

  const errorMessage =
    validationError ?? (error instanceof Error ? error.message : null);

  return (
    <Modal open={open} onClose={handleClose} title="Novo usuário">
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Nome" htmlFor="create-user-name" required>
          <TextInput
            id="create-user-name"
            placeholder="Digite o nome"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
          />
        </Field>

        <Field label="E-mail" htmlFor="create-user-email" required>
          <EmailInput
            id="create-user-email"
            placeholder="Digite o e-mail"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
          />
        </Field>

        <Field label="Senha" htmlFor="create-user-password" required>
          <PasswordInput
            id="create-user-password"
            placeholder="Digite uma senha"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </Field>

        <Field
          label="Confirmar senha"
          htmlFor="create-user-confirm-password"
          required
        >
          <PasswordInput
            id="create-user-confirm-password"
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={loading}
          />
        </Field>

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button type="submit" loading={loading} disabled={loading}>
            Criar usuário
          </Button>
        </div>
      </form>
    </Modal>
  );
}
